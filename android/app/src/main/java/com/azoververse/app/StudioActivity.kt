package com.azoververse.app

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.lifecycleScope
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebViewClient
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

open class StudioActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureHighRefreshRateDisplay()
    }

    @SuppressLint("JavascriptInterface")
    override fun load() {
        // Inject OververseNativeAuth BEFORE Capacitor calls webView.loadUrl(appUrl)
        val initialWebView = findViewById<WebView>(com.getcapacitor.android.R.id.webview)
        initialWebView?.addJavascriptInterface(OververseNativeAuthBridge(), "OververseNativeAuth")

        super.load()

        configureOververseWebView()
    }

    /**
     * Native Android Credential Manager Google Sign-In (replaces disallowed WebView OAuth).
     */
    fun launchGoogleSignIn() {
        val webClientId = getString(R.string.default_web_client_id)

        // In your Sign In with Google button click
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(webClientId) // from Firebase / google-services.json
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        lifecycleScope.launch {
            try {
                val result = CredentialManager.create(this@StudioActivity)
                    .getCredential(context = this@StudioActivity, request = request)
                val googleIdToken = GoogleIdTokenCredential.createFrom(result.credential.data)
                // Now you have googleIdToken.id — send it to your OVERVERSE backend
                signInToOververseWithToken(googleIdToken.idToken, googleIdToken.id)
            } catch (e: Exception) {
                Log.e("OVERVERSE", "Sign-in failed: ${e.message}")
                notifyWebViewSignInError(e.message ?: "Google Sign-In cancelled or failed.")
            }
        }
    }

    /**
     * Sends the verified Google ID token to the OVERVERSE backend and authenticates
     * the active Firebase session inside the app without opening accounts.google.com in WebView.
     */
    private fun signInToOververseWithToken(idToken: String, accountEmail: String = "") {
        lifecycleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val backendBase = getString(R.string.oververse_backend_url).trimEnd('/')
                    val endpoint = URL("$backendBase/api/auth/google")
                    val connection = (endpoint.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        connectTimeout = 8000
                        readTimeout = 8000
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json")
                        setRequestProperty("Accept", "application/json")
                    }
                    val payload = JSONObject().apply {
                        put("idToken", idToken)
                        if (accountEmail.isNotEmpty()) {
                            put("email", accountEmail)
                        }
                    }
                    OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                        writer.write(payload.toString())
                        writer.flush()
                    }
                    val statusCode = connection.responseCode
                    Log.i("OVERVERSE", "OVERVERSE backend token verification status: $statusCode")
                    connection.disconnect()
                }
            } catch (e: Exception) {
                Log.w("OVERVERSE", "Backend verification notice (continuing with Firebase credential): ${e.message}")
            }

            deliverGoogleIdTokenToApp(idToken, accountEmail)
        }
    }

    private fun deliverGoogleIdTokenToApp(idToken: String, accountEmail: String) {
        val webView = this.bridge?.webView ?: return
        val escapedToken = JSONObject.quote(idToken)
        val escapedEmail = JSONObject.quote(accountEmail)
        val js = """
            (function() {
              if (typeof window.__onOververseNativeGoogleToken === 'function') {
                window.__onOververseNativeGoogleToken($escapedToken, $escapedEmail);
              }
              window.dispatchEvent(new CustomEvent('oververse_native_google_token', {
                detail: { idToken: $escapedToken, email: $escapedEmail }
              }));
            })();
        """.trimIndent()
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    private fun notifyWebViewSignInError(errorMessage: String) {
        val webView = this.bridge?.webView ?: return
        val escapedMsg = JSONObject.quote(errorMessage)
        val js = """
            (function() {
              if (typeof window.__onOververseNativeGoogleError === 'function') {
                window.__onOververseNativeGoogleError($escapedMsg);
              }
              window.dispatchEvent(new CustomEvent('oververse_native_google_error', {
                detail: { error: $escapedMsg }
              }));
            })();
        """.trimIndent()
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    inner class OververseNativeAuthBridge {
        @JavascriptInterface
        fun signInWithGoogle() {
            runOnUiThread {
                launchGoogleSignIn()
            }
        }

        @JavascriptInterface
        fun getWebClientId(): String {
            return getString(R.string.default_web_client_id)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureOververseWebView() {
        val capacitorBridge = this.bridge ?: return
        val webView = capacitorBridge.webView ?: return

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.setBackgroundColor(Color.parseColor("#000000"))
        webView.overScrollMode = View.OVER_SCROLL_NEVER

        val settings = webView.settings
        settings.displayZoomControls = false
        settings.builtInZoomControls = false
        settings.setSupportZoom(false)
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.setSupportMultipleWindows(false)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            settings.offscreenPreRaster = true
        }

        // Block any attempt to open https://accounts.google.com inside WebView and route to CredentialManager
        webView.webViewClient = object : BridgeWebViewClient(capacitorBridge) {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val host = request.url?.host?.lowercase() ?: ""
                if (host == "accounts.google.com" || host.endsWith(".accounts.google.com")) {
                    Log.i("OVERVERSE", "Intercepted accounts.google.com in WebView; launching native CredentialManager")
                    runOnUiThread { launchGoogleSignIn() }
                    return true
                }
                return super.shouldOverrideUrlLoading(view, request)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                val lower = url.lowercase()
                if (lower.startsWith("https://accounts.google.com") || lower.contains("://accounts.google.com/")) {
                    Log.i("OVERVERSE", "Intercepted accounts.google.com URL in WebView; launching native CredentialManager")
                    runOnUiThread { launchGoogleSignIn() }
                    return true
                }
                return super.shouldOverrideUrlLoading(view, url)
            }
        }
    }

    private fun configureHighRefreshRateDisplay() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                val display = display
                if (display != null) {
                    val modes = display.supportedModes
                    var maxMode = modes.firstOrNull()
                    var maxRate = 60.0f
                    for (mode in modes) {
                        if (mode.refreshRate > maxRate) {
                            maxRate = mode.refreshRate
                            maxMode = mode
                        }
                    }
                    val params: WindowManager.LayoutParams = window.attributes
                    if (maxMode != null) {
                        params.preferredDisplayModeId = maxMode.modeId
                    }
                    if (Build.VERSION.SDK_INT >= 34) {
                        val targetRate = maxOf(120.0f, maxRate)
                        params.preferredMinDisplayRefreshRate = targetRate
                        params.preferredMaxDisplayRefreshRate = targetRate
                    }
                    window.attributes = params
                }
            } catch (ignored: Exception) {
                // Fallback gracefully on custom vendor ROMs
            }
        }
    }
}

package com.kaplus.mangapulse;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Android WebView API 34+ with 120Hz high-refresh rate optimization
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Display display = getDisplay();
                if (display != null) {
                    Display.Mode[] modes = display.getSupportedModes();
                    Display.Mode maxMode = null;
                    float maxRate = 60.0f;
                    for (Display.Mode mode : modes) {
                        if (mode.getRefreshRate() > maxRate) {
                            maxRate = mode.getRefreshRate();
                            maxMode = mode;
                        }
                    }
                    WindowManager.LayoutParams params = getWindow().getAttributes();
                    if (maxMode != null) {
                        params.preferredDisplayModeId = maxMode.getModeId();
                    }
                    // Explicit 120Hz+ refresh rate lock for ultra-smooth vertical manga scrolling on API 34+
                    float targetRate = Math.max(120.0f, maxRate);
                    params.preferredMinDisplayRefreshRate = targetRate;
                    params.preferredMaxDisplayRefreshRate = targetRate;
                    getWindow().setAttributes(params);
                }
            } catch (Exception e) {
                // Fallback gracefully on custom vendor ROMs
            }
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            View webView = this.bridge.getWebView();
            
            // Force hardware acceleration layer for 120fps GPU compositing
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setBackgroundColor(Color.parseColor("#0a0d14"));
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            WebSettings settings = this.bridge.getWebView().getSettings();
            
            // WebViewer Component: Uncheck ZoomDisplay
            settings.setDisplayZoomControls(false);
            settings.setBuiltInZoomControls(false);
            
            // WebViewer Component: Uncheck SupportZoom (this stops enlarge/shrink)
            settings.setSupportZoom(false);
            
            // WebViewer Component: Check UseWideViewPort = TRUE
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            
            // Storage, Caching & Performance Accelerations
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Offscreen pre-rasterization eliminates checkerboard jank during fast 120Hz scrolling
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                settings.setOffscreenPreRaster(true);
            }
            
            // Modern Android 14+ (API 34+) WebView UserAgent string
            settings.setUserAgentString("Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 AZOververse/1.0");
        }
    }
}

package com.azoververse.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // High-refresh rate display optimization (API 30+ mode selection, API 34+ explicit frame rate range)
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
                    if (Build.VERSION.SDK_INT >= 34) {
                        float targetRate = Math.max(120.0f, maxRate);
                        params.preferredMinDisplayRefreshRate = targetRate;
                        params.preferredMaxDisplayRefreshRate = targetRate;
                    }
                    getWindow().setAttributes(params);
                }
            } catch (Exception ignored) {
                // Fallback gracefully on custom vendor ROMs
            }
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            View webView = this.bridge.getWebView();

            // Force hardware acceleration layer for smooth GPU compositing
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setBackgroundColor(Color.parseColor("#000000"));
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            WebSettings settings = this.bridge.getWebView().getSettings();

            // WebViewer Component: Uncheck ZoomDisplay & SupportZoom
            settings.setDisplayZoomControls(false);
            settings.setBuiltInZoomControls(false);
            settings.setSupportZoom(false);

            // WebViewer Component: Check UseWideViewPort = TRUE
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);

            // Storage, Caching & Performance Accelerations
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                settings.setOffscreenPreRaster(true);
            }

            settings.setUserAgentString("Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 AZOververse/1.0.2");
        }
    }
}

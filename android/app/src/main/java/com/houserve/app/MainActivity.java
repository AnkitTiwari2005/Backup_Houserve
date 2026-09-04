package com.houserve.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly switch from the SplashScreen launch theme to NoActionBar theme.
        // This prevents the native ActionBar (black strip) from appearing on OEM ROMs
        // (Samsung/Xiaomi/MIUI) that may revert to the base AppTheme after splash.
        setTheme(R.style.AppTheme_NoActionBar);

        // Ensure the app does NOT draw behind system bars (status bar / nav bar).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        super.onCreate(savedInstanceState);

        // Fix: Modify User-Agent to remove the WebView indicator ("; wv")
        // Razorpay's JS SDK detects WebView via user-agent and hides UPI.
        // By removing "; wv", Razorpay treats this as a regular mobile browser
        // and shows all payment methods including UPI.
        // This does NOT replace Capacitor's WebViewClient, keeping all
        // Capacitor functionality (local file serving, plugins, etc.) intact.
        WebView webView = getBridge().getWebView();
        String userAgent = webView.getSettings().getUserAgentString();
        webView.getSettings().setUserAgentString(userAgent.replace("; wv", ""));
    }
}

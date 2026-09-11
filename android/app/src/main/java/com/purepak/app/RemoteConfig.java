package com.purepak.app;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Resolves the backend server URL from a small, stable pointer file — NOT
 * from the backend itself, since the backend's own domain is exactly what
 * might change. Moving the backend later is then just: edit that one file,
 * commit, push — every installed app picks up the new address on its next
 * launch. No rebuild, no new APK, no Play Store update.
 *
 * The pointer lives in the app's own public GitHub repo (a URL that never
 * needs to change), at /mobile-config.json — see that file for the format.
 */
class RemoteConfig {
    private static final String TAG = "PurePakConfig";
    private static final String POINTER_URL =
            "https://raw.githubusercontent.com/zaindroid/purepak/main/mobile-config.json";
    // last-resort default if the pointer is unreachable and nothing is cached yet
    static final String FALLBACK_URL = "https://purepak.zaindroid.me";

    interface Callback { void onResolved(String url); }

    /** Tries the pointer first (keeps installs current); falls back to
     *  whatever's cached, then to FALLBACK_URL. Callback fires on the main
     *  thread, and always receives a non-empty URL. */
    static void resolve(String cachedUrl, Callback cb) {
        new Thread(() -> {
            String resolved = fetchPointer();
            String result = resolved != null ? resolved
                    : (cachedUrl != null && !cachedUrl.isEmpty() ? cachedUrl : FALLBACK_URL);
            new Handler(Looper.getMainLooper()).post(() -> cb.onResolved(result));
        }, "purepak-remote-config").start();
    }

    private static String fetchPointer() {
        HttpURLConnection c = null;
        try {
            URL u = new URL(POINTER_URL);
            c = (HttpURLConnection) u.openConnection();
            c.setConnectTimeout(4000);
            c.setReadTimeout(4000);
            c.setRequestMethod("GET");
            c.connect();
            if (c.getResponseCode() != 200) return null;
            StringBuilder sb = new StringBuilder();
            BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            r.close();
            String url = new JSONObject(sb.toString()).optString("server_url", "").trim();
            if (url.isEmpty()) return null;
            return url.replaceAll("/+$", "");
        } catch (Exception e) {
            Log.w(TAG, "pointer fetch failed: " + e.getMessage());
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }
}

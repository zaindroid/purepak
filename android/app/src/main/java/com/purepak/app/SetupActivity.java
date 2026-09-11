package com.purepak.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Advanced / override screen — reached via the Settings gear, not shown on
 * first launch. Normal use never touches this: MainActivity resolves the
 * live server automatically (see RemoteConfig). This screen exists for
 * pointing the app at a local dev server on the same Wi-Fi, or as a manual
 * escape hatch if the automatic address is ever wrong.
 */
public class SetupActivity extends AppCompatActivity {
    public static final String PREFS = "purepak";
    public static final String KEY_HOST = "server_host";   // stores a full URL, e.g. https://purepak.zaindroid.me
    public static final String KEY_MANUAL = "server_manual"; // true once the user has explicitly overridden it

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setup);

        EditText et = findViewById(R.id.etHost);
        Button btn = findViewById(R.id.btnConnect);
        Button btnDefault = findViewById(R.id.btnUseDefault);
        final ProgressBar pb = findViewById(R.id.pb);
        final TextView tvErr = findViewById(R.id.tvError);

        SharedPreferences sp = getSharedPreferences(PREFS, MODE_PRIVATE);
        String saved = sp.getString(KEY_HOST, "");
        if (!TextUtils.isEmpty(saved)) et.setText(saved);

        btn.setOnClickListener(v -> {
            String host = normalize(et.getText().toString());
            tvErr.setVisibility(View.GONE);
            if (host.isEmpty()) {
                tvErr.setText("Please enter a server address.");
                tvErr.setVisibility(View.VISIBLE);
                return;
            }
            btn.setEnabled(false);
            pb.setVisibility(View.VISIBLE);
            new Thread(() -> {
                boolean ok = probe(host);
                runOnUiThread(() -> {
                    pb.setVisibility(View.GONE);
                    btn.setEnabled(true);
                    if (ok) {
                        sp.edit().putString(KEY_HOST, hostToUrl(host)).putBoolean(KEY_MANUAL, true).apply();
                        goToApp();
                    } else {
                        tvErr.setText(R.string.connect_fail);
                        tvErr.setVisibility(View.VISIBLE);
                    }
                });
            }).start();
        });

        // clears the manual override — MainActivity goes back to resolving
        // the live server automatically on next launch
        btnDefault.setOnClickListener(v -> {
            sp.edit().remove(KEY_HOST).putBoolean(KEY_MANUAL, false).apply();
            goToApp();
        });
    }

    private void goToApp() {
        Intent i = new Intent(SetupActivity.this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
    }

    static String normalize(String raw) {
        if (TextUtils.isEmpty(raw)) return "";
        return raw.trim().replaceAll("/+$", "");
    }

    // keeps an explicit scheme if the user typed one (e.g. https://mydomain.com);
    // otherwise assumes a bare LAN address (e.g. 192.168.1.20:4310) over plain http
    static String hostToUrl(String raw) {
        String h = normalize(raw);
        if (h.isEmpty()) return "";
        return h.matches("(?i)^https?://.*") ? h : "http://" + h;
    }

    static boolean probe(String host) {
        try {
            URL u = new URL(hostToUrl(host) + "/api/products");
            HttpURLConnection c = (HttpURLConnection) u.openConnection();
            c.setConnectTimeout(6000);
            c.setReadTimeout(6000);
            c.setRequestMethod("GET");
            c.connect();
            int code = c.getResponseCode();
            c.disconnect();
            // 200 = reachable with API; 401/404 fine too (server up)
            return code >= 200 && code < 500;
        } catch (IOException e) {
            return false;
        }
    }
}

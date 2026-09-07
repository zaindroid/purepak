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
 * First-run / settings screen: capture the PurePak server address, verify it
 * is reachable, and store it.
 */
public class SetupActivity extends AppCompatActivity {
    public static final String PREFS = "purepak";
    public static final String KEY_HOST = "server_host";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_setup);

        EditText et = findViewById(R.id.etHost);
        Button btn = findViewById(R.id.btnConnect);
        final ProgressBar pb = findViewById(R.id.pb);
        final TextView tvErr = findViewById(R.id.tvError);

        SharedPreferences sp = getSharedPreferences(PREFS, MODE_PRIVATE);
        String saved = sp.getString(KEY_HOST, "");
        if (!TextUtils.isEmpty(saved)) et.setText(saved);

        btn.setOnClickListener(v -> {
            String host = normalize(et.getText().toString().trim());
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
                        sp.edit().putString(KEY_HOST, host).apply();
                        Intent i = new Intent(SetupActivity.this, MainActivity.class);
                        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(i);
                    } else {
                        tvErr.setText(R.string.connect_fail);
                        tvErr.setVisibility(View.VISIBLE);
                    }
                });
            }).start();
        });
    }

    static String normalize(String raw) {
        if (TextUtils.isEmpty(raw)) return "";
        String h = raw.trim();
        h = h.replaceFirst("^https?://", "");
        h = h.replaceAll("/+$", "");
        return h;
    }

    static String hostToUrl(String host) {
        return "http://" + normalize(host);
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

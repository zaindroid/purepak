package com.purepak.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebChromeClient.FileChooserParams;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Hosts the PurePak web dashboard in a native WebView.
 * - Resolves which server to load via RemoteConfig (auto) or a manual
 *   override saved in SetupActivity (advanced/local-dev use only)
 * - JS bridge window.PurePak for app-side hooks (toast, settings)
 * - Native back button => in-page history, then exit
 * - Geolocation (rider GPS for smart route) + file/camera picker (receipt scanning)
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "PurePak";
    private static final int REQ_LOCATION = 42;

    private WebView web;
    private ProgressBar pb;
    private View splashOverlay;
    private boolean splashHidden = false;
    private String serverHost = "";
    private int serverPort = 80;

    // pending web-file input (receipt camera)
    private ValueCallback<Uri[]> fileCb;
    private Uri cameraUri;

    private final ActivityResultLauncher<Intent> pickImage = registerForActivityResult(
            new androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult(),
            r -> {
                if (fileCb == null) return;
                Uri u = null;
                if (r.getResultCode() == Activity.RESULT_OK) {
                    Intent di = r.getData();
                    if (di != null && di.getData() != null) u = di.getData();
                    else if (cameraUri != null) u = cameraUri; // camera capture writes to this file; getData() is null
                }
                cameraUri = null;
                if (u == null && fileCb != null) {
                    Toast.makeText(MainActivity.this, "No image received", Toast.LENGTH_SHORT).show();
                }
                fileCb.onReceiveValue(u != null ? new Uri[]{u} : null);
                fileCb = null;
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        web = findViewById(R.id.web);
        pb = findViewById(R.id.pbLoad);
        splashOverlay = findViewById(R.id.splashOverlay);
        splashShownAt = SystemClock.uptimeMillis();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView v, int progress) {
                pb.setVisibility(progress == 100 ? View.GONE : View.VISIBLE);
            }

            // ---- GPS prompt: the web app's geolocation.getCurrentPosition() ----
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback cb) {
                Log.i(TAG, "geolocation prompt from " + origin);
                // grant for this origin for the session (standard pattern, all API levels)
                cb.invoke(origin, true, true);
            }

            // ---- <input type="file"> (receipt scanner) ----
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb,
                    FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try {
                    boolean isImage = params.getAcceptTypes() != null
                            && params.getAcceptTypes().length > 0
                            && params.getAcceptTypes()[0].startsWith("image");
                    if (params.isCaptureEnabled() && isImage) {
                        // camera capture -> FileProvider temp file
                        Uri out = cameraCaptureUri();
                        if (out == null) {
                            // FileProvider missing — fall back to gallery so scanning still works
                            Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                            pick.addCategory(Intent.CATEGORY_OPENABLE);
                            pick.setType("image/*");
                            pickImage.launch(pick);
                            return true;
                        }
                        cameraUri = out;
                        Intent take = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        take.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                        pickImage.launch(take);
                    } else {
                        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                        pick.addCategory(Intent.CATEGORY_OPENABLE);
                        pick.setType(isImage ? "image/*" : "*/*");
                        pickImage.launch(pick);
                    }
                } catch (ActivityNotFoundException e) {
                    fileCb = null;
                    Toast.makeText(MainActivity.this, "No app to pick images", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                String scheme = u.getScheme();
                if ("tel".equals(scheme) || "mailto".equals(scheme) || "sms".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, u));
                    } catch (ActivityNotFoundException ignored) {
                    }
                    return true;
                }
                // WhatsApp deep links -> open in WhatsApp (falls back to browser)
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
                    if (host.equals("wa.me") || host.contains("whatsapp")) {
                        try {
                            startActivity(new Intent(Intent.ACTION_VIEW, u));
                        } catch (ActivityNotFoundException ignored) {
                        }
                        return true;
                    }
                    String pageHost = u.getHost();
                    int pagePort = u.getPort() != -1 ? u.getPort() : ("http".equals(scheme) ? 80 : 443);
                    boolean sameServer = pageHost != null && pageHost.equalsIgnoreCase(serverHost)
                            && pagePort == serverPort;
                    if (sameServer) return false; // keep in webview
                    // external link -> open in browser
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, u));
                    } catch (ActivityNotFoundException ignored) {
                    }
                    return true;
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView v, String url, Bitmap favicon) {
                pb.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                pb.setVisibility(View.GONE);
                dismissSplash();
            }
        });

        // JS bridge: window.PurePak.{toast, openSettings, version}
        web.addJavascriptInterface(new Bridge(), "PurePak");

        findViewById(R.id.btnRefresh).setOnClickListener(v -> web.reload());
        findViewById(R.id.btnSettings).setOnClickListener(v -> {
            Intent i = new Intent(this, SetupActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(i);
        });

        // location permission — needed before GPS works for the smart route
        ensureLocationPermission();

        // Resolve which server to load. A manual override (set via the
        // Settings gear, e.g. for local dev on the same Wi-Fi) always wins;
        // otherwise we ask the live pointer for the current address on every
        // launch, so moving the backend to a new domain later needs no app
        // update — see RemoteConfig.
        SharedPreferences sp = getSharedPreferences(SetupActivity.PREFS, MODE_PRIVATE);
        String cached = sp.getString(SetupActivity.KEY_HOST, "");
        boolean manual = sp.getBoolean(SetupActivity.KEY_MANUAL, false);
        if (manual && !cached.isEmpty()) {
            startWithHost(cached);
        } else {
            RemoteConfig.resolve(cached, resolved -> {
                if (!resolved.equals(cached)) sp.edit().putString(SetupActivity.KEY_HOST, resolved).apply();
                startWithHost(resolved);
            });
        }

        // Safety: never leave the user stuck on the splash if the page stalls.
        splashOverlay.postDelayed(this::dismissSplash, SPLASH_MAX_MS);
    }

    private void startWithHost(String base) {
        Uri bu = Uri.parse(base);
        serverHost = bu.getHost() == null ? "" : bu.getHost();
        serverPort = bu.getPort() != -1 ? bu.getPort() : ("https".equals(bu.getScheme()) ? 443 : 80);
        web.loadUrl(base);
    }

    private void ensureLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            showLocationPermissionDialog();
        }
    }

    private boolean locationDeclined = false;

    private void showLocationPermissionDialog() {
        if (locationDeclined) return; // user chose "Not now" — don't nag again this session
        new AlertDialog.Builder(this)
                .setView(R.layout.dialog_location)
                .setCancelable(true)
                .setPositiveButton(R.string.perm_allow, (d, w) -> {
                    locationDeclined = false;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, REQ_LOCATION);
                })
                .setNegativeButton(R.string.perm_not_now, (d, w) -> locationDeclined = true)
                .create()
                .show();
    }

    @Override
    public void onRequestPermissionsResult(int req, @NonNull String[] perms, @NonNull int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == REQ_LOCATION) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            Log.i(TAG, "location permission: " + (ok ? "granted" : "denied"));
            if (!ok) {
                Toast.makeText(this, "Location denied — GPS route optimisation is off", Toast.LENGTH_LONG).show();
            }
        }
    }

    /**
     * Fades out the branded splash once the web app's first page has rendered.
     * It stays up at least {@link #SPLASH_MIN_MS} so it never flashes, and a
     * safety timer dismisses it even if the page stalls, so the user is never
     * stuck on the splash.
     */
    private static final long SPLASH_MIN_MS = 1600;
    private static final long SPLASH_MAX_MS = 9000;
    private long splashShownAt = 0L;

    private void dismissSplash() {
        if (splashHidden) return;
        splashHidden = true;
        long wait = SPLASH_MIN_MS - (SystemClock.uptimeMillis() - splashShownAt);
        runOnUiThread(() -> {
            if (splashOverlay == null) return;
            if (wait > 0) {
                splashOverlay.postDelayed(() -> fadeOutSplash(), wait);
            } else {
                fadeOutSplash();
            }
        });
    }

    private void fadeOutSplash() {
        if (splashOverlay == null) return;
        splashOverlay.setAlpha(1f);
        splashOverlay.animate().alpha(0f).setDuration(420)
                .withEndAction(() -> splashOverlay.setVisibility(View.GONE));
    }

    private Uri cameraCaptureUri() {
        File dir = new File(getExternalFilesDir(null), "receipts");
        if (!dir.exists()) dir.mkdirs();
        String name = "receipt_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date()) + ".jpg";
        File f = new File(dir, name);
        try {
            return FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", f);
        } catch (IllegalArgumentException e) {
            Log.e(TAG, "FileProvider failed", e);
            return null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    public class Bridge {
        @android.webkit.JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show());
        }

        @android.webkit.JavascriptInterface
        public void openSettings() {
            startActivity(new Intent(MainActivity.this, SetupActivity.class));
        }

        @android.webkit.JavascriptInterface
        public String version() {
            return "1.6";
        }
    }
}

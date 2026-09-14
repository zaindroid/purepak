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
import android.os.Build;
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
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Hosts the PurePak web dashboard in a native WebView.
 * - Resolves which server to load via RemoteConfig (auto) or a manual
 *   override saved in SetupActivity (advanced/local-dev use only)
 * - JS bridge window.PurePak for app-side hooks (toast, settings)
 * - Native back button => in-page history, then exit
 * - Geolocation (rider GPS for smart route) + file/camera picker (receipt scanning)
 * - Push notifications (FCM): hands the device token to the page
 *   (window.onPushToken) and, if launched/resumed from a tapped
 *   notification, its "ref" (window.onPushOpen) — see
 *   PurePakFirebaseMessagingService and app.js's App.routeByRef.
 */
public class MainActivity extends AppCompatActivity {
    public static final String EXTRA_PUSH_REF = "push_ref";
    private static final int REQ_NOTIFICATIONS = 43;

    private static final String TAG = "PurePak";
    private static final int REQ_LOCATION = 42;

    // same Web client ID the website's Google Sign-In button uses — Credential
    // Manager authenticates natively (Google blocks its OAuth flow inside a
    // WebView) but still requests an ID token audienced to this client, so
    // the server verifies it through the exact same /api/auth/google path
    private static final String GOOGLE_WEB_CLIENT_ID = "674062502521-hc2pc7oan27ru1hkleslofoc6lr5uqbq.apps.googleusercontent.com";
    private final Executor bgExecutor = Executors.newSingleThreadExecutor();

    // fingerprint/face unlock — a local app-open gate, not a second account
    // credential; the real session still lives in the WebView's own storage.
    // KEY_BIOMETRIC_ENABLED lives on SetupActivity (its Security toggle owns
    // the canonical value); this one is asked once, ever, right after login.
    private static final String KEY_BIOMETRIC_PROMPTED = "biometric_prompted";

    private WebView web;
    private ProgressBar pb;
    private View splashOverlay;
    private boolean splashHidden = false;
    private String serverHost = "";
    private int serverPort = 80;
    private String pendingPushRef = null; // consumed once the page has loaded

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
        pendingPushRef = getIntent().getStringExtra(EXTRA_PUSH_REF);

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
                // any other custom scheme (whatsapp://, intent://, etc.) — hand it
                // to the OS instead of silently swallowing the tap
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) {
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
                deliverPushToken();
                if (pendingPushRef != null) { sendPushRefToPage(pendingPushRef); pendingPushRef = null; }
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
        // notification permission — required at runtime on Android 13+ for
        // any push to actually show; harmless no-op on older versions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
        }

        // Safety: never leave the user stuck on the splash if the page stalls.
        splashOverlay.postDelayed(this::dismissSplash, SPLASH_MAX_MS);

        // If fingerprint/face unlock is turned on, the app is a locked box
        // until that succeeds — nothing below has loaded the web content yet,
        // so there's nothing sensitive on screen to protect prematurely.
        SharedPreferences sp = getSharedPreferences(SetupActivity.PREFS, MODE_PRIVATE);
        if (sp.getBoolean(SetupActivity.KEY_BIOMETRIC_ENABLED, false)) {
            showBiometricLock(this::resolveAndLoad);
        } else {
            resolveAndLoad();
        }
    }

    // Resolve which server to load. A manual override (set via the Settings
    // gear, e.g. for local dev on the same Wi-Fi) always wins; otherwise we
    // ask the live pointer for the current address on every launch, so
    // moving the backend to a new domain later needs no app update — see
    // RemoteConfig. Called only after any biometric lock has cleared.
    private void resolveAndLoad() {
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
    }

    private void startWithHost(String base) {
        Uri bu = Uri.parse(base);
        serverHost = bu.getHost() == null ? "" : bu.getHost();
        serverPort = bu.getPort() != -1 ? bu.getPort() : ("https".equals(bu.getScheme()) ? 443 : 80);
        web.loadUrl(base);
    }

    // launchMode="singleTask" means a tapped notification while the app is
    // already running arrives here instead of a fresh onCreate — the page is
    // already loaded, so route immediately rather than waiting for onPageFinished
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String ref = intent.getStringExtra(EXTRA_PUSH_REF);
        if (ref != null && web != null) sendPushRefToPage(ref);
    }

    private void sendPushRefToPage(String ref) {
        web.evaluateJavascript("window.onPushOpen && window.onPushOpen(" + JSONObject.quote(ref) + ")", null);
    }

    // FirebaseMessaging.getToken() always returns the current token (fetching
    // and caching one on first call), whether or not it has ever rotated —
    // simpler and just as reliable as forwarding onNewToken() across components.
    private void deliverPushToken() {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || web == null) return;
            String token = task.getResult();
            runOnUiThread(() -> web.evaluateJavascript(
                    "window.onPushToken && window.onPushToken(" + JSONObject.quote(token) + ")", null));
        });
    }

    // triggered from the page (window.PurePak.signInWithGoogle(), see Bridge
    // below) when it detects it's running inside this app instead of a plain
    // browser tab, since Google refuses its own web sign-in flow in a WebView
    private void startGoogleSignIn() {
        CredentialManager cm = CredentialManager.create(this);
        GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(GOOGLE_WEB_CLIENT_ID).build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option).build();
        cm.getCredentialAsync(this, request, new android.os.CancellationSignal(), bgExecutor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        String idToken = null;
                        try {
                            idToken = GoogleIdTokenCredential.createFrom(result.getCredential().getData()).getIdToken();
                        } catch (Exception e) {
                            Log.e(TAG, "Google credential parse failed", e);
                        }
                        final String tok = idToken;
                        runOnUiThread(() -> sendGoogleTokenToPage(tok));
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException e) {
                        Log.w(TAG, "Google sign-in cancelled/failed: " + e.getMessage());
                        runOnUiThread(() -> sendGoogleTokenToPage(null));
                    }
                });
    }

    private void sendGoogleTokenToPage(String idToken) {
        if (web == null) return;
        String arg = idToken == null ? "null" : JSONObject.quote(idToken);
        web.evaluateJavascript("window.onNativeGoogleSignIn && window.onNativeGoogleSignIn(" + arg + ")", null);
    }

    // Shows the system fingerprint/face prompt, falling back to the device's
    // own PIN/pattern (DEVICE_CREDENTIAL) if biometrics aren't set up right
    // now. If the hardware genuinely isn't usable at all, don't block the
    // user from their own app over it — just proceed.
    private void showBiometricLock(Runnable onSuccess) {
        BiometricManager bm = BiometricManager.from(this);
        int can = bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
        if (can != BiometricManager.BIOMETRIC_SUCCESS) { onSuccess.run(); return; }

        BiometricPrompt prompt = new BiometricPrompt(this, ContextCompat.getMainExecutor(this),
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        onSuccess.run();
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        // cancelled or locked out — offer a retry rather than
                        // leave the app stuck on the splash with no way forward
                        showBiometricRetry(onSuccess);
                    }
                });
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock PurePak")
                .setSubtitle("Verify it's you to continue")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL)
                .build();
        prompt.authenticate(info);
    }

    private void showBiometricRetry(Runnable onSuccess) {
        new AlertDialog.Builder(this)
                .setTitle("Unlock required")
                .setMessage("Verify it's you to continue using PurePak.")
                .setCancelable(false)
                .setPositiveButton("Try again", (d, w) -> showBiometricLock(onSuccess))
                .setNegativeButton("Turn off lock", (d, w) -> {
                    getSharedPreferences(SetupActivity.PREFS, MODE_PRIVATE).edit()
                            .putBoolean(SetupActivity.KEY_BIOMETRIC_ENABLED, false).apply();
                    onSuccess.run();
                })
                .show();
    }

    // Offered exactly once, right after a real login succeeds (see
    // window.PurePak.notifyLoggedIn(), called from app.js's App.enter()) —
    // never nags again regardless of the answer.
    private void maybeOfferBiometricEnable() {
        SharedPreferences sp = getSharedPreferences(SetupActivity.PREFS, MODE_PRIVATE);
        if (sp.getBoolean(KEY_BIOMETRIC_PROMPTED, false)) return;
        BiometricManager bm = BiometricManager.from(this);
        int can = bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
        if (can != BiometricManager.BIOMETRIC_SUCCESS) return; // nothing enrolled — don't even ask
        new AlertDialog.Builder(this)
                .setTitle("Enable fingerprint unlock?")
                .setMessage("Next time you open PurePak, verify it's you with your fingerprint or face — so the app isn't left open to anyone who picks up your phone.")
                .setPositiveButton("Enable", (d, w) -> sp.edit()
                        .putBoolean(SetupActivity.KEY_BIOMETRIC_ENABLED, true).putBoolean(KEY_BIOMETRIC_PROMPTED, true).apply())
                .setNegativeButton("Not now", (d, w) -> sp.edit().putBoolean(KEY_BIOMETRIC_PROMPTED, true).apply())
                .show();
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
        } else if (req == REQ_NOTIFICATIONS) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            Log.i(TAG, "notification permission: " + (ok ? "granted" : "denied"));
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
            return "2.0";
        }

        // the page calls this instead of rendering Google's own web button,
        // once it detects window.PurePak.signInWithGoogle exists
        @android.webkit.JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(MainActivity.this::startGoogleSignIn);
        }

        // called from app.js's App.enter() every time a login succeeds —
        // offers the one-time "enable fingerprint unlock" prompt
        @android.webkit.JavascriptInterface
        public void notifyLoggedIn() {
            runOnUiThread(MainActivity.this::maybeOfferBiometricEnable);
        }
    }
}

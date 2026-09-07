# PurePak — R8/ProGuard rules
#
# The native JS bridge (com.purepak.app.MainActivity$Bridge) is exposed to the
# web app via addJavascriptInterface(). R8 must:
#   1. keep the annotated methods (not rename/prune them), and
#   2. KEEP the @JavascriptInterface annotation itself — WebView only exposes
#      methods that carry it at runtime; a pruned annotation = dead bridge.
#
# -keepclasseswithmembers keeps the annotated methods AND their annotation.
-keepclasseswithmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the Bridge class name stable so reflection/debugging stays sane.
-keep class com.purepak.app.MainActivity$Bridge { *; }

# WebView loads a remote page; no other web stack in use.
-dontwarn java.net.**

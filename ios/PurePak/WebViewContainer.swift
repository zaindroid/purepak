import SwiftUI
import WebKit

/// SwiftUI wrapper around WKWebView. Mirrors MainActivity.java's WebView
/// setup: same JS bridge surface (window.PurePak), same link-routing rules
/// (tel/mailto/sms -> system, wa.me -> WhatsApp, same-origin -> stay in the
/// WebView, anything else -> system browser), same renderer-crash recovery,
/// same file-picker hookup for the receipt scanner.
struct WebViewContainer: UIViewRepresentable {
    @ObservedObject var model: WebViewModel

    static let bridgeJS = """
    (function () {
      function send(method, extra) {
        var msg = Object.assign({ method: method }, extra || {});
        window.webkit.messageHandlers.purepak.postMessage(msg);
      }
      window.PurePak = {
        toast: function (msg) { send('toast', { msg: msg }); },
        openSettings: function () { send('openSettings'); },
        // never actually read by app.js today (only existence-checked), so a
        // fixed string is fine — see web/app.js's window.PurePak.signInWithGoogle checks
        version: function () { return '1.0'; },
        signInWithGoogle: function () { send('signInWithGoogle'); },
        notifyLoggedIn: function () { send('notifyLoggedIn'); },
      };
    })();
    """

    func makeCoordinator() -> Coordinator { Coordinator(model: model) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "purepak")
        contentController.addUserScript(
            WKUserScript(source: Self.bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = contentController
        config.websiteDataStore = .default() // persistent cookies/localStorage across launches, like Android's CookieManager setup

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = true

        context.coordinator.webView = webView
        model.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        let model: WebViewModel
        weak var webView: WKWebView?

        init(model: WebViewModel) { self.model = model }

        // ---- JS -> native: window.PurePak.* ----
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any], let method = body["method"] as? String else { return }
            switch method {
            case "toast":
                model.toastMessage = body["msg"] as? String
            case "openSettings":
                model.showSettings = true
            case "signInWithGoogle":
                model.requestGoogleSignIn()
            case "notifyLoggedIn":
                model.offerBiometricEnableIfNeeded()
            default:
                break
            }
        }

        // ---- link routing (mirrors shouldOverrideUrlLoading) ----
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.allow); return }
            let scheme = (url.scheme ?? "").lowercased()

            if scheme == "tel" || scheme == "mailto" || scheme == "sms" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            if scheme == "http" || scheme == "https" {
                let host = (url.host ?? "").lowercased()
                if host == "wa.me" || host.contains("whatsapp") {
                    UIApplication.shared.open(url)
                    decisionHandler(.cancel)
                    return
                }
                let pagePort = url.port ?? (scheme == "https" ? 443 : 80)
                let sameServer = host == model.serverHost && pagePort == model.serverPort
                if sameServer { decisionHandler(.allow); return }
                UIApplication.shared.open(url) // external link -> system browser
                decisionHandler(.cancel)
                return
            }
            // any other custom scheme (whatsapp://, etc.) — hand it to the OS
            // instead of silently swallowing the tap
            if UIApplication.shared.canOpenURL(url) { UIApplication.shared.open(url) }
            decisionHandler(.cancel)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.isLoading = false
            model.dismissSplash()
            model.deliverPushToken()
            model.flushPendingPushRef()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            model.isLoading = false
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            model.isLoading = false
        }

        // WKWebView's equivalent of onRenderProcessGone — the content process
        // can be killed under memory pressure (e.g. several full-resolution
        // receipt photos rendered in the receipts list). Reload rather than
        // leaving a blank/frozen WebView on screen.
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            print("PurePak: WebView content process terminated — reloading")
            webView.reload()
        }

        // ---- <input type="file"> (receipt scanner camera/photo picker) ----
        // WKUIDelegate only gained this callback on iOS in 18.4 (it was
        // macOS/Catalyst-only before) — deployment target here is 15.0, so
        // this stays unimplemented pre-18.4, same as before Apple added it.
        @available(iOS 18.4, *)
        func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
            model.presentFilePicker(completion: completionHandler)
        }

        // WKWebView doesn't natively surface JS alert/confirm dialogs — wire
        // them to a native alert so a page calling one doesn't just do nothing
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            model.presentAlert(message: message, completion: completionHandler)
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            model.presentConfirm(message: message, completion: completionHandler)
        }
    }
}

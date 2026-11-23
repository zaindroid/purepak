import UIKit
import WebKit
import FirebaseMessaging
import GoogleSignIn

/// Hosts the PurePak web dashboard in a native WKWebView — the iOS
/// counterpart of android/.../MainActivity.java. Keep behavior in sync with
/// that file; the comments below point at the matching Android logic.
final class ViewController: UIViewController {
    static var pendingPushRef: String?

    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var splashView: UIView!
    private var progressObservation: NSKeyValueObservation?

    private var serverHost: String = ""
    private var serverPort: Int = 443
    private var splashHidden = false
    private let splashMinSeconds: TimeInterval = 1.6
    private let splashMaxSeconds: TimeInterval = 9.0
    private var splashShownAt: Date = Date()

    // pending <input type="file"> completion for the receipt camera/picker
    private var fileCompletion: (([URL]?) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        setupWebView()
        setupProgressBar()
        setupSplash()
        resolveAndLoad()
    }

    // MARK: - WebView setup

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.websiteDataStore = .default() // shared cookie/localStorage jar, persists the login session

        let controller = WKUserContentController()
        controller.add(LeakAvoidingScriptHandler(self), name: "purepak")
        // defines window.PurePak before any page script runs — matches the
        // shape app.js expects (see window.PurePak.* call sites there)
        let bridgeShim = """
        window.PurePak = {
          toast: function(msg) { window.webkit.messageHandlers.purepak.postMessage({action:'toast', msg:String(msg)}); },
          openSettings: function() { window.webkit.messageHandlers.purepak.postMessage({action:'openSettings'}); },
          signInWithGoogle: function() { window.webkit.messageHandlers.purepak.postMessage({action:'signInWithGoogle'}); },
          notifyLoggedIn: function() { window.webkit.messageHandlers.purepak.postMessage({action:'notifyLoggedIn'}); },
          version: function() { return '1.0'; }
        };
        """
        controller.addUserScript(WKUserScript(source: bridgeShim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = controller

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.bounces = true
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    private func setupProgressBar() {
        progressView = UIProgressView(progressViewStyle: .bar)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.tintColor = UIColor(red: 0.12, green: 0.58, blue: 0.88, alpha: 1) // matches brand blue
        view.addSubview(progressView)
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2),
        ])
        progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
            guard let self, let value = change.newValue else { return }
            self.progressView.isHidden = value >= 1.0
            self.progressView.setProgress(Float(value), animated: true)
        }
    }

    // a plain brand-colored splash, up at least splashMinSeconds so it never
    // flashes, with a safety timer so a stalled page never leaves the user
    // stuck on it — mirrors Android's dismissSplash()/SPLASH_MIN/MAX_MS
    private func setupSplash() {
        let overlay = UIView(frame: view.bounds)
        overlay.translatesAutoresizingMaskIntoConstraints = false
        overlay.backgroundColor = UIColor(red: 0.07, green: 0.13, blue: 0.22, alpha: 1)
        let label = UILabel()
        label.text = "PurePak"
        label.textColor = .white
        label.font = .systemFont(ofSize: 28, weight: .bold)
        label.translatesAutoresizingMaskIntoConstraints = false
        overlay.addSubview(label)
        view.addSubview(overlay)
        NSLayoutConstraint.activate([
            overlay.topAnchor.constraint(equalTo: view.topAnchor),
            overlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            overlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            overlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            label.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: overlay.centerYAnchor),
        ])
        splashView = overlay
        splashShownAt = Date()
        DispatchQueue.main.asyncAfter(deadline: .now() + splashMaxSeconds) { [weak self] in self?.dismissSplash() }
    }

    private func dismissSplash() {
        guard !splashHidden else { return }
        splashHidden = true
        let elapsed = Date().timeIntervalSince(splashShownAt)
        let wait = max(0, splashMinSeconds - elapsed)
        DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
            guard let self else { return }
            UIView.animate(withDuration: 0.42, animations: { self.splashView.alpha = 0 }) { _ in
                self.splashView.isHidden = true
            }
        }
    }

    // MARK: - Server resolution

    private func resolveAndLoad() {
        RemoteConfig.resolve { [weak self] base in
            self?.startWithHost(base)
        }
    }

    private func startWithHost(_ base: String) {
        guard let url = URL(string: base) else { return }
        serverHost = url.host ?? ""
        serverPort = url.port ?? (url.scheme == "https" ? 443 : 80)
        webView.load(URLRequest(url: url))
    }

    // MARK: - Push notifications (called from AppDelegate)

    func deliverPushToken(_ token: String) {
        let js = "window.onPushToken && window.onPushToken(\(jsString(token)), 'ios')"
        webView.evaluateJavaScript(js)
    }

    func deliverPushRef(_ ref: String) {
        guard webView != nil else { Self.pendingPushRef = ref; return }
        webView.evaluateJavaScript("window.onPushOpen && window.onPushOpen(\(jsString(ref)))")
    }

    private func jsString(_ s: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [s]),
              let json = String(data: data, encoding: .utf8) else { return "null" }
        // [ "value" ] -> "value" — cheap way to get a correctly-escaped JS string literal
        return String(json.dropFirst().dropLast())
    }

    // MARK: - JS bridge message handling

    fileprivate func handleBridgeMessage(_ body: Any) {
        guard let dict = body as? [String: Any], let action = dict["action"] as? String else { return }
        switch action {
        case "toast":
            let msg = (dict["msg"] as? String) ?? ""
            showToast(msg)
        case "openSettings":
            break // no settings screen in v1 — nothing to open yet
        case "signInWithGoogle":
            startGoogleSignIn()
        case "notifyLoggedIn":
            break // v1 has no biometric-lock offer to trigger here
        default:
            break
        }
    }

    private func showToast(_ message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.backgroundColor = UIColor.black.withAlphaComponent(0.85)
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 14)
        label.numberOfLines = 0
        label.layer.cornerRadius = 10
        label.clipsToBounds = true
        label.alpha = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -24),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -32),
        ])
        label.setContentHuggingPriority(.required, for: .horizontal)
        UIView.animate(withDuration: 0.25, animations: { label.alpha = 1 }) { _ in
            UIView.animate(withDuration: 0.25, delay: 1.6, options: [], animations: { label.alpha = 0 }) { _ in
                label.removeFromSuperview()
            }
        }
    }

    // MARK: - Google Sign-In (native — Google blocks its own web flow inside a WKWebView)

    // same Web client ID the website's Google Sign-In button uses: the
    // iOS SDK still requests an ID token audienced to this client via
    // serverClientID, so the server verifies it through the same
    // /api/auth/google path as every other sign-in surface. clientID below
    // is the *iOS* OAuth client (Google's native sign-in handshake needs
    // its own one, separate from this web one) — see ios/README.md's
    // "Known gap: Google Sign-In" section; the whole app works without it,
    // only this button is affected until that client ID exists.
    private static let googleWebClientID = "674062502521-hc2pc7oan27ru1hkleslofoc6lr5uqbq.apps.googleusercontent.com"
    private static let googleIOSClientID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"

    private func startGoogleSignIn() {
        let config = GIDConfiguration(clientID: Self.googleIOSClientID, serverClientID: Self.googleWebClientID)
        GIDSignIn.sharedInstance.configuration = config
        GIDSignIn.sharedInstance.signIn(withPresenting: self) { [weak self] result, error in
            guard let self else { return }
            if let error {
                self.sendGoogleTokenToPage(nil, errorMsg: error.localizedDescription)
                return
            }
            // because serverClientID is set above, this idToken's audience is
            // already googleWebClientID — exactly what /api/auth/google
            // verifies, the same as every other sign-in surface
            guard let idToken = result?.user.idToken?.tokenString else {
                self.sendGoogleTokenToPage(nil, errorMsg: "No ID token returned")
                return
            }
            self.sendGoogleTokenToPage(idToken, errorMsg: nil)
        }
    }

    private func sendGoogleTokenToPage(_ idToken: String?, errorMsg: String?) {
        let tokArg = idToken != nil ? jsString(idToken!) : "null"
        let errArg = errorMsg != nil ? jsString(errorMsg!) : "null"
        webView.evaluateJavaScript("window.onNativeGoogleSignIn && window.onNativeGoogleSignIn(\(tokArg), \(errArg))")
    }
}

// MARK: - WKNavigationDelegate (link handling + splash/push dismissal)

extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else {
            decisionHandler(.allow); return
        }
        // tel/mailto/sms -> hand straight to the OS
        if scheme == "tel" || scheme == "mailto" || scheme == "sms" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel); return
        }
        if scheme == "http" || scheme == "https" {
            let host = (url.host ?? "").lowercased()
            // WhatsApp deep links -> open in WhatsApp (falls back to Safari)
            if host == "wa.me" || host.contains("whatsapp") {
                UIApplication.shared.open(url)
                decisionHandler(.cancel); return
            }
            let port = url.port ?? (scheme == "https" ? 443 : 80)
            let sameServer = (url.host ?? "").caseInsensitiveCompare(serverHost) == .orderedSame && port == serverPort
            if sameServer { decisionHandler(.allow); return }
            // external link -> open in Safari rather than navigate away inside the app
            UIApplication.shared.open(url)
            decisionHandler(.cancel); return
        }
        // any other custom scheme (whatsapp://, intent://, etc.) -> hand to the OS
        if UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        dismissSplash()
        if let ref = Self.pendingPushRef {
            Self.pendingPushRef = nil
            deliverPushRef(ref)
        }
        Messaging.messaging().token { [weak self] token, _ in
            guard let self, let token else { return }
            DispatchQueue.main.async { self.deliverPushToken(token) }
        }
    }

    // iOS equivalent of Android's onRenderProcessGone — WKWebView's content
    // process can be killed under memory pressure (e.g. decoding several
    // full-resolution receipt photos at once); reload instead of leaving a
    // blank screen.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }
}

// MARK: - WKUIDelegate (receipt camera/photo picker for <input type="file">)

extension ViewController: WKUIDelegate {
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        fileCompletion?(nil)
        fileCompletion = completionHandler

        let sheet = UIAlertController(title: "Add receipt photo", message: nil, preferredStyle: .actionSheet)
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            sheet.addAction(UIAlertAction(title: "Take Photo", style: .default) { [weak self] _ in
                self?.presentImagePicker(source: .camera)
            })
        }
        sheet.addAction(UIAlertAction(title: "Choose from Library", style: .default) { [weak self] _ in
            self?.presentImagePicker(source: .photoLibrary)
        })
        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel) { [weak self] _ in
            self?.fileCompletion?(nil)
            self?.fileCompletion = nil
        })
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY, width: 0, height: 0)
        }
        present(sheet, animated: true)
    }

    private func presentImagePicker(source: UIImagePickerController.SourceType) {
        let picker = UIImagePickerController()
        picker.sourceType = source
        picker.delegate = self
        present(picker, animated: true)
    }
}

extension ViewController: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let image = info[.originalImage] as? UIImage,
              let data = image.jpegData(compressionQuality: 0.85) else {
            fileCompletion?(nil); fileCompletion = nil; return
        }
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("receipt_\(Int(Date().timeIntervalSince1970)).jpg")
        do {
            try data.write(to: url)
            fileCompletion?([url])
        } catch {
            fileCompletion?(nil)
        }
        fileCompletion = nil
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        fileCompletion?(nil)
        fileCompletion = nil
    }
}

// WKScriptMessageHandler holds a strong reference to whatever it's added
// with — routing through this tiny proxy instead of `self` directly avoids
// a WKUserContentController -> ViewController retain cycle.
private final class LeakAvoidingScriptHandler: NSObject, WKScriptMessageHandler {
    private weak var target: ViewController?
    init(_ target: ViewController) { self.target = target }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.handleBridgeMessage(message.body)
    }
}

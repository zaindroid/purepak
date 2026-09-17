import SwiftUI
import WebKit
import PhotosUI

/// Owns everything MainActivity.java's fields + methods covered outside the
/// WKWebView delegate callbacks themselves: which server is loaded, the
/// splash screen's min/max-visible timing, push token/ref delivery, and
/// presenting the native pickers/alerts a WKWebView can't show on its own.
final class WebViewModel: NSObject, ObservableObject {
    @Published var isLoading = false
    @Published var showSettings = false
    @Published var toastMessage: String?
    @Published var splashVisible = true

    weak var webView: WKWebView?
    var serverHost = ""
    var serverPort = 443
    var pendingPushRef: String?

    private var splashShownAt = Date()
    private var splashHidden = false
    private let splashMin: TimeInterval = 1.6
    private let splashMax: TimeInterval = 9.0

    private var activePickerCoordinator: AnyObject?

    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(handleFcmToken(_:)),
                                                 name: .fcmTokenRefreshed, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handlePushOpened(_:)),
                                                 name: .pushOpened, object: nil)
    }

    // ---- server resolution (mirrors MainActivity.resolveAndLoad) ----
    func resolveAndLoad() {
        let defaults = UserDefaults.standard
        let cached = defaults.string(forKey: Keys.serverHost) ?? ""
        let manual = defaults.bool(forKey: Keys.serverManual)
        if manual && !cached.isEmpty {
            load(urlString: cached)
        } else {
            RemoteConfig.resolve(cached: cached) { [weak self] resolved in
                if resolved != cached { defaults.set(resolved, forKey: Keys.serverHost) }
                self?.load(urlString: resolved)
            }
        }
    }

    func load(urlString: String) {
        guard let url = URL(string: urlString) else { return }
        serverHost = url.host ?? ""
        serverPort = url.port ?? (url.scheme == "https" ? 443 : 80)
        splashShownAt = Date()
        splashHidden = false
        DispatchQueue.main.asyncAfter(deadline: .now() + splashMax) { [weak self] in self?.dismissSplash() }
        webView?.load(URLRequest(url: url))
    }

    func dismissSplash() {
        guard !splashHidden else { return }
        splashHidden = true
        let elapsed = Date().timeIntervalSince(splashShownAt)
        let wait = max(0, splashMin - elapsed)
        DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
            withAnimation(.easeOut(duration: 0.42)) { self?.splashVisible = false }
        }
    }

    // ---- push token/ref delivery (mirrors deliverPushToken/sendPushRefToPage) ----
    @objc private func handleFcmToken(_ note: Notification) {
        guard let token = note.userInfo?["token"] as? String else { return }
        evaluate("window.onPushToken && window.onPushToken(\(jsString(token)))")
    }

    func deliverPushToken() {
        // AppDelegate's MessagingDelegate callback fires whenever a token is
        // ready, not necessarily before this page load — handleFcmToken above
        // covers the async case; nothing to do synchronously here beyond
        // matching Android's call site so the intent reads the same.
    }

    @objc private func handlePushOpened(_ note: Notification) {
        guard let ref = note.userInfo?["ref"] as? String else { return }
        if isLoading { pendingPushRef = ref } else { sendPushRef(ref) }
    }

    func flushPendingPushRef() {
        guard let ref = pendingPushRef else { return }
        pendingPushRef = nil
        sendPushRef(ref)
    }

    private func sendPushRef(_ ref: String) {
        evaluate("window.onPushOpen && window.onPushOpen(\(jsString(ref)))")
    }

    // ---- Google Sign-In ----
    func requestGoogleSignIn() {
        guard let presenter = Self.topViewController() else { return }
        GoogleSignInHelper.signIn(presenting: presenter) { [weak self] idToken, errorMessage in
            guard let self = self else { return }
            let tokArg = idToken.map(self.jsString) ?? "null"
            let errArg = errorMessage.map(self.jsString) ?? "null"
            self.evaluate("window.onNativeGoogleSignIn && window.onNativeGoogleSignIn(\(tokArg),\(errArg))")
        }
    }

    // ---- biometric enable offer (mirrors maybeOfferBiometricEnable) ----
    func offerBiometricEnableIfNeeded() {
        guard BiometricLock.shouldOfferEnable(), let presenter = Self.topViewController() else { return }
        let alert = UIAlertController(
            title: "Enable fingerprint unlock?",
            message: "Next time you open PurePak, verify it's you with Face ID or Touch ID — so the app isn't left open to anyone who picks up your phone.",
            preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Enable", style: .default) { _ in
            BiometricLock.isEnabled = true
            BiometricLock.hasBeenPromptedAfterLogin = true
        })
        alert.addAction(UIAlertAction(title: "Not now", style: .cancel) { _ in
            BiometricLock.hasBeenPromptedAfterLogin = true
        })
        presenter.present(alert, animated: true)
    }

    // ---- JS alert/confirm ----
    func presentAlert(message: String, completion: @escaping () -> Void) {
        guard let presenter = Self.topViewController() else { completion(); return }
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completion() })
        presenter.present(alert, animated: true)
    }

    func presentConfirm(message: String, completion: @escaping (Bool) -> Void) {
        guard let presenter = Self.topViewController() else { completion(false); return }
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completion(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completion(true) })
        presenter.present(alert, animated: true)
    }

    // ---- file picker (receipt scanner) — mirrors onShowFileChooser's
    // camera-capture-or-gallery choice ----
    func presentFilePicker(completion: @escaping ([URL]?) -> Void) {
        guard let presenter = Self.topViewController() else { completion(nil); return }
        let sheet = UIAlertController(title: "Add receipt photo", message: nil, preferredStyle: .actionSheet)
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            sheet.addAction(UIAlertAction(title: "Take Photo", style: .default) { [weak self] _ in
                self?.presentCamera(from: presenter, completion: completion)
            })
        }
        sheet.addAction(UIAlertAction(title: "Choose from Library", style: .default) { [weak self] _ in
            self?.presentPhotoLibrary(from: presenter, completion: completion)
        })
        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completion(nil) })
        // iPad requires a popover anchor for action sheets, or it crashes
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = presenter.view
            popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        presenter.present(sheet, animated: true)
    }

    private func presentCamera(from presenter: UIViewController, completion: @escaping ([URL]?) -> Void) {
        let coordinator = ImagePickerCoordinator { [weak self] url in
            completion(url.map { [$0] } ?? nil)
            self?.activePickerCoordinator = nil
        }
        activePickerCoordinator = coordinator
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = coordinator
        presenter.present(picker, animated: true)
    }

    private func presentPhotoLibrary(from presenter: UIViewController, completion: @escaping ([URL]?) -> Void) {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        let coordinator = PhotoPickerCoordinator { [weak self] url in
            completion(url.map { [$0] } ?? nil)
            self?.activePickerCoordinator = nil
        }
        activePickerCoordinator = coordinator
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = coordinator
        presenter.present(picker, animated: true)
    }

    // ---- helpers ----
    private func evaluate(_ js: String) {
        DispatchQueue.main.async { [weak self] in self?.webView?.evaluateJavaScript(js, completionHandler: nil) }
    }

    private func jsString(_ s: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [s]),
              let json = String(data: data, encoding: .utf8) else { return "\"\"" }
        // JSONSerialization needs an array/object at the top level; unwrap
        // the single-element array back down to just the encoded string
        return String(json.dropFirst().dropLast())
    }

    static func topViewController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController else { return nil }
        var top = root
        while let presented = top.presentedViewController { top = presented }
        return top
    }

    private enum Keys {
        static let serverHost = "purepak.server_host"
        static let serverManual = "purepak.server_manual"
    }
}

// UIImagePickerController's delegate can't be a SwiftUI struct/class stored
// inline without a retain cycle risk, so these are small standalone
// NSObjects the model holds onto only while a picker is on screen.
private final class ImagePickerCoordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    let completion: (URL?) -> Void
    init(completion: @escaping (URL?) -> Void) { self.completion = completion }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
        picker.dismiss(animated: true)
        guard let image = info[.originalImage] as? UIImage, let data = image.jpegData(compressionQuality: 0.85) else {
            completion(nil); return
        }
        completion(Self.writeTemp(data))
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        completion(nil)
    }

    static func writeTemp(_ data: Data) -> URL? {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".jpg")
        do { try data.write(to: url); return url } catch { return nil }
    }
}

private final class PhotoPickerCoordinator: NSObject, PHPickerViewControllerDelegate {
    let completion: (URL?) -> Void
    init(completion: @escaping (URL?) -> Void) { self.completion = completion }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let provider = results.first?.itemProvider, provider.canLoadObject(ofClass: UIImage.self) else {
            completion(nil); return
        }
        provider.loadObject(ofClass: UIImage.self) { [weak self] object, _ in
            guard let image = object as? UIImage, let data = image.jpegData(compressionQuality: 0.85) else {
                DispatchQueue.main.async { self?.completion(nil) }
                return
            }
            let url = ImagePickerCoordinator.writeTemp(data)
            DispatchQueue.main.async { self?.completion(url) }
        }
    }
}

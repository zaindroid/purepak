import LocalAuthentication
import Foundation

/// Fingerprint/face unlock — a local app-open gate, not a second account
/// credential; the real session still lives in the WebView's own storage.
/// Direct port of MainActivity's showBiometricLock/showBiometricRetry and
/// SetupActivity's KEY_BIOMETRIC_ENABLED toggle.
enum BiometricLock {
    private static let enabledKey = "purepak.biometric_enabled"
    private static let promptedKey = "purepak.biometric_prompted" // asked-once gate for the post-login offer

    static var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: enabledKey) }
        set { UserDefaults.standard.set(newValue, forKey: enabledKey) }
    }

    /// Face ID / Touch ID / device passcode available at all right now —
    /// mirrors BiometricManager.canAuthenticate(BIOMETRIC_WEAK | DEVICE_CREDENTIAL).
    static func canAuthenticate() -> Bool {
        LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: nil)
    }

    /// Runs the system Face ID/Touch ID/passcode prompt. Always calls back on
    /// the main thread. If nothing's enrolled at all, succeeds immediately —
    /// never block the user from their own app over it.
    static func authenticate(reason: String = "Verify it's you to continue", completion: @escaping (Bool) -> Void) {
        let context = LAContext()
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: nil) else {
            DispatchQueue.main.async { completion(true) }
            return
        }
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, _ in
            DispatchQueue.main.async { completion(success) }
        }
    }

    // ---- one-time "enable fingerprint unlock?" offer, right after login ----
    static var hasBeenPromptedAfterLogin: Bool {
        get { UserDefaults.standard.bool(forKey: promptedKey) }
        set { UserDefaults.standard.set(newValue, forKey: promptedKey) }
    }

    static func shouldOfferEnable() -> Bool {
        !hasBeenPromptedAfterLogin && canAuthenticate() && !isEnabled
    }
}

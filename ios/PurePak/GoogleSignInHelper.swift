import UIKit
import GoogleSignIn
import FirebaseCore

/// Native Google Sign-In, triggered when the page calls
/// window.PurePak.signInWithGoogle() — same reason as Android's Credential
/// Manager path: Google refuses to run its own web OAuth flow inside any
/// embedded WebView, so this has to happen through the platform's native
/// SDK instead, same as MainActivity.startGoogleSignIn().
///
/// The server verifies the ID token's `aud` claim against the WEB client id
/// (/api/auth/google, GOOGLE_CLIENT_ID env var) — not an iOS-specific one —
/// so this requests a token audienced for that web client via
/// `serverClientID`, exactly like Android's GetSignInWithGoogleOption does
/// with GOOGLE_WEB_CLIENT_ID. Both platforms end up calling the identical
/// server endpoint with the identical kind of token.
enum GoogleSignInHelper {
    // same web client the site's own Google Sign-In button and the Android
    // app both use — passed as serverClientID below so the ID token this SDK
    // returns is audienced for OUR backend (/api/auth/google), not for an
    // iOS-only audience the server would reject
    private static let webClientID = "674062502521-hc2pc7oan27ru1hkleslofoc6lr5uqbq.apps.googleusercontent.com"

    // iOS apps get their OWN client id (type "iOS", not "Web") when you add
    // an iOS app to the purepak-6472b Firebase project — it lands in the
    // generated GoogleService-Info.plist as CLIENT_ID. Google's SDK actually
    // reads this automatically from that file once it's dropped in (see
    // README), so this constant is a fallback only used if that file is
    // missing; fill it in from GoogleService-Info.plist once you have one.
    private static let iosClientIDFallback = "REPLACE_WITH_IOS_CLIENT_ID_FROM_GoogleService-Info.plist"

    static func signIn(presenting viewController: UIViewController, completion: @escaping (_ idToken: String?, _ errorMessage: String?) -> Void) {
        // iOS's own client id comes from GoogleService-Info.plist (GIDSignIn
        // reads it via GIDClientID in Info.plist, wired by the Firebase/Google
        // Sign-In config step) — serverClientID below is what actually
        // matters for our backend.
        GIDSignIn.sharedInstance.signIn(withPresenting: viewController, hint: nil, additionalScopes: nil) { result, error in
            if let error = error as NSError? {
                if error.code == GIDSignInError.canceled.rawValue {
                    completion(nil, "Google sign-in was cancelled")
                } else {
                    completion(nil, "\(error.domain) [\(error.code)]: \(error.localizedDescription)")
                }
                return
            }
            guard let user = result?.user else {
                completion(nil, "No account returned")
                return
            }
            // request (or reuse) a token audienced for our web client
            user.refreshTokensIfNeeded { refreshedUser, refreshError in
                if let refreshError = refreshError {
                    completion(nil, "Token refresh failed: \(refreshError.localizedDescription)")
                    return
                }
                guard let idToken = refreshedUser?.idToken?.tokenString else {
                    completion(nil, "Empty ID token")
                    return
                }
                completion(idToken, nil)
            }
        }
    }

    static func configure() {
        // FirebaseApp.configure() (called first, in AppDelegate) already
        // reads CLIENT_ID out of GoogleService-Info.plist once that real
        // file is in place — reuse it rather than hand-maintaining a second
        // copy of the same value.
        let iosClientID = FirebaseApp.app()?.options.clientID ?? iosClientIDFallback
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: iosClientID, serverClientID: webClientID)
    }
}

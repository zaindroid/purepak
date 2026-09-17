import SwiftUI

@main
struct PurePakApp: App {
    // UIKit AppDelegate is still the right home for Firebase/push/Google
    // Sign-In setup — those SDKs hook into UIApplication lifecycle callbacks
    // that SwiftUI's App protocol doesn't expose directly.
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

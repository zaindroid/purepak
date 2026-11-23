import UIKit
import FirebaseCore
import FirebaseMessaging
import GoogleSignIn
import UserNotifications

@main
final class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication,
                      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        Messaging.messaging().delegate = self

        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        application.registerForRemoteNotifications()

        // a push tap that cold-launched the app — SceneDelegate's willConnectTo
        // also checks launchOptions directly, this covers the case where the
        // notification extra arrives through this older delegate path instead
        if let remote = launchOptions?[.remoteNotification] as? [String: AnyObject],
           let ref = remote["ref"] as? String {
            ViewController.pendingPushRef = ref
        }
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession,
                      options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    // MARK: Google Sign-In URL callback

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        GIDSignIn.sharedInstance.handle(url)
    }

    // MARK: APNs <-> FCM token bridge

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // push just won't work this session — nothing in the app depends on
        // it being available, so there's nothing else to do here
    }

    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken, let vc = Self.activeViewController() else { return }
        vc.deliverPushToken(fcmToken)
    }

    // MARK: Foreground notification presentation

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                 withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }

    // MARK: Tapped notification -> deep link via the same "ref" the in-app bell uses

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                 withCompletionHandler completionHandler: @escaping () -> Void) {
        if let ref = response.notification.request.content.userInfo["ref"] as? String {
            if let vc = Self.activeViewController() {
                vc.deliverPushRef(ref)
            } else {
                ViewController.pendingPushRef = ref
            }
        }
        completionHandler()
    }

    private static func activeViewController() -> ViewController? {
        UIApplication.shared.connectedScenes
            .compactMap { ($0 as? UIWindowScene)?.keyWindow?.rootViewController as? ViewController }
            .first
    }
}

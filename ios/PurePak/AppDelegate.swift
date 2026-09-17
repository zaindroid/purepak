import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import GoogleSignIn

extension Notification.Name {
    static let fcmTokenRefreshed = Notification.Name("purepak.fcmTokenRefreshed")
    static let pushOpened = Notification.Name("purepak.pushOpened")
}

/// Mirrors MainActivity's onCreate + PurePakFirebaseMessagingService from the
/// Android app: configures Firebase, registers for remote notifications, and
/// — since the server always sends data-only pushes so the app can build its
/// own notification and carry a deep-link "ref" — builds and shows that
/// notification itself here rather than relying on FCM's own display.
class AppDelegate: NSObject, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {

    func application(_ application: UIApplication,
                      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        GoogleSignInHelper.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self

        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            DispatchQueue.main.async { application.registerForRemoteNotifications() }
        }
        return true
    }

    func application(_ app: UIApplication, open url: URL,
                      options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        GIDSignIn.sharedInstance.handle(url)
    }

    // hands the APNs token to Firebase, which mints the FCM token our
    // MessagingDelegate callback below receives
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("PurePak: remote notification registration failed: \(error)")
    }

    // ---- MessagingDelegate ----
    // Android's MainActivity fetches the current FCM token fresh on every
    // page load (FirebaseMessaging.getInstance().getToken() always returns
    // the latest one). Here the token can arrive asynchronously at any time,
    // so WebViewContainer listens for this notification and forwards it to
    // window.onPushToken whenever it's ready — not just at launch.
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        NotificationCenter.default.post(name: .fcmTokenRefreshed, object: nil, userInfo: ["token": token])
    }

    // ---- UNUserNotificationCenterDelegate ----
    // data-only pushes never carry a system-displayed alert on their own;
    // PushNotificationManager (background delivery) builds and schedules a
    // local UNNotificationRequest, which flows back through here to actually
    // show while the app is foregrounded.
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                 willPresent notification: UNNotification,
                                 withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge, .list])
    }

    // user tapped the notification — mirrors PurePakFirebaseMessagingService's
    // PendingIntent carrying EXTRA_PUSH_REF into MainActivity.onNewIntent
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                 didReceive response: UNNotificationResponse,
                                 withCompletionHandler completionHandler: @escaping () -> Void) {
        let ref = response.notification.request.content.userInfo["ref"] as? String ?? ""
        if !ref.isEmpty {
            NotificationCenter.default.post(name: .pushOpened, object: nil, userInfo: ["ref": ref])
        }
        completionHandler()
    }

    // background/silent data push — iOS delivers a content-available push
    // here instead of to the UNUserNotificationCenter delegate, since there's
    // no aps.alert payload. Build the visible notification ourselves, same
    // as PurePakFirebaseMessagingService.showNotification() does on Android.
    func application(_ application: UIApplication,
                      didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                      fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        PushNotificationManager.showLocalNotification(from: userInfo)
        completionHandler(.newData)
    }
}

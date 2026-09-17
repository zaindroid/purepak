import UIKit
import UserNotifications

/// Turns a data-only FCM payload into a real, visible notification — mirrors
/// PurePakFirebaseMessagingService.showNotification() on Android exactly:
/// same fields (title/body/ref), same reason (the server never sends a
/// top-level "notification" block, so nothing displays automatically and a
/// tap couldn't otherwise carry the "ref" App.routeByRef needs).
enum PushNotificationManager {
    static func showLocalNotification(from userInfo: [AnyHashable: Any]) {
        let title = userInfo["title"] as? String ?? "PurePak"
        let body = userInfo["body"] as? String ?? ""
        let ref = userInfo["ref"] as? String ?? ""

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        if !ref.isEmpty { content.userInfo = ["ref": ref] }

        // fire immediately — this isn't a scheduled reminder, it's relaying
        // a push that already arrived
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error { print("PurePak: local notification failed: \(error)") }
        }
    }
}

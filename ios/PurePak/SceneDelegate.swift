import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = ViewController()
        window.makeKeyAndVisible()
        self.window = window

        // cold launch from a tapped push notification
        if let response = connectionOptions.notificationResponse,
           let ref = response.notification.request.content.userInfo["ref"] as? String {
            ViewController.pendingPushRef = ref
        }
    }
}

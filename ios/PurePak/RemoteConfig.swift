import Foundation

/// Resolves the backend server URL from a small, stable pointer file — NOT
/// from the backend itself, since the backend's own domain is exactly what
/// might change. Moving the backend later is then just: edit that one file,
/// commit, push — every installed app picks up the new address on its next
/// launch. No rebuild, no new App Store submission.
///
/// Mirrors android/app/src/main/java/com/purepak/app/RemoteConfig.java —
/// keep the two in sync if this logic ever changes.
enum RemoteConfig {
    private static let pointerURL = URL(string: "https://raw.githubusercontent.com/zaindroid/purepak/main/mobile-config.json")!
    /// last-resort default if the pointer is unreachable and nothing is cached yet
    static let fallbackURL = "https://app.purepak.com.pk"
    private static let cacheKey = "purepak.cachedServerURL"

    /// Tries the pointer first (keeps installs current); falls back to
    /// whatever's cached, then to fallbackURL. Completion always fires on
    /// the main thread with a non-empty URL string.
    static func resolve(completion: @escaping (String) -> Void) {
        let cached = UserDefaults.standard.string(forKey: cacheKey)
        var request = URLRequest(url: pointerURL)
        request.timeoutInterval = 4
        URLSession.shared.dataTask(with: request) { data, response, _ in
            var resolved: String?
            if let http = response as? HTTPURLResponse, http.statusCode == 200,
               let data, let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let url = obj["server_url"] as? String, !url.isEmpty {
                resolved = url
            }
            let result = resolved ?? cached ?? fallbackURL
            if let resolved, resolved != cached {
                UserDefaults.standard.set(resolved, forKey: cacheKey)
            }
            DispatchQueue.main.async { completion(result) }
        }.resume()
    }
}

import Foundation

/// Resolves the backend server URL from a small, stable pointer file — NOT
/// from the backend itself, since the backend's own domain is exactly what
/// might change. Moving the backend later is then just: edit that one file,
/// commit, push — every installed app picks up the new address on its next
/// launch. No rebuild, no new App Store release.
///
/// Direct port of RemoteConfig.java — same pointer URL, same fallback order
/// (pointer -> cached -> hardcoded default), same 4s timeout.
enum RemoteConfig {
    private static let pointerURL = URL(string: "https://raw.githubusercontent.com/zaindroid/purepak/main/mobile-config.json")!
    static let fallbackURL = "https://purepak.zaindroid.me"

    /// Always calls back on the main thread with a non-empty URL string.
    static func resolve(cached: String, completion: @escaping (String) -> Void) {
        var request = URLRequest(url: pointerURL)
        request.timeoutInterval = 4
        URLSession.shared.dataTask(with: request) { data, response, error in
            let resolved = Self.parsePointer(data: data, response: response, error: error)
            let result = resolved ?? (cached.isEmpty ? fallbackURL : cached)
            DispatchQueue.main.async { completion(result) }
        }.resume()
    }

    private static func parsePointer(data: Data?, response: URLResponse?, error: Error?) -> String? {
        if let error = error {
            print("PurePak: remote config fetch failed: \(error.localizedDescription)")
            return nil
        }
        guard let http = response as? HTTPURLResponse, http.statusCode == 200, let data = data else { return nil }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let url = (json["server_url"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
              !url.isEmpty else { return nil }
        // strip trailing slashes, same as the Android version
        var trimmed = url
        while trimmed.hasSuffix("/") { trimmed.removeLast() }
        return trimmed
    }
}

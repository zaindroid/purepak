import SwiftUI

/// Advanced / override screen — reached via the gear icon, not shown on
/// first launch. Normal use never touches this: ContentView resolves the
/// live server automatically (see RemoteConfig). Exists for pointing the app
/// at a local dev server on the same Wi-Fi, or as a manual escape hatch if
/// the automatic address is ever wrong. Direct port of SetupActivity.java.
struct SettingsView: View {
    @ObservedObject var model: WebViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var hostText = UserDefaults.standard.string(forKey: "purepak.server_host") ?? ""
    @State private var connecting = false
    @State private var errorText: String?
    @State private var biometricOn = BiometricLock.isEnabled
    private let biometricAvailable = BiometricLock.canAuthenticate()

    var body: some View {
        NavigationView {
            Form {
                Section("Server") {
                    TextField("purepak.zaindroid.me or 192.168.1.20:4310", text: $hostText)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .keyboardType(.URL)
                    if let errorText {
                        Text(errorText).foregroundColor(.red).font(.footnote)
                    }
                    Button {
                        connect()
                    } label: {
                        if connecting { ProgressView() } else { Text("Connect") }
                    }
                    .disabled(connecting || hostText.trimmingCharacters(in: .whitespaces).isEmpty)
                    Button("Use default server") { useDefault() }
                }

                Section("Security") {
                    Toggle("Unlock with Face ID / Touch ID", isOn: $biometricOn)
                        .disabled(!biometricAvailable)
                        .onChange(of: biometricOn) { newValue in
                            if newValue && !biometricAvailable {
                                biometricOn = false
                                return
                            }
                            BiometricLock.isEnabled = newValue
                        }
                    if !biometricAvailable {
                        Text("Set up a fingerprint, face, or passcode lock on this phone first.")
                            .font(.footnote).foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func normalize(_ raw: String) -> String {
        var s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        while s.hasSuffix("/") { s.removeLast() }
        return s
    }

    private func hostToURL(_ raw: String) -> String {
        let h = normalize(raw)
        if h.isEmpty { return "" }
        let lower = h.lowercased()
        if lower.hasPrefix("http://") || lower.hasPrefix("https://") { return h }
        return "http://" + h
    }

    private func connect() {
        errorText = nil
        let host = normalize(hostText)
        guard !host.isEmpty else { errorText = "Please enter a server address."; return }
        connecting = true
        let urlString = hostToURL(host)
        guard let probeURL = URL(string: urlString + "/api/products") else {
            connecting = false; errorText = "That doesn't look like a valid address."; return
        }
        var request = URLRequest(url: probeURL)
        request.timeoutInterval = 6
        URLSession.shared.dataTask(with: request) { _, response, error in
            DispatchQueue.main.async {
                connecting = false
                let code = (response as? HTTPURLResponse)?.statusCode ?? 0
                // 200 = reachable with API; anything below 500 still means the
                // server itself answered (401/404 etc. are fine)
                if error == nil && code >= 200 && code < 500 {
                    UserDefaults.standard.set(urlString, forKey: "purepak.server_host")
                    UserDefaults.standard.set(true, forKey: "purepak.server_manual")
                    model.load(urlString: urlString)
                    dismiss()
                } else {
                    errorText = "Couldn't reach that server. Check the address and try again."
                }
            }
        }.resume()
    }

    private func useDefault() {
        UserDefaults.standard.removeObject(forKey: "purepak.server_host")
        UserDefaults.standard.set(false, forKey: "purepak.server_manual")
        hostText = ""
        model.resolveAndLoad()
        dismiss()
    }
}

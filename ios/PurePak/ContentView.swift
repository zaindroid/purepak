import SwiftUI

/// Root screen — mirrors MainActivity.onCreate's flow: biometric lock gate
/// first (if enabled, nothing sensitive loads until it clears), then resolve
/// & load the server, with a branded splash covering the load and a
/// lightweight top bar (refresh + settings) matching activity_main.xml.
struct ContentView: View {
    @StateObject private var model = WebViewModel()
    @State private var unlocked = !BiometricLock.isEnabled
    @State private var locked = BiometricLock.isEnabled

    var body: some View {
        ZStack {
            if unlocked {
                VStack(spacing: 0) {
                    topBar
                    ZStack {
                        WebViewContainer(model: model)
                        if model.isLoading {
                            ProgressView().progressViewStyle(.linear)
                                .frame(maxWidth: .infinity)
                                .frame(maxHeight: .infinity, alignment: .top)
                        }
                    }
                }
                .onAppear { model.resolveAndLoad() }
            }

            if model.splashVisible {
                SplashView()
                    .transition(.opacity)
            }

            if locked {
                BiometricLockView {
                    locked = false
                    unlocked = true
                }
            }

            if let toast = model.toastMessage {
                VStack {
                    Spacer()
                    Text(toast)
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(Color.black.opacity(0.85))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                        .padding(.bottom, 24)
                }
                .transition(.opacity)
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                        withAnimation { model.toastMessage = nil }
                    }
                }
            }
        }
        .sheet(isPresented: $model.showSettings) {
            SettingsView(model: model)
        }
    }

    private var topBar: some View {
        HStack {
            Spacer()
            Button { model.webView?.reload() } label: {
                Image(systemName: "arrow.clockwise")
            }
            Button { model.showSettings = true } label: {
                Image(systemName: "gearshape")
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .font(.system(size: 17, weight: .medium))
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.30, blue: 0.55).ignoresSafeArea()
            VStack(spacing: 14) {
                // TODO: swap for the real PurePak logo — add it to
                // Assets.xcassets as "SplashLogo" and replace this SF Symbol
                // placeholder with Image("SplashLogo").resizable().scaledToFit()
                Image(systemName: "drop.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 72, height: 72)
                    .foregroundColor(.white)
                Text("PurePak").font(.title2).bold().foregroundColor(.white)
            }
        }
    }
}

private struct BiometricLockView: View {
    let onSuccess: () -> Void
    @State private var showRetry = false

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 18) {
                Image(systemName: "faceid").font(.system(size: 48)).foregroundColor(.blue)
                Text("Unlock PurePak").font(.headline)
                Button("Try again") { authenticate() }
                    .buttonStyle(.borderedProminent)
            }
        }
        .onAppear { authenticate() }
        .alert("Unlock required", isPresented: $showRetry) {
            Button("Try again") { authenticate() }
            Button("Turn off lock", role: .destructive) {
                BiometricLock.isEnabled = false
                onSuccess()
            }
        } message: {
            Text("Verify it's you to continue using PurePak.")
        }
    }

    private func authenticate() {
        BiometricLock.authenticate { success in
            if success { onSuccess() } else { showRetry = true }
        }
    }
}

# PurePak iOS app

A thin WKWebView wrapper around the same web app the Android build and
browsers use — same idea as `android/`, see `ViewController.swift` for the
feature-by-feature mapping to `MainActivity.java`. There's no checked-in
`.xcodeproj`; it's generated from `project.yml` with
[XcodeGen](https://github.com/yonaskolb/XcodeGen) so the project stays a
readable, diffable text file instead of an opaque binary-ish one.

## Building locally (needs a Mac + Xcode)

```sh
brew install xcodegen
cd ios
xcodegen generate
open PurePak.xcodeproj
```

Before it'll run, drop in the two files that are deliberately **not**
committed to this public repo (see `.gitignore`):

- `ios/PurePak/GoogleService-Info.plist` — the Firebase config file (already
  exists in the working tree locally if you're reading this from the same
  machine it was generated on; otherwise download it again from the
  [Firebase console](https://console.firebase.google.com) → Project settings
  → your iOS app).
- An app icon — Assets.xcassets/AppIcon.appiconset is scaffolded for a
  single 1024×1024 PNG (Xcode auto-generates every other size from it);
  just drag one in via the asset catalog editor.

For signing: either let Xcode manage it automatically (switch
`CODE_SIGN_STYLE` to `Automatic` in `project.yml` and sign in with the Apple
ID for team `88VWT2K3LJ`), or use the already-exported certificate +
provisioning profile in `ios/certs/` the same way the CI workflow does
(see below).

## Building without a Mac — GitHub Actions

`.github/workflows/ios-build.yml` builds a signed `.ipa` on GitHub's free
macOS runners (free for public repos — this one qualifies) and uploads it as
a downloadable workflow artifact. Trigger it manually from the repo's
**Actions** tab (`iOS build` → **Run workflow**), or it runs automatically
on any push to `main` that touches `ios/`.

It needs these repository secrets (**Settings → Secrets and variables →
Actions → New repository secret**) — all sourced from files already sitting
in `ios/certs/` and `ios/PurePak/` locally, none of which are committed:

| Secret name | Value comes from |
|---|---|
| `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | `base64 -i ios/PurePak/GoogleService-Info.plist \| pbcopy` (or `certutil -encode` on Windows), paste the output |
| `IOS_DIST_CERT_P12_BASE64` | contents of `ios/certs/distribution.p12.b64` (already base64-encoded) |
| `IOS_DIST_CERT_PASSWORD` | contents of `ios/certs/p12_password.txt` |
| `IOS_PROVISION_PROFILE_BASE64` | contents of `ios/certs/profile.b64` (already base64-encoded) |

The resulting `.ipa` still needs a manual upload to TestFlight/App Store
Connect via the **Transporter** app (or ask for that step to be automated
too, via an App Store Connect API key — the repo already has one or more
`AuthKey_*.p8` files staged, just need to confirm which one is the current
App Store Connect key, as opposed to an APNs key, plus its Key ID and Issuer
ID from App Store Connect).

## Known gap: Google Sign-In

The native "Sign in with Google" button needs its own **iOS OAuth client
ID** registered in Google Cloud Console — separate from the Android client
and the web client the login page uses — and that doesn't exist yet for
this Firebase project (`purepak-6472b`). Steps to close this:

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services
   → Credentials → **Create credentials → OAuth client ID** → Application
   type **iOS** → bundle ID `com.purepak.app`.
2. Re-download `GoogleService-Info.plist` from Firebase (it'll now include
   `CLIENT_ID` / `REVERSED_CLIENT_ID` keys it's currently missing).
3. Replace `YOUR_IOS_REVERSED_CLIENT_ID` in `ios/PurePak/Info.plist`'s
   `CFBundleURLSchemes` with that `REVERSED_CLIENT_ID` value.

Everything else in the app (WebView, push notifications, receipt camera/
photo picker, external link handling) works without this — only the Google
Sign-In button is affected until it's done.

## Version sync with Android

`android/app/src/main/java/com/purepak/app/MainActivity.java` is the
reference implementation — if its WebView/bridge/push logic changes, mirror
the change here too (`ViewController.swift`, `AppDelegate.swift`,
`RemoteConfig.swift`).

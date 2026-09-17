# PurePak iOS

A native wrapper around the same web app the Android app and website already
run — this is not a separate app, just another shell around
`purepak.zaindroid.me` with the same native hooks the Android app has:
push notifications, native Google Sign-In (Google blocks its own web flow
inside any embedded WebView), Face ID/Touch ID unlock, and camera/photo
access for the receipt scanner. If you've read `android/`'s equivalent
files, every Swift file here has a comment pointing at the Java file it
mirrors.

No `.xcodeproj` is committed — it's generated from `project.yml` by
[XcodeGen](https://github.com/yonaskolb/XcodeGen), so the actual Xcode
project file (a notoriously merge-conflict-prone format) never needs to be
hand-edited or committed. Anyone building this regenerates it locally or in
CI with one command.

## What you need to do before this builds

None of this needs Xcode running locally — it can all be done through the
Firebase console, the Apple Developer portal, and whichever CI service you
pick (see below).

### 1. Add an iOS app to the Firebase project

Same Firebase project (`purepak-6472b`) the Android app and web push
notifications already use.

1. [Firebase console](https://console.firebase.google.com) → purepak-6472b →
   Project settings → Your apps → **Add app → iOS**
2. Bundle ID: `com.purepak.app`
3. Download the generated **`GoogleService-Info.plist`**
4. Save it as `ios/PurePak/GoogleService-Info.plist` (it's gitignored —
   every environment/CI run drops in its own copy; see
   `GoogleService-Info.plist.example` for what it looks like)

This one file is also what wires up Google Sign-In on iOS — its `CLIENT_ID`
field is the iOS OAuth client Firebase auto-creates for you, no separate
Google Cloud Console step needed.

### 2. Register the App ID with Apple and enable push

1. [Apple Developer portal](https://developer.apple.com/account) →
   Certificates, Identifiers & Profiles → Identifiers → **+**
2. App ID, bundle ID `com.purepak.app` (explicit, not wildcard)
3. Enable the **Push Notifications** capability on it

### 3. Upload an APNs key to Firebase

1. Apple Developer portal → Certificates, Identifiers & Profiles → Keys →
   **+** → enable **Apple Push Notifications service (APNs)** → download the
   `.p8` key (you only get one chance to download it — save it somewhere safe)
2. Firebase console → Project settings → Cloud Messaging → Apple app
   configuration → upload that key, its Key ID, and your Apple Team ID

### 4. Create the app in App Store Connect

[App Store Connect](https://appstoreconnect.apple.com) → My Apps → **+** →
New App → bundle ID `com.purepak.app`. This is also where TestFlight builds
land once CI uploads one.

### 5. Pick a build service and wire up signing

Neither of these needs a Mac — both build in the cloud using your Apple
Developer account for signing.

**Codemagic** (`codemagic.yaml`, already in this folder) — simplest to set
up since it wraps signing behind its own UI:
1. Connect this repo at [codemagic.io](https://codemagic.io)
2. Team settings → Integrations → App Store Connect → add an API key
   (App Store Connect → Users and Access → Integrations → generate one,
   scoped to **App Manager** access — safer than sharing your Apple ID,
   and revocable any time)
3. Codemagic reads `codemagic.yaml` automatically; run the
   `purepak-ios-testflight` workflow

**GitHub Actions** (`.github/workflows/ios-testflight.yml`) — more manual
(you generate and store each signing secret yourself) but keeps everything
in the same place as the rest of this repo:
1. Repo → Settings → Secrets and variables → Actions, add:
   - `GOOGLE_SERVICE_INFO_PLIST_B64` — `base64 -i GoogleService-Info.plist`
   - `IOS_DIST_CERTIFICATE_B64` / `IOS_DIST_CERTIFICATE_PASSWORD` — an Apple
     Distribution certificate exported as a `.p12`, base64-encoded
   - `IOS_PROVISIONING_PROFILE_B64` — an App Store provisioning profile for
     `com.purepak.app`, base64-encoded
   - `IOS_KEYCHAIN_PASSWORD` — any password, just used for the throwaway CI keychain
   - `APP_STORE_CONNECT_KEY_ID` / `APP_STORE_CONNECT_ISSUER_ID` /
     `APP_STORE_CONNECT_API_KEY_B64` — an App Store Connect API key (same
     kind as Codemagic's, generated the same way)
2. Fill in `ios/ExportOptions.plist`'s `teamID` with your real Apple
   Developer Team ID (App Store Connect → Membership details)
3. Trigger the workflow manually from the Actions tab, or push to the `ios`
   branch under `ios/**`

Either path ends the same way: a signed build lands in TestFlight, you
install the TestFlight app on your iPhone, and get it there — no cable, no
local Xcode build.

## Testing on your iPhone without a full local build

Once a TestFlight build exists, testing is just the TestFlight app — nothing
below this line is required for that. This section is only for debugging
something you can't diagnose from CI logs, e.g. a WebView-side JS bug:

Plug the iPhone into any Mac (even one too old to run current Xcode, like a
2016 MacBook Pro — Safari's remote inspector doesn't care) and open
**Safari → Develop → [your iPhone] → [PurePak]** to see the WebView's live
console/DOM, the same way you'd debug the web app in a desktop browser.

## What's still a placeholder

- **App icon** — `Assets.xcassets/AppIcon.appiconset` declares the slot but
  has no image yet. Drop a 1024×1024 PNG in and reference it in that
  asset's `Contents.json`.
- **Splash logo** — `ContentView.swift`'s `SplashView` uses an SF Symbol
  (`drop.fill`) as a stand-in; swap for the real logo once you add it as an
  image asset (see the `TODO` comment right there).
- **`ExportOptions.plist`'s `teamID`** — needs your real Apple Developer
  Team ID before an export/archive will succeed.

## Local regeneration (only if you get Mac access later)

```
brew install xcodegen
cd ios
xcodegen generate
open PurePak.xcodeproj
```

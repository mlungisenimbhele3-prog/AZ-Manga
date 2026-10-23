# AZ OVERVERSE 🇿🇦 👑
> **The Premier Pan-African Manga Publishing & Reading Platform**  
> **Produced & Created by Mlungiseni Mbhele**  
> Live Platform: [`https://az-oververse.ai.studio`](https://az-oververse.ai.studio)  
> Public GitHub Repository: [`mlungisenimbhele3-prog/AZ-Manga`](https://github.com/mlungisenimbhele3-prog/AZ-Manga)

---

## 📱 About AZ OVERVERSE
**AZ OVERVERSE** is an indigenous, next-generation Pan-African manga serialization ecosystem built for African and global creators. It features:
- **Dual Reading Engine**: Seamless **Left-to-Right (LTR) Manga** and **AZ Vertical Webtoon** page modes with hardware-accelerated 120Hz/60Hz physics.
- **70% Creator Revenue Share**: Direct author monetization powered exclusively by **Google AdMob** (persistent banner & rewarded chapter unlocks) and **Google Play Billing**.
- **AZ Backdrop & Originals**: Independent creator self-publishing desk with official IP promotion pathways.
- **Manga of the Year Gala 2026**: Reader's Choice voting and category awards.
- **Capacitor Android Native App**: Pre-configured with hardware WebView rasterization and Google Mobile Ads SDK.

---

## 📦 Public Release `v1.0.0` — Android APK & Google Play Bundle (`.aab`)

Download the official **`v1.0.0`** Android builds directly from GitHub Releases (no sign-in required when repository visibility is Public):

- 👉 **Direct Install Debug APK (`app-debug.apk`)**:  
  [`https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/download/v1.0.0/app-debug.apk`](https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/download/v1.0.0/app-debug.apk)
- 👉 **Signed Google Play Release Bundle (`app-release.aab`)**:  
  [`https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/download/v1.0.0/app-release.aab`](https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/download/v1.0.0/app-release.aab)
- 👉 **Release `v1.0.0` Notes & SHA-256 Checksums**:  
  [`https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/tag/v1.0.0`](https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/tag/v1.0.0)

---

## 🚀 Quick Start & Development

### Prerequisites
- **Node.js**: v22 or higher
- **npm**: v10+
- **JDK**: Java 21 (Temurin) for Android Gradle 9.3.1 builds
- **Android SDK**: API Level 35 (Android 15)

### Installation
```bash
# Clone this repository
git clone https://github.com/mlungisenimbhele3-prog/AZ-Manga.git
cd AZ-Manga

# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev
```

### Build Web Production Bundle
```bash
npm run build
```

---

## 🤖 Automated GitHub Release `v1.0.0` Pipeline

The workflow [`.github/workflows/build-release-aab.yml`](.github/workflows/build-release-aab.yml) automatically runs on every push to `main`:
1. Builds the production web bundle (`npm run build`) and syncs Capacitor Android (`npx cap sync android`).
2. Compiles **both** `app-debug.apk` (`:app:assembleDebug`) and cryptographically signed `app-release.aab` (`:app:bundleRelease`, API 35, JDK 21, Gradle 9.3.1).
3. Publishes non-draft, latest Release **`v1.0.0`** with public downloadable `app-debug.apk`, `app-release.aab`, and `SHA256SUMS.txt`.

### One-Command Local Push + Public Repo + `v1.0.0` Release (with GitHub CLI)
```bash
npm run release:v1
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **Backend / Server**: Express 4, Node.js, TSX
- **Mobile Runtime**: Capacitor 6, Android SDK 35 WebView with 120Hz display modes
- **Storage & Monetization**: Google Play Billing, Google AdMob, Firebase, Supabase

---

## 📄 License & Intellectual Property
All AZ Originals are © **AZ OVERVERSE / Mlungiseni Mbhele**. All Canvas and Backdrop works remain © their respective creators. AZ OVERVERSE holds a non-exclusive license to display Backdrop titles.

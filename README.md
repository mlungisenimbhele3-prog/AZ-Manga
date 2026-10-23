# AZ OVERVERSE 🇿🇦 👑
> **The Premier Pan-African Manga Publishing & Reading Platform**  
> **Produced & Created by Mlungiseni Mbhele**  
> Live Platform: [`https://az-oververse.ai.studio`](https://az-oververse.ai.studio)  
> GitHub Repository: [`mlungisenimbhele3-prog/AZ-Manga`](https://github.com/mlungisenimbhele3-prog/AZ-Manga)

---

## 📱 About AZ OVERVERSE
**AZ OVERVERSE** is an indigenous, next-generation Pan-African manga serialization ecosystem built for African and global creators. It features:
- **Dual Reading Engine**: Seamless **Left-to-Right (LTR) Manga** and **AZ Vertical Webtoon** page modes with hardware-accelerated 120Hz/60Hz physics.
- **70% Creator Revenue Share**: Direct author monetization powered exclusively by **Google AdMob** (persistent banner & rewarded chapter unlocks) and **Google Play Billing**.
- **AZ Backdrop & Originals**: Independent creator self-publishing desk with official IP promotion pathways.
- **Manga of the Year Gala 2026**: Reader's Choice voting and category awards.
- **Capacitor Android Native App**: Pre-configured with hardware WebView rasterization and Google Mobile Ads SDK.

---

## 📦 Signed Google Play Store Release Bundle (`.aab`)
Download the latest cryptographically signed Android App Bundle (`app-release.aab` published as `AZ-Oververse-PlayStore.aab`) directly from GitHub Releases:
👉 **[Download `AZ-Oververse-PlayStore.aab`](https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/latest/download/AZ-Oververse-PlayStore.aab)**

Release notes and SHA-256 checksums:  
👉 **[GitHub Releases Page](https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases)**

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

## 🤖 Android Signed Release AAB & CI/CD Pipeline

The project includes automated GitHub Actions in [`.github/workflows/build-release-aab.yml`](.github/workflows/build-release-aab.yml) that compile, sign (`app-release.aab`), verify (`jarsigner`), and publish **`AZ-Oververse-PlayStore.aab`** to GitHub Releases on every push to `main`.

### Local Signed AAB Compilation
```bash
npm run build:aab
# Or manually:
npm run build
npx cap sync android
cd android && ./gradlew :app:bundleRelease -x lint -x lintVitalRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons
- **Backend / Server**: Express 4, Node.js, TSX
- **Mobile Runtime**: Capacitor 8, Android WebView API 21+ with 120Hz display modes
- **Storage & Monetization**: Google Play Billing, Google AdMob, Firebase, Supabase

---

## 📄 License & Intellectual Property
All AZ Originals are © **AZ OVERVERSE / Mlungiseni Mbhele**. All Canvas and Backdrop works remain © their respective creators. AZ OVERVERSE holds a non-exclusive license to display Backdrop titles.

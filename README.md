# AZ OVERVERSE 🇿🇦 👑
> **The Premier Pan-African Manga Publishing & Reading Platform**  
> **Produced & Created by Mlungiseni Mbhele**  
> GitHub Repository: [`mlungisenimbhele3-prog/manga-publisher-app`](https://github.com/mlungisenimbhele3-prog/manga-publisher-app)

---

## 📱 About AZ OVERVERSE
**AZ OVERVERSE** is an indigenous, next-generation Pan-African manga serialization ecosystem built for African and global creators. It features:
- **Dual Reading Engine**: Seamless **AZ Vertical Webtoon** and authentic **RTL Tankobon** page modes with hardware-accelerated 120Hz/60Hz physics.
- **70% Creator Revenue Share**: Direct author payouts via South African bank EFT (FNB, Standard Bank, Capitec, Nedbank, Absa), and VISA/Mastercard.
- **AZ Backdrop & Originals**: Independent creator self-publishing desk with official IP promotion pathways.
- **Manga of the Year Gala 2026**: Reader's Choice voting and category awards.
- **Capacitor Android Native App**: Pre-configured with hardware WebView rasterization and AdMob monetizations.

---

## 📦 Direct Android APK Download
Download the latest pre-compiled Android debug package directly from GitHub Actions CI/CD:
👉 **[Download Latest `app-debug.apk`](https://github.com/mlungisenimbhele3-prog/manga-publisher-app/releases/latest/download/app-debug.apk)**

Release notes and automated builds:  
👉 **[GitHub Releases Page](https://github.com/mlungisenimbhele3-prog/manga-publisher-app/releases)**

---

## 🚀 Quick Start & Development

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10+
- **JDK**: Java 17 (Temurin recommended) for Android builds
- **Android Studio / SDK**: Android SDK Platform 34+

### Installation
```bash
# Clone this repository
git clone https://github.com/mlungisenimbhele3-prog/manga-publisher-app.git
cd manga-publisher-app

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

## 🤖 Android Build & CI/CD Pipeline

The project includes automated GitHub Actions in [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) that automatically compile and publish the Android APK on every push to `main`.

### Local Android Compilation
```bash
# 1. Build web assets & sync Capacitor
npm run build
npx cap sync android

# 2. Compile APK using Gradle (Java 17)
cd android
./gradlew :app:assembleDebug

# APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
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

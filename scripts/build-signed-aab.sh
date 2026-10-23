#!/usr/bin/env bash
# Build Signed Release AAB for Google Play Store & Push to GitHub Releases
# Produced by Mlungiseni Mbhele - AZ OVERVERSE
set -e

echo "=========================================================="
echo "  AZ OVERVERSE - Build Signed Release AAB for Play Store  "
echo "=========================================================="

KEYSTORE_PATH="android/app/release.keystore"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-azoververse}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-azoververse2026}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-azoververse2026}"

# 1. Check or generate release keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
  if command -v keytool >/dev/null 2>&1; then
    echo "🔑 Generating release keystore at $KEYSTORE_PATH..."
    keytool -genkeypair -v \
      -keystore "$KEYSTORE_PATH" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass "$STORE_PASS" \
      -keypass "$KEY_PASS" \
      -dname "CN=AZ OVERVERSE, OU=Manga Publishing, O=AZ Oververse, L=Durban, ST=KZN, C=ZA"
  else
    echo "⚠️ keytool command not found in environment. Build will use CI / GitHub Actions workflow."
  fi
else
  echo "✅ Found existing release keystore at $KEYSTORE_PATH"
fi

# 2. Build Web Application & Capacitor Sync
echo "📦 Building web assets..."
npm run build

echo "🔄 Syncing Capacitor Android assets..."
npx cap sync android

# 3. Check for Java / Gradle to run local build
if command -v java >/dev/null 2>&1; then
  echo "🔨 Compiling Signed Android App Bundle (AAB)..."
  cd android
  chmod +x gradlew
  ./gradlew bundleRelease
  cd ..

  AAB_OUTPUT=$(find android/app/build/outputs/bundle/release -name "*.aab" 2>/dev/null | head -n 1)
  if [ -n "$AAB_OUTPUT" ]; then
    echo "🎉 Successfully built Signed Release AAB: $AAB_OUTPUT"
    cp "$AAB_OUTPUT" ./az-oververse-release.aab
    
    # 4. Push to GitHub Releases if GitHub CLI is installed
    if command -v gh >/dev/null 2>&1; then
      TAG="v1.0.$(date +'%Y%m%d%H%M')"
      echo "🚀 Publishing $TAG to GitHub Releases..."
      gh release create "$TAG" ./az-oververse-release.aab \
        --title "AZ OVERVERSE Release $TAG" \
        --notes "Production Signed AAB for Google Play Store upload. Includes full User Profile, Reading Progress, Bookmarks, and Social Community features."
      echo "✅ Published to GitHub Releases: $TAG"
    else
      echo "ℹ️ gh CLI not found. Push changes to GitHub repository; GitHub Actions workflow will automatically build and publish the release AAB."
    fi
  fi
else
  echo "ℹ️ Java environment not detected in container. GitHub Actions CI/CD (.github/workflows/build-release-aab.yml) is fully configured to compile the signed AAB and push to GitHub Releases automatically on git push."
fi

echo "=========================================================="
echo "  AAB Build Configuration & Release Workflow Ready!       "
echo "=========================================================="

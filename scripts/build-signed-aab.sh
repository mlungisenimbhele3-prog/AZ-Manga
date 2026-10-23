#!/usr/bin/env bash
# Build Signed Release AAB (app-release.aab -> AZ-Oververse-PlayStore.aab) & Upload to GitHub Releases
# Produced by Mlungiseni Mbhele - AZ OVERVERSE
set -e

echo "=================================================================="
echo "  AZ OVERVERSE - Build Signed Google Play Release AAB Bundle      "
echo "=================================================================="

KEYSTORE_PATH="android/app/release.keystore"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-azoververse}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-azoververse2026}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-azoververse2026}"
REPO_SLUG="${GITHUB_REPOSITORY:-mlungisenimbhele3-prog/AZ-Manga}"

# 1. Check or generate release keystore
if [ ! -f "$KEYSTORE_PATH" ]; then
  if command -v keytool >/dev/null 2>&1; then
    echo "Generating signed RSA-2048 upload keystore at $KEYSTORE_PATH..."
    keytool -genkeypair -v \
      -storetype PKCS12 \
      -keystore "$KEYSTORE_PATH" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass "$STORE_PASS" \
      -keypass "$KEY_PASS" \
      -dname "CN=Mlungiseni Mbhele, OU=AZ Oververse, O=AZ Oververse, L=Durban, ST=KZN, C=ZA"
  else
    echo "keytool not found locally. GitHub Actions CI (.github/workflows/build-release-aab.yml) will sign and publish AZ-Oververse-PlayStore.aab."
  fi
else
  echo "Found existing release keystore at $KEYSTORE_PATH"
fi

# 2. Build Web Application & Capacitor Sync
echo "Building production web assets..."
npm run build

echo "Syncing Capacitor Android assets..."
npx cap sync android

# 3. Check for Java / Gradle to run local build
if command -v java >/dev/null 2>&1; then
  echo "Compiling Signed Android App Bundle (:app:bundleRelease)..."
  cd android
  chmod +x gradlew
  ./gradlew :app:bundleRelease -x lint -x lintVitalRelease --stacktrace
  cd ..

  AAB_OUTPUT="android/app/build/outputs/bundle/release/app-release.aab"
  if [ ! -f "$AAB_OUTPUT" ]; then
    AAB_OUTPUT=$(find android/app/build/outputs/bundle/release -name "*.aab" 2>/dev/null | head -n 1)
  fi

  if [ -n "$AAB_OUTPUT" ] && [ -f "$AAB_OUTPUT" ]; then
    if command -v jarsigner >/dev/null 2>&1; then
      jarsigner -verify -verbose -certs "$AAB_OUTPUT" | head -n 20
    fi
    cp "$AAB_OUTPUT" ./AZ-Oververse-PlayStore.aab
    sha256sum ./AZ-Oververse-PlayStore.aab > ./AZ-Oververse-PlayStore.aab.sha256
    echo "Built Signed Release AAB: ./AZ-Oververse-PlayStore.aab"

    # 4. Upload to GitHub Releases if GitHub CLI is installed
    if command -v gh >/dev/null 2>&1; then
      echo "Uploading AZ-Oververse-PlayStore.aab to GitHub Releases ($REPO_SLUG)..."
      gh release upload latest ./AZ-Oververse-PlayStore.aab ./AZ-Oververse-PlayStore.aab.sha256 --clobber --repo "$REPO_SLUG" || \
      gh release create latest ./AZ-Oververse-PlayStore.aab ./AZ-Oververse-PlayStore.aab.sha256 \
        --repo "$REPO_SLUG" \
        --latest \
        --title "AZ OVERVERSE — Google Play Store Signed Release AAB" \
        --notes "Signed Google Play Store release bundle (AZ-Oververse-PlayStore.aab)."
      echo "Download Link: https://github.com/$REPO_SLUG/releases/latest/download/AZ-Oververse-PlayStore.aab"
    fi
  fi
else
  echo "Local JDK not installed in preview container. Push/sync to $REPO_SLUG to trigger .github/workflows/build-release-aab.yml."
  echo "Permanent Release Download URL: https://github.com/$REPO_SLUG/releases/latest/download/AZ-Oververse-PlayStore.aab"
fi

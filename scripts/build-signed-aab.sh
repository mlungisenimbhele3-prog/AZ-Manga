#!/usr/bin/env bash
# Build and cryptographically sign AZ-OVERVERSE-signed.aab (com.azoververse.manga v1.0.3)
# Produced by Mlungiseni Mbhele - AZ OVERVERSE
set -e

echo "========================================================================="
echo "  AZ OVERVERSE v1.0.3 (com.azoververse.manga) - Signed Release AAB   "
echo "========================================================================="

KEYSTORE_FILE_NAME="upload-keystore.jks"
ROOT_KEYSTORE_PATH="./$KEYSTORE_FILE_NAME"
KEYSTORE_PATH="android/app/$KEYSTORE_FILE_NAME"
CERT_PEM_PATH="./upload_certificate.pem"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-upload}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-AzOververse2026!}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-AzOververse2026!}"
VERSION_CODE="${ANDROID_VERSION_CODE:-103}"
VERSION_NAME="${ANDROID_VERSION_NAME:-1.0.3}"

# 1. Generate Black AZ launcher icons & splash screens
echo "Generating Black AZ launcher icons and splash screens..."
node scripts/generate-android-assets.cjs

# 2. Preserve and sync permanent Google Play upload-keystore.jks (NEVER overwrite existing key)
if [ -f "$ROOT_KEYSTORE_PATH" ] && [ ! -f "$KEYSTORE_PATH" ]; then
  cp "$ROOT_KEYSTORE_PATH" "$KEYSTORE_PATH"
elif [ -f "$KEYSTORE_PATH" ] && [ ! -f "$ROOT_KEYSTORE_PATH" ]; then
  cp "$KEYSTORE_PATH" "$ROOT_KEYSTORE_PATH"
elif [ ! -f "$ROOT_KEYSTORE_PATH" ] && [ ! -f "$KEYSTORE_PATH" ]; then
  echo "Generating signed RSA-2048 upload keystore at $ROOT_KEYSTORE_PATH..."
  keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$ROOT_KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -sigalg SHA256withRSA \
    -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=AZ OVERVERSE, O=AZ OVERVERSE, C=ZA"
  cp "$ROOT_KEYSTORE_PATH" "$KEYSTORE_PATH"
fi

echo "Using permanent Google Play upload keystore at $KEYSTORE_PATH (alias: $KEY_ALIAS)"

if [ ! -f "$CERT_PEM_PATH" ] && command -v keytool >/dev/null 2>&1; then
  keytool -export -rfc -keystore "$ROOT_KEYSTORE_PATH" -alias "$KEY_ALIAS" -file "$CERT_PEM_PATH" -storepass "$STORE_PASS"
fi

# 3. Build Web Application & Capacitor Sync
echo "Building production web assets..."
npm run build

echo "Syncing Capacitor Android assets..."
npx cap sync android

# Re-ensure Black AZ launcher icons after cap sync
node scripts/generate-android-assets.cjs

# 4. Build Signed Release AAB via Gradle
if [ -d "/opt/android-sdk" ] && [ -z "${ANDROID_HOME:-}" ]; then
  export ANDROID_HOME="/opt/android-sdk"
  export ANDROID_SDK_ROOT="/opt/android-sdk"
fi

export ANDROID_KEYSTORE_PATH="$KEYSTORE_FILE_NAME"
export ANDROID_KEY_ALIAS="$KEY_ALIAS"
export ANDROID_KEYSTORE_PASSWORD="$STORE_PASS"
export ANDROID_KEY_PASSWORD="$KEY_PASS"
export ANDROID_VERSION_CODE="$VERSION_CODE"
export ANDROID_VERSION_NAME="$VERSION_NAME"

cd android
chmod +x gradlew
./gradlew :app:bundleRelease --no-daemon --max-workers=1 -Dkotlin.compiler.execution.strategy=in-process -x lint -x lintVitalRelease --stacktrace
cd ..

AAB_OUTPUT="android/app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB_OUTPUT" ]; then
  echo "Error: Release bundle not found at $AAB_OUTPUT"
  exit 1
fi

cp "$AAB_OUTPUT" ./AZ-OVERVERSE-signed.aab

# Verify signature with jarsigner (re-sign explicitly if needed, then verify strictly)
echo "Verifying cryptographic signature on AZ-OVERVERSE-signed.aab..."
if ! jarsigner -verify -strict ./AZ-OVERVERSE-signed.aab >/dev/null 2>&1; then
  echo "Applying explicit SHA256withRSA signature via jarsigner..."
  jarsigner -verbose \
    -sigalg SHA256withRSA \
    -digestalg SHA-256 \
    -keystore "$KEYSTORE_PATH" \
    -storepass "$STORE_PASS" \
    -keypass "$KEY_PASS" \
    ./AZ-OVERVERSE-signed.aab "$KEY_ALIAS"
fi

jarsigner -verify -verbose -certs ./AZ-OVERVERSE-signed.aab | head -n 35
sha256sum ./AZ-OVERVERSE-signed.aab > ./AZ-OVERVERSE-signed.aab.sha256
ls -lh ./AZ-OVERVERSE-signed.aab ./AZ-OVERVERSE-signed.aab.sha256
echo "✅ Successfully built and verified SIGNED Play Console bundle: ./AZ-OVERVERSE-signed.aab"

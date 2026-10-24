#!/usr/bin/env bash
# Make mlungisenimbhele3-prog/manga-publisher-app public, push all code, and publish Release v1.0.0
# with BOTH app-debug.apk and signed app-release.aab
# Produced by Mlungiseni Mbhele - AZ OVERVERSE
set -e

echo "=================================================================="
echo "  AZ OVERVERSE v1.0.0 - Public GitHub Repo + APK & AAB Release    "
echo "=================================================================="

KEYSTORE_PATH="android/app/release.keystore"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-azoververse}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-azoververse2026}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-azoververse2026}"
REPO_SLUG="${GITHUB_REPOSITORY:-mlungisenimbhele3-prog/manga-publisher-app}"
RELEASE_TAG="${RELEASE_TAG:-v1.0.0}"

# 1. Make repository public & push all current code if GitHub CLI is available
if command -v gh >/dev/null 2>&1; then
  echo "Ensuring GitHub repository $REPO_SLUG exists and is PUBLIC..."
  if gh repo view "$REPO_SLUG" >/dev/null 2>&1; then
    gh repo edit "$REPO_SLUG" --visibility public --accept-visibility-change-consequences || true
  else
    gh repo create "$REPO_SLUG" --public --description "AZ OVERVERSE - Pan-African Manga Publishing Platform produced by Mlungiseni Mbhele" || true
  fi

  echo "Enabling GitHub Actions Read & Write workflow permissions..."
  gh api -X PUT "repos/$REPO_SLUG/actions/permissions/workflow" \
    -f default_workflow_permissions=write \
    -F can_approve_pull_request_reviews=true >/dev/null 2>&1 || true

  if [ ! -d ".git" ]; then
    git init -b main
  fi
  git remote remove origin >/dev/null 2>&1 || true
  git remote add origin "https://github.com/$REPO_SLUG.git"
  git add -A
  git commit -m "chore: AZ OVERVERSE v1.0.0 release (LTR reader, az-oververse.ai.studio, APK + signed AAB)" || true
  git branch -M main
  git push -u origin main --force
fi

# 2. Check or generate release keystore
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
    echo "keytool not found locally. GitHub Actions CI (.github/workflows/build-release-aab.yml) will sign and publish $RELEASE_TAG."
  fi
else
  echo "Found existing release keystore at $KEYSTORE_PATH"
fi

# 3. Build Web Application & Capacitor Sync
echo "Building production web assets..."
npm run build

echo "Syncing Capacitor Android assets..."
npx cap sync android

# 4. Check for Java / Gradle to run local build of BOTH app-debug.apk and app-release.aab
if command -v java >/dev/null 2>&1; then
  echo "Compiling BOTH app-debug.apk (:app:assembleDebug) and Signed app-release.aab (:app:bundleRelease)..."
  cd android
  chmod +x gradlew
  ANDROID_VERSION_NAME="1.0.0" ./gradlew :app:assembleDebug :app:bundleRelease -x lint -x lintVitalRelease --stacktrace
  cd ..

  APK_OUTPUT="android/app/build/outputs/apk/debug/app-debug.apk"
  AAB_OUTPUT="android/app/build/outputs/bundle/release/app-release.aab"

  if [ -f "$APK_OUTPUT" ] && [ -f "$AAB_OUTPUT" ]; then
    if command -v jarsigner >/dev/null 2>&1; then
      jarsigner -verify -verbose -certs "$AAB_OUTPUT" | head -n 20
    fi
    cp "$APK_OUTPUT" ./app-debug.apk
    cp "$AAB_OUTPUT" ./app-release.aab
    cp "$AAB_OUTPUT" ./AZ-Oververse-PlayStore.aab
    sha256sum ./app-debug.apk ./app-release.aab ./AZ-Oververse-PlayStore.aab > ./SHA256SUMS.txt
    echo "Built BOTH ./app-debug.apk and ./app-release.aab"

    # 5. Create/Update Public Release v1.0.0 via GitHub CLI
    if command -v gh >/dev/null 2>&1; then
      echo "Publishing public GitHub Release $RELEASE_TAG on $REPO_SLUG..."
      if gh release view "$RELEASE_TAG" --repo "$REPO_SLUG" >/dev/null 2>&1; then
        gh release edit "$RELEASE_TAG" --repo "$REPO_SLUG" --draft=false --prerelease=false --latest
        gh release upload "$RELEASE_TAG" ./app-debug.apk ./app-release.aab ./AZ-Oververse-PlayStore.aab ./SHA256SUMS.txt --clobber --repo "$REPO_SLUG"
      else
        gh release create "$RELEASE_TAG" ./app-debug.apk ./app-release.aab ./AZ-Oververse-PlayStore.aab ./SHA256SUMS.txt \
          --repo "$REPO_SLUG" \
          --latest \
          --title "AZ OVERVERSE v1.0.0 — Android APK & Google Play Release AAB" \
          --notes "Public v1.0.0 release containing BOTH app-debug.apk and signed app-release.aab."
      fi
      echo "Public APK URL: https://github.com/$REPO_SLUG/releases/download/$RELEASE_TAG/app-debug.apk"
      echo "Public AAB URL: https://github.com/$REPO_SLUG/releases/download/$RELEASE_TAG/app-release.aab"
    fi
  fi
else
  if command -v gh >/dev/null 2>&1; then
    echo "Triggering GitHub Actions workflow to build & publish Release $RELEASE_TAG..."
    gh workflow run build-release-aab.yml --repo "$REPO_SLUG" -f release_tag="$RELEASE_TAG" || true
  fi
  echo "Public Release Page: https://github.com/$REPO_SLUG/releases/tag/$RELEASE_TAG"
  echo "Public APK Download: https://github.com/$REPO_SLUG/releases/download/$RELEASE_TAG/app-debug.apk"
  echo "Public AAB Download: https://github.com/$REPO_SLUG/releases/download/$RELEASE_TAG/app-release.aab"
fi

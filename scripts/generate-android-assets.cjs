const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Official AZ OVERVERSE emblem logo for Android Launcher, Splash & PWA Icons
const APP_ICON_PATH = path.resolve(
  __dirname,
  '../public/assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg'
);

const BRAND_BG = { r: 15, g: 4, b: 36, alpha: 1 }; // #0F0424 cosmic dark backdrop

function createSquircleMaskSvg(size, radiusRatio = 0.2) {
  const rx = Math.round(size * radiusRatio);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#ffffff"/></svg>`
  );
}

// Target configurations
const SPLASH_TARGETS = [
  { path: 'android/app/src/main/res/drawable/splash.png', width: 480, height: 320 },
  { path: 'android/app/src/main/res/drawable-land-mdpi/splash.png', width: 480, height: 320 },
  { path: 'android/app/src/main/res/drawable-land-hdpi/splash.png', width: 800, height: 480 },
  { path: 'android/app/src/main/res/drawable-land-xhdpi/splash.png', width: 1280, height: 720 },
  { path: 'android/app/src/main/res/drawable-land-xxhdpi/splash.png', width: 1600, height: 960 },
  { path: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', width: 1920, height: 1280 },
  { path: 'android/app/src/main/res/drawable-port-mdpi/splash.png', width: 320, height: 480 },
  { path: 'android/app/src/main/res/drawable-port-hdpi/splash.png', width: 480, height: 800 },
  { path: 'android/app/src/main/res/drawable-port-xhdpi/splash.png', width: 720, height: 1280 },
  { path: 'android/app/src/main/res/drawable-port-xxhdpi/splash.png', width: 960, height: 1600 },
  { path: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', width: 1280, height: 1920 },
];

const LAUNCHER_TARGETS = [
  // mdpi
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48, type: 'standard' },
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48, type: 'round' },
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', size: 108, type: 'foreground' },
  // hdpi
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72, type: 'standard' },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72, type: 'round' },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', size: 162, type: 'foreground' },
  // xhdpi
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96, type: 'standard' },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96, type: 'round' },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', size: 216, type: 'foreground' },
  // xxhdpi
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144, type: 'standard' },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144, type: 'round' },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', size: 324, type: 'foreground' },
  // xxxhdpi
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192, type: 'standard' },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192, type: 'round' },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', size: 432, type: 'foreground' },
  // Web / PWA Assets
  { path: 'public/pwa-192x192.png', size: 192, type: 'squircle' },
  { path: 'public/pwa-512x512.png', size: 512, type: 'squircle' },
  { path: 'public/pwa-maskable-192x192.png', size: 192, type: 'maskable' },
  { path: 'public/pwa-maskable-512x512.png', size: 512, type: 'maskable' },
  { path: 'public/apple-touch-icon.png', size: 180, type: 'standard' },
  { path: 'public/favicon.png', size: 64, type: 'squircle' },
  { path: 'public/master-logo.png', size: 512, type: 'squircle' },
];

async function generateSplash(target, iconBuffer) {
  const { width, height, path: outPath } = target;
  const logoDimension = Math.round(Math.min(width, height) * 0.68);

  const rawResized = await sharp(iconBuffer)
    .resize(logoDimension, logoDimension, { fit: 'cover', background: BRAND_BG })
    .ensureAlpha()
    .toBuffer();

  const resizedLogo = await sharp(rawResized)
    .composite([{ input: createSquircleMaskSvg(logoDimension, 0.2), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const left = Math.round((width - logoDimension) / 2);
  const top = Math.round((height - logoDimension) / 2);

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 13, b: 20, alpha: 1 }, // #0a0d14 splash backdrop
    },
  })
    .composite([
      {
        input: resizedLogo,
        top: Math.max(0, top),
        left: Math.max(0, left),
      },
    ])
    .png()
    .toFile(outPath);
}

async function generateLauncherIcon(target, iconBuffer) {
  const { size, type, path: outPath } = target;
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (type === 'round') {
    const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff" /></svg>`;
    const resized = await sharp(iconBuffer)
      .resize(size, size, { fit: 'cover', background: BRAND_BG })
      .ensureAlpha()
      .toBuffer();
    await sharp(resized)
      .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
      .png()
      .toFile(outPath);
  } else if (type === 'foreground') {
    // Adaptive icon foreground: central 70% safe zone blended onto #0F0424 ic_launcher_background
    const innerSize = Math.round(size * 0.7);
    const innerRaw = await sharp(iconBuffer)
      .resize(innerSize, innerSize, { fit: 'cover', background: BRAND_BG })
      .ensureAlpha()
      .toBuffer();
    const innerLogo = await sharp(innerRaw)
      .composite([{ input: createSquircleMaskSvg(innerSize, 0.22), blend: 'dest-in' }])
      .png()
      .toBuffer();
    const offset = Math.round((size - innerSize) / 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: innerLogo, top: offset, left: offset }])
      .png()
      .toFile(outPath);
  } else if (type === 'maskable') {
    // Maskable PWA icon: 78% central safe zone over full-bleed #0F0424 cosmic dark backdrop
    const innerSize = Math.round(size * 0.78);
    const innerLogoRaw = await sharp(iconBuffer)
      .resize(innerSize, innerSize, { fit: 'cover', background: BRAND_BG })
      .ensureAlpha()
      .toBuffer();
    const innerLogo = await sharp(innerLogoRaw)
      .composite([{ input: createSquircleMaskSvg(innerSize, 0.2), blend: 'dest-in' }])
      .png()
      .toBuffer();
    const offset = Math.round((size - innerSize) / 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BRAND_BG,
      },
    })
      .composite([{ input: innerLogo, top: offset, left: offset }])
      .png()
      .toFile(outPath);
  } else if (type === 'squircle') {
    const resized = await sharp(iconBuffer)
      .resize(size, size, { fit: 'cover', background: BRAND_BG })
      .ensureAlpha()
      .toBuffer();
    await sharp(resized)
      .composite([{ input: createSquircleMaskSvg(size, 0.2), blend: 'dest-in' }])
      .png()
      .toFile(outPath);
  } else {
    // Standard full-bleed square icon (iOS apple-touch-icon, legacy Android square)
    await sharp(iconBuffer)
      .resize(size, size, { fit: 'cover', background: BRAND_BG })
      .flatten({ background: { r: BRAND_BG.r, g: BRAND_BG.g, b: BRAND_BG.b } })
      .png()
      .toFile(outPath);
  }
}

async function run() {
  console.log('Loading AZ OVERVERSE Icon from:', APP_ICON_PATH);
  if (!fs.existsSync(APP_ICON_PATH)) {
    throw new Error('AZ OVERVERSE icon image not found: ' + APP_ICON_PATH);
  }
  const iconBuffer = fs.readFileSync(APP_ICON_PATH);

  // Save canonical Play Store 512x512 hi-res icon, master-logo.jpg & SVG
  const playStoreIconPng = path.resolve(__dirname, '../public/playstore-icon-512.png');
  const masterLogoJpg = path.resolve(__dirname, '../public/master-logo.jpg');
  const canonIconSvg = path.resolve(__dirname, '../public/icon.svg');

  await sharp(iconBuffer)
    .resize(512, 512, { fit: 'cover', background: BRAND_BG })
    .flatten({ background: { r: BRAND_BG.r, g: BRAND_BG.g, b: BRAND_BG.b } })
    .png()
    .toFile(playStoreIconPng);

  await sharp(iconBuffer)
    .resize(512, 512, { fit: 'cover', background: BRAND_BG })
    .flatten({ background: { r: BRAND_BG.r, g: BRAND_BG.g, b: BRAND_BG.b } })
    .jpeg({ quality: 94 })
    .toFile(masterLogoJpg);

  const raw512 = await sharp(iconBuffer)
    .resize(512, 512, { fit: 'cover', background: BRAND_BG })
    .ensureAlpha()
    .toBuffer();
  const iconPngBuf = await sharp(raw512)
    .composite([{ input: createSquircleMaskSvg(512, 0.2), blend: 'dest-in' }])
    .png()
    .toBuffer();

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <image href="data:image/png;base64,${iconPngBuf.toString('base64')}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>\n</svg>\n`;
  fs.writeFileSync(canonIconSvg, svgContent, 'utf8');
  console.log('✓ Saved Play Store 512x512 icon, master-logo.jpg, and icon.svg to public/');

  console.log('Generating AZ OVERVERSE Android Splash Screens...');
  for (const t of SPLASH_TARGETS) {
    await generateSplash(t, iconBuffer);
    console.log(`✓ Generated splash: ${t.path} (${t.width}x${t.height})`);
  }

  console.log('Generating Android Launcher Icons & PWA Icons...');
  for (const t of LAUNCHER_TARGETS) {
    await generateLauncherIcon(t, iconBuffer);
    console.log(`✓ Generated icon: ${t.path} (${t.size}x${t.size}, ${t.type})`);
  }

  console.log('All Android mipmap launcher icons, splash assets & PWA icons generated!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

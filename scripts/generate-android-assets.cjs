const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Official AZ OVERVERSE circular logo for Android Launcher, Splash & PWA Icons
const BLACK_AZ_ICON_PATH = path.resolve(
  __dirname,
  '../public/assets/aistudio/az_oververse_black_silver_transparent_29ae4c4c.png'
);

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
  { path: 'public/pwa-192x192.png', size: 192, type: 'transparent' },
  { path: 'public/pwa-512x512.png', size: 512, type: 'transparent' },
  { path: 'public/pwa-maskable-192x192.png', size: 192, type: 'maskable' },
  { path: 'public/pwa-maskable-512x512.png', size: 512, type: 'maskable' },
  { path: 'public/apple-touch-icon.png', size: 180, type: 'standard' },
  { path: 'public/favicon.png', size: 64, type: 'transparent' },
  { path: 'public/master-logo.png', size: 512, type: 'transparent' },
];

async function generateSplash(target, iconBuffer) {
  const { width, height, path: outPath } = target;
  const logoDimension = Math.round(Math.min(width, height) * 0.72);

  const resizedLogo = await sharp(iconBuffer)
    .resize(logoDimension, logoDimension, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
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
      background: { r: 0, g: 0, b: 0, alpha: 1 }, // Pure #000000 black
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
      .resize(size, size, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toBuffer();
    await sharp(resized)
      .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
      .png()
      .toFile(outPath);
  } else if (type === 'foreground') {
    // Adaptive icon foreground: safe zone (center 68%) circularly masked so outer area blends seamlessly onto #000000 ic_launcher_background
    const innerSize = Math.round(size * 0.68);
    const circleMask = `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="#fff" /></svg>`;
    const innerRaw = await sharp(iconBuffer)
      .resize(innerSize, innerSize, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toBuffer();
    const innerLogo = await sharp(innerRaw)
      .composite([{ input: Buffer.from(circleMask), blend: 'dest-in' }])
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
    // Maskable PWA icon: 74% central safe zone over full-bleed #000000 black
    const innerSize = Math.round(size * 0.74);
    const circleMask = `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="#fff" /></svg>`;
    const innerLogoRaw = await sharp(iconBuffer)
      .resize(innerSize, innerSize, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toBuffer();
    const innerLogo = await sharp(innerLogoRaw)
      .composite([{ input: Buffer.from(circleMask), blend: 'dest-in' }])
      .png()
      .toBuffer();
    const offset = Math.round((size - innerSize) / 2);

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }, // Pure #000000 black
      },
    })
      .composite([{ input: innerLogo, top: offset, left: offset }])
      .png()
      .toFile(outPath);
  } else if (type === 'transparent') {
    await sharp(iconBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
  } else {
    // Standard full-bleed black square icon
    await sharp(iconBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .png()
      .toFile(outPath);
  }
}

async function run() {
  console.log('Loading AZ OVERVERSE Icon from:', BLACK_AZ_ICON_PATH);
  if (!fs.existsSync(BLACK_AZ_ICON_PATH)) {
    throw new Error('AZ OVERVERSE icon image not found: ' + BLACK_AZ_ICON_PATH);
  }
  const iconBuffer = fs.readFileSync(BLACK_AZ_ICON_PATH);

  // Save canonical Play Store 512x512 hi-res icon, master-logo.jpg & SVG
  const playStoreIconPng = path.resolve(__dirname, '../public/playstore-icon-512.png');
  const masterLogoJpg = path.resolve(__dirname, '../public/master-logo.jpg');
  const canonIconSvg = path.resolve(__dirname, '../public/icon.svg');

  await sharp(iconBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .png()
    .toFile(playStoreIconPng);

  await sharp(iconBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .jpeg({ quality: 92 })
    .toFile(masterLogoJpg);

  const iconPngBuf = await sharp(iconBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <image href="data:image/png;base64,${iconPngBuf.toString('base64')}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>\n</svg>\n`;
  fs.writeFileSync(canonIconSvg, svgContent, 'utf8');
  console.log('✓ Saved Play Store 512x512 icon, master-logo.jpg, and icon.svg to public/');

  console.log('Generating AZ OVERVERSE Android Splash Screens with Black AZ Icon...');
  for (const t of SPLASH_TARGETS) {
    await generateSplash(t, iconBuffer);
    console.log(`✓ Generated splash: ${t.path} (${t.width}x${t.height})`);
  }

  console.log('Generating Android Launcher Icons & PWA Icons with Black AZ Icon...');
  for (const t of LAUNCHER_TARGETS) {
    await generateLauncherIcon(t, iconBuffer);
    console.log(`✓ Generated icon: ${t.path} (${t.size}x${t.size}, ${t.type})`);
  }

  console.log('All Android mipmap launcher icons & splash assets generated with Black AZ Icon!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

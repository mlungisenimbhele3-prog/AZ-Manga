const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MASTER_IMAGE_PATH = path.resolve(__dirname, '../public/assets/aistudio/863828260_4617557535148066_7093504428428258727_n_00bb7391.webp');
const BG_DARK = '#0a0d14';

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
  { path: 'public/pwa-192x192.png', size: 192, type: 'standard' },
  { path: 'public/pwa-512x512.png', size: 512, type: 'standard' },
  { path: 'public/pwa-maskable-192x192.png', size: 192, type: 'maskable' },
  { path: 'public/pwa-maskable-512x512.png', size: 512, type: 'maskable' },
  { path: 'public/apple-touch-icon.png', size: 180, type: 'standard' },
  { path: 'public/favicon.png', size: 64, type: 'standard' },
];

async function generateSplash(target, masterBuffer) {
  const { width, height, path: outPath } = target;
  const logoDimension = Math.round(Math.min(width, height) * 0.72);

  const resizedLogo = await sharp(masterBuffer)
    .resize(logoDimension, logoDimension, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
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
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a
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

async function generateLauncherIcon(target, masterBuffer) {
  const { size, type, path: outPath } = target;
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (type === 'round') {
    const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff" /></svg>`;
    const resized = await sharp(masterBuffer).resize(size, size).toBuffer();
    await sharp(resized)
      .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
      .png()
      .toFile(outPath);
  } else if (type === 'foreground') {
    // For adaptive icons, foreground is typically centered inside a safe circle (center 66-72%)
    const innerSize = Math.round(size * 0.72);
    const innerLogo = await sharp(masterBuffer).resize(innerSize, innerSize).toBuffer();
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
    // Maskable PWA icon: 74% central safe zone (13% padding on all sides) over full-bleed #0f172a
    const innerSize = Math.round(size * 0.74);
    const circleMask = `<svg width="${innerSize}" height="${innerSize}"><circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="#fff" /></svg>`;
    const innerLogoRaw = await sharp(masterBuffer).resize(innerSize, innerSize).toBuffer();
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
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a
      },
    })
      .composite([{ input: innerLogo, top: offset, left: offset }])
      .png()
      .toFile(outPath);
  } else {
    // Standard icon
    await sharp(masterBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
  }
}

async function run() {
  console.log('Loading Master Logo from:', MASTER_IMAGE_PATH);
  if (!fs.existsSync(MASTER_IMAGE_PATH)) {
    throw new Error('Master image not found: ' + MASTER_IMAGE_PATH);
  }
  const masterBuffer = fs.readFileSync(MASTER_IMAGE_PATH);

  // Save canonical copies
  const canonPng = path.resolve(__dirname, '../public/master-logo.png');
  const canonJpg = path.resolve(__dirname, '../public/master-logo.jpg');
  const canonPlaceholder = path.resolve(__dirname, '../public/placeholder.png');
  const canonIconSvg = path.resolve(__dirname, '../public/icon.svg');
  const canonSrcPng = path.resolve(__dirname, '../src/assets/images/master-logo.png');
  const srcImgDir = path.dirname(canonSrcPng);
  if (!fs.existsSync(srcImgDir)) fs.mkdirSync(srcImgDir, { recursive: true });

  await sharp(masterBuffer).resize(512, 512, { fit: 'cover' }).png().toFile(canonPng);
  await sharp(masterBuffer).resize(512, 512, { fit: 'cover' }).jpeg({ quality: 95 }).toFile(canonJpg);
  await sharp(masterBuffer).resize(512, 512, { fit: 'cover' }).png().toFile(canonPlaceholder);
  await sharp(masterBuffer).resize(512, 512, { fit: 'cover' }).png().toFile(canonSrcPng);

  // Update public/icon.svg with embedded 512x512 PNG from the new logo
  const iconPngBuf = await sharp(masterBuffer).resize(512, 512, { fit: 'cover' }).png().toBuffer();
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <rect width="512" height="512" fill="#000000" rx="100"/>\n  <image href="data:image/png;base64,${iconPngBuf.toString('base64')}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/>\n</svg>\n`;
  fs.writeFileSync(canonIconSvg, svgContent, 'utf8');
  console.log('✓ Saved canonical master logos, placeholder.png, and icon.svg to public/ and src/assets/images/');

  console.log('Generating AZ OVERVERSE Android Splash Screens with Master Logo...');
  for (const t of SPLASH_TARGETS) {
    await generateSplash(t, masterBuffer);
    console.log(`✓ Generated splash: ${t.path} (${t.width}x${t.height})`);
  }

  console.log('Generating Android Launcher Icons & Web Assets with Master Logo...');
  for (const t of LAUNCHER_TARGETS) {
    await generateLauncherIcon(t, masterBuffer);
    console.log(`✓ Generated icon: ${t.path} (${t.size}x${t.size}, ${t.type})`);
  }

  console.log('All splash and launcher assets successfully generated from Master Logo!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

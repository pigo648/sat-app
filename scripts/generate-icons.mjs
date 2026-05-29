import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../../Desktop/SAT.jpg');
const outDir = resolve(__dirname, '../packages/frontend/public/icons');

if (!existsSync(src)) {
  console.error('SAT.jpg not found on Desktop!');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// Icon sizes needed for PWA + Capacitor
const sizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'maskable-icon-512x512.png', size: 512, padding: 0.15 },
  // Android specific
  { name: 'android-icon-36.png', size: 36 },
  { name: 'android-icon-48.png', size: 48 },
  { name: 'android-icon-72.png', size: 72 },
  { name: 'android-icon-96.png', size: 96 },
  { name: 'android-icon-144.png', size: 144 },
  { name: 'android-icon-192.png', size: 192 },
  // iOS specific (just in case)
  { name: 'apple-icon-180.png', size: 180 },
  { name: 'apple-icon-167.png', size: 167 },
  { name: 'apple-icon-152.png', size: 152 },
  { name: 'apple-icon-120.png', size: 120 },
];

async function generate() {
  console.log(`Generating icons from: ${src}`);

  for (const { name, size, padding } of sizes) {
    const outPath = resolve(outDir, name);

    let pipeline = sharp(src).resize(size, size, {
      fit: 'cover',
      position: 'center',
    });

    // For maskable icons, add safe zone padding
    if (padding) {
      const innerSize = Math.round(size * (1 - padding * 2));
      const padPx = Math.round(size * padding);
      pipeline = pipeline.resize(innerSize, innerSize, { fit: 'cover', position: 'center' })
        .extend({
          top: padPx, bottom: padPx, left: padPx, right: padPx,
          background: { r: 30, g: 64, b: 175, alpha: 1 }, // #1E40AF
        });
    }

    await pipeline.png().toFile(outPath);
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Generate adaptive icon layers for Android
  // Foreground: smaller centered icon on transparent bg
  const fgSize = 432;
  const fgInner = Math.round(fgSize * 0.5);
  const fgPad = Math.round((fgSize - fgInner) / 2);
  await sharp(src)
    .resize(fgInner, fgInner, { fit: 'cover', position: 'center' })
    .extend({ top: fgPad, bottom: fgPad, left: fgPad, right: fgPad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(outDir, 'android-fg.png'));
  console.log('  ✓ android-fg.png (adaptive icon foreground)');

  // Background: solid brand color
  await sharp({ create: { width: 432, height: 432, channels: 4, background: { r: 30, g: 64, b: 175, alpha: 1 } } })
    .png()
    .toFile(resolve(outDir, 'android-bg.png'));
  console.log('  ✓ android-bg.png (adaptive icon background)');

  // Splash screen
  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 30, g: 64, b: 175, alpha: 1 } })
    .png()
    .toFile(resolve(outDir, 'splash.png'));
  console.log('  ✓ splash.png');

  console.log('\nAll icons generated!');
}

generate().catch(e => { console.error(e); process.exit(1); });

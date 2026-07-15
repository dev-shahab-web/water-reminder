import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const pngSignature = '89504e470d0a1a0a';

const requiredAssets = [
  {
    height: undefined,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/source/master-logo.svg',
    type: 'svg',
    width: undefined,
  },
  {
    height: 1024,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/icon.png',
    requiresAlpha: true,
    type: 'png',
    width: 1024,
  },
  {
    height: 432,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/adaptive-icon-foreground.png',
    requiresAlpha: true,
    type: 'png',
    width: 432,
  },
  {
    height: 432,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/adaptive-icon-background.png',
    type: 'png',
    width: 432,
  },
  {
    height: 432,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/monochrome-icon.png',
    requiresAlpha: true,
    type: 'png',
    width: 432,
  },
  {
    height: 96,
    maxBytes: 100 * 1024,
    path: 'assets/branding/app/notification-icon.png',
    requiresAlpha: true,
    type: 'png',
    width: 96,
  },
  {
    height: 2048,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/splash-icon.png',
    requiresAlpha: true,
    type: 'png',
    width: 2048,
  },
  {
    height: 512,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/app/widget-icon.png',
    requiresAlpha: true,
    type: 'png',
    width: 512,
  },
  {
    height: 64,
    maxBytes: 100 * 1024,
    path: 'assets/branding/app/favicon.png',
    type: 'png',
    width: 64,
  },
  {
    height: 512,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/store/play-store-icon.png',
    type: 'png',
    width: 512,
  },
  {
    height: 500,
    maxBytes: 1024 * 1024,
    path: 'assets/branding/store/feature-graphic.png',
    type: 'png',
    width: 1024,
  },
  {
    height: 640,
    maxBytes: 2 * 1024 * 1024,
    path: 'assets/branding/github/github-banner.png',
    type: 'png',
    width: 1280,
  },
  {
    height: 512,
    maxBytes: 1024 * 1024,
    path: 'plugins/water-reminder-widget/android/res/drawable/water_reminder_widget_mark.png',
    requiresAlpha: true,
    type: 'png',
    width: 512,
  },
];

const readPngDimensions = (assetPath) => {
  const buffer = fs.readFileSync(assetPath);

  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error(`${assetPath} is not a PNG file.`);
  }

  return {
    colorType: buffer.readUInt8(25),
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
};

const validateAsset = (asset) => {
  const absolutePath = path.join(root, asset.path);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required brand asset: ${asset.path}`);
  }

  const extension = path.extname(asset.path).toLowerCase();

  if (asset.type === 'png' && extension !== '.png') {
    throw new Error(`${asset.path} must be a PNG file.`);
  }

  if (asset.type === 'svg' && extension !== '.svg') {
    throw new Error(`${asset.path} must be an SVG file.`);
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    throw new Error(`${asset.path} must not be a JPG/JPEG file.`);
  }

  const size = fs.statSync(absolutePath).size;

  if (size > asset.maxBytes) {
    throw new Error(`${asset.path} is larger than the configured limit.`);
  }

  if (asset.type === 'png') {
    const dimensions = readPngDimensions(absolutePath);

    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      throw new Error(
        `${asset.path} must be ${asset.width}x${asset.height}, got ${dimensions.width}x${dimensions.height}.`,
      );
    }

    if (asset.requiresAlpha === true && ![4, 6].includes(dimensions.colorType)) {
      throw new Error(`${asset.path} must include an alpha channel for transparency.`);
    }
  }
};

for (const asset of requiredAssets) {
  validateAsset(asset);
}

console.log(`Validated ${requiredAssets.length} brand assets.`);

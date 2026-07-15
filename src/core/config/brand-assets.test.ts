import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

import appConfig from '../../../app.json';

const projectRoot = path.resolve(__dirname, '../../..');

const expectedRuntimeAssetPaths = [
  './assets/branding/app/icon.png',
  './assets/branding/app/adaptive-icon-foreground.png',
  './assets/branding/app/adaptive-icon-background.png',
  './assets/branding/app/monochrome-icon.png',
  './assets/branding/app/notification-icon.png',
  './assets/branding/app/splash-icon.png',
  './assets/branding/app/favicon.png',
] as const;

describe('brand asset configuration', () => {
  it('uses final source-controlled brand assets in Expo config', () => {
    const expoConfig = appConfig.expo;

    expect(expoConfig.icon).toBe('./assets/branding/app/icon.png');
    expect(expoConfig.ios.icon).toBe('./assets/branding/app/icon.png');
    expect(expoConfig.android.adaptiveIcon.foregroundImage).toBe(
      './assets/branding/app/adaptive-icon-foreground.png',
    );
    expect(expoConfig.android.adaptiveIcon.backgroundImage).toBe(
      './assets/branding/app/adaptive-icon-background.png',
    );
    expect(expoConfig.android.adaptiveIcon.monochromeImage).toBe(
      './assets/branding/app/monochrome-icon.png',
    );
    expect(expoConfig.notification.icon).toBe('./assets/branding/app/notification-icon.png');
    expect(expoConfig.notification.color).toBe('#007A8A');
    expect(expoConfig.web.favicon).toBe('./assets/branding/app/favicon.png');

    const splashPlugin = expoConfig.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    ) as ['expo-splash-screen', { image: string }] | undefined;

    expect(splashPlugin?.[1].image).toBe('./assets/branding/app/splash-icon.png');
  });

  it('keeps configured runtime brand assets present', () => {
    for (const assetPath of expectedRuntimeAssetPaths) {
      expect(fs.existsSync(path.join(projectRoot, assetPath))).toBe(true);
    }
  });

  it('does not reference Expo default assets in app config or README', () => {
    const appJson = fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8');
    const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');

    expect(appJson).not.toContain('assets/images/icon.png');
    expect(appJson).not.toContain('expo-logo');
    expect(readme).not.toContain('RN Enterprise Starter');
  });
});

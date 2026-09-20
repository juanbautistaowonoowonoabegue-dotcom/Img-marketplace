export const APP_VERSION = '0.1.0';
export const APP_NAME = 'Compra Ya Core';
export const APP_CHANNELS = {
  web: 'web',
  android: 'android',
  ios: 'ios',
  pwa: 'pwa'
} as const;

export type AppChannel = (typeof APP_CHANNELS)[keyof typeof APP_CHANNELS];

export const APP_MODE = {
  development: 'development',
  staging: 'staging',
  production: 'production'
} as const;

export type AppMode = (typeof APP_MODE)[keyof typeof APP_MODE];

export type PlatformConfig = {
  channel: AppChannel;
  mode: AppMode;
  apiBaseUrl: string;
  appId: string;
  bundleId?: string;
};

export const platformConfig: Record<AppChannel, PlatformConfig> = {
  web: {
    channel: APP_CHANNELS.web,
    mode: APP_MODE.development,
    apiBaseUrl: process.env.WEB_API_BASE_URL ?? 'http://localhost:4000',
    appId: process.env.WEB_APP_ID ?? 'compra-ya-web'
  },
  android: {
    channel: APP_CHANNELS.android,
    mode: APP_MODE.development,
    apiBaseUrl: process.env.ANDROID_API_BASE_URL ?? 'https://api.compra-ya.local',
    appId: process.env.ANDROID_APP_ID ?? 'com.compra.ya.android'
  },
  ios: {
    channel: APP_CHANNELS.ios,
    mode: APP_MODE.development,
    apiBaseUrl: process.env.IOS_API_BASE_URL ?? 'https://api.compra-ya.local',
    appId: process.env.IOS_APP_ID ?? 'com.compra.ya.ios',
    bundleId: process.env.IOS_BUNDLE_ID ?? 'com.compra.ya.ios'
  },
  pwa: {
    channel: APP_CHANNELS.pwa,
    mode: APP_MODE.development,
    apiBaseUrl: process.env.PWA_API_BASE_URL ?? 'http://localhost:4000',
    appId: process.env.PWA_APP_ID ?? 'compra-ya-pwa'
  }
};

export function getPlatform(channel: AppChannel): PlatformConfig {
  return platformConfig[channel];
}

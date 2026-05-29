// Cross-platform detection for Android, iOS, and HarmonyOS
// Also detects wearable device types for notification optimization

export type MobileOS = 'android' | 'ios' | 'harmonyos' | 'unknown';
export type WearableType = 'wearos' | 'apple_watch' | 'galaxy_watch' | 'huawei_watch' | 'xiaomi_band' | 'other_wearable' | 'none';
export type BrowserEngine = 'chromium' | 'webkit' | 'arkweb' | 'other';

interface PlatformInfo {
  os: MobileOS;
  osVersion: string;
  browser: BrowserEngine;
  browserName: string;
  isPWA: boolean;
  isStandalone: boolean;
  hasNotification: boolean;
  hasVibration: boolean;
  hasBluetooth: boolean;
  hasWebShare: boolean;
  hasCamera: boolean;
  likelyWearable: WearableType;
  safeAreaNeeded: boolean;
  needsNotificationChannel: boolean;
}

// Cache platform info after first call
let cachedInfo: PlatformInfo | null = null;

export function getPlatformInfo(): PlatformInfo {
  if (cachedInfo) return cachedInfo;

  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';

  // Detect OS
  let os: MobileOS = 'unknown';
  let osVersion = '';

  if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'ios';
    const match = ua.match(/OS (\d+)_(\d+)/);
    osVersion = match ? `${match[1]}.${match[2]}` : '';
  } else if (/HarmonyOS|OpenHarmony|ArkWeb/i.test(ua)) {
    os = 'harmonyos';
    const match = ua.match(/HarmonyOS[\/\s](\d+\.?\d*)/i) || ua.match(/OpenHarmony[\/\s](\d+\.?\d*)/i);
    osVersion = match ? match[1] : '';
  } else if (/Android/i.test(ua)) {
    os = 'android';
    const match = ua.match(/Android\s+(\d+\.?\d*)/i);
    osVersion = match ? match[1] : '';
  }

  // Detect browser engine
  let browser: BrowserEngine = 'other';
  let browserName = 'Unknown';

  if (/ArkWeb/i.test(ua)) {
    browser = 'arkweb';
    browserName = 'ArkWeb (HarmonyOS)';
  } else if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
    browser = 'chromium';
    browserName = /Edge/i.test(ua) ? 'Edge' : /SamsungBrowser/i.test(ua) ? 'Samsung Internet' : 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'webkit';
    browserName = 'Safari';
  }

  // PWA detection
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
  const isPWA = isStandalone || window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches;

  // Feature detection
  const hasNotification = 'Notification' in window;
  const hasVibration = 'vibrate' in navigator;
  const hasBluetooth = 'bluetooth' in navigator;
  const hasWebShare = 'share' in navigator;
  const hasCamera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  // Wearable detection (heuristic based on OS + vendor)
  let likelyWearable: WearableType = 'none';
  if (os === 'android') {
    if (/SM-|Galaxy|Samsung/i.test(ua)) {
      likelyWearable = 'galaxy_watch';
    } else if (/HarmonyOS|HUAWEI|Honor/i.test(ua)) {
      likelyWearable = 'huawei_watch';
    } else if (/MI|Redmi|Xiaomi/i.test(ua)) {
      likelyWearable = 'xiaomi_band';
    } else {
      likelyWearable = 'wearos';
    }
  } else if (os === 'ios') {
    likelyWearable = 'apple_watch';
  } else if (os === 'harmonyos') {
    likelyWearable = 'huawei_watch';
  }

  const safeAreaNeeded = os === 'ios' || (os === 'android' && parseInt(osVersion) >= 10);
  // Android 8.0+ needs notification channels
  const needsNotificationChannel = os === 'android' && parseInt(osVersion) >= 8;

  cachedInfo = {
    os,
    osVersion,
    browser,
    browserName,
    isPWA,
    isStandalone,
    hasNotification,
    hasVibration,
    hasBluetooth,
    hasWebShare,
    hasCamera,
    likelyWearable,
    safeAreaNeeded,
    needsNotificationChannel,
  };

  return cachedInfo;
}

// Reset cache (e.g. on app resume from background)
export function resetPlatformCache(): void {
  cachedInfo = null;
}

// Get human-readable platform description
export function getPlatformDescription(): string {
  const info = getPlatformInfo();
  const osNames: Record<MobileOS, string> = {
    android: 'Android',
    ios: 'iOS',
    harmonyos: 'HarmonyOS',
    unknown: '未知系统',
  };
  const wearableNames: Record<WearableType, string> = {
    wearos: 'WearOS 手表',
    apple_watch: 'Apple Watch',
    galaxy_watch: 'Galaxy Watch',
    huawei_watch: '华为手表',
    xiaomi_band: '小米手环/手表',
    other_wearable: '其他穿戴设备',
    none: '未检测到穿戴设备',
  };
  return `${osNames[info.os]} ${info.osVersion} · ${info.browserName} · ${wearableNames[info.likelyWearable]}`;
}

// Check if wearable notifications will work on this platform
export function canSendWearableNotifications(): boolean {
  const info = getPlatformInfo();
  // All three platforms support notification mirroring to wearables
  return info.hasNotification;
}

// Get platform-specific install instructions
export function getPWAInstallInstructions(): string {
  const info = getPlatformInfo();
  switch (info.os) {
    case 'ios':
      return '点击底部分享按钮 → 选择"添加到主屏幕"';
    case 'android':
      return '点击右上角菜单 → 选择"安装应用"或"添加到主屏幕"';
    case 'harmonyos':
      return '点击底部工具栏 → 选择"添加到桌面"';
    default:
      return '在浏览器菜单中找到"添加到主屏幕"选项';
  }
}

// Watch for platform state changes (e.g. PWA install, bluetooth connect)
export function onPlatformChange(callback: () => void): () => void {
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const handler = () => {
    resetPlatformCache();
    callback();
  };
  mediaQuery.addEventListener('change', handler);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    mediaQuery.removeEventListener('change', handler);
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}

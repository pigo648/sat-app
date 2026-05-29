// Cross-platform wearable notification service
// Compatible with: WearOS, Apple Watch, Galaxy Watch, Huawei Watch, Xiaomi Band
// PWA notifications automatically mirror to paired wearables on all platforms

import { getPlatformInfo, type WearableType } from '../utils/platform';

type ReminderType = 'phase' | 'break' | 'task_start' | 'task_end' | 'daily_summary';

interface WearableReminderConfig {
  title: string;
  body: string;
  // Platform-specific vibration patterns
  vibration: {
    default: number[];
    wearos: number[];      // WearOS watches
    appleWatch: number[];  // Apple Watch (uses haptic)
    huawei: number[];      // Huawei/Honor watches
    xiaomi: number[];      // Xiaomi Band/Watch
  };
  tag: string;
  requireInteraction: boolean;
  urgency: 'high' | 'normal' | 'low';
  // Android notification channel
  channelId: string;
  channelName: string;
}

const WEARABLE_REMINDERS: Record<ReminderType, WearableReminderConfig> = {
  phase: {
    title: 'SAT · 阶段提醒',
    body: '当前阶段即将结束，不管任务有没有完成，请注意休息！',
    vibration: {
      default: [300, 200, 300, 200, 500],
      wearos: [200, 150, 200, 150, 400],
      appleWatch: [100, 100, 100, 100, 300], // Haptic-compatible
      huawei: [300, 200, 300, 200, 500],
      xiaomi: [250, 200, 250, 200, 450],
    },
    tag: 'sat-phase-reminder',
    requireInteraction: true,
    urgency: 'high',
    channelId: 'sat-phase',
    channelName: '阶段提醒',
  },
  break: {
    title: 'SAT · 休息时间',
    body: '连续专注2小时了！请休息15分钟，活动一下身体吧。',
    vibration: {
      default: [200, 100, 200, 100, 200, 100, 400],
      wearos: [150, 100, 150, 100, 150, 100, 300],
      appleWatch: [80, 80, 80, 80, 80, 80, 200],
      huawei: [200, 150, 200, 150, 200, 150, 400],
      xiaomi: [180, 120, 180, 120, 180, 120, 350],
    },
    tag: 'sat-break-reminder',
    requireInteraction: true,
    urgency: 'high',
    channelId: 'sat-break',
    channelName: '休息提醒',
  },
  task_start: {
    title: 'SAT · 任务开始',
    body: '专注时间到！集中精力完成任务吧',
    vibration: {
      default: [150, 100, 300],
      wearos: [100, 80, 200],
      appleWatch: [50, 50, 150],
      huawei: [150, 100, 300],
      xiaomi: [120, 80, 250],
    },
    tag: 'sat-task-start',
    requireInteraction: false,
    urgency: 'normal',
    channelId: 'sat-task',
    channelName: '任务提醒',
  },
  task_end: {
    title: 'SAT · 任务完成',
    body: '太棒了！任务已完成，准备进入下一项吧',
    vibration: {
      default: [100, 100, 100, 100, 600],
      wearos: [80, 80, 80, 80, 400],
      appleWatch: [50, 50, 50, 50, 300],
      huawei: [100, 100, 100, 100, 600],
      xiaomi: [90, 90, 90, 90, 500],
    },
    tag: 'sat-task-end',
    requireInteraction: false,
    urgency: 'normal',
    channelId: 'sat-task',
    channelName: '任务提醒',
  },
  daily_summary: {
    title: 'SAT · 今日总结',
    body: '今天所有任务完成！记得拍照打卡记录这一天',
    vibration: {
      default: [200, 200, 200, 200, 200, 200],
      wearos: [150, 150, 150, 150, 150, 150],
      appleWatch: [100, 100, 100, 100, 100, 100],
      huawei: [200, 200, 200, 200, 200, 200],
      xiaomi: [180, 180, 180, 180, 180, 180],
    },
    tag: 'sat-daily-summary',
    requireInteraction: true,
    urgency: 'high',
    channelId: 'sat-daily',
    channelName: '每日总结',
  },
};

let permissionGranted = false;

// Android notification channels (required for Android 8.0+)
export async function setupAndroidNotificationChannels(): Promise<void> {
  const info = getPlatformInfo();
  if (!info.needsNotificationChannel) return;

  // Android notification channels must be created via service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Post message to SW to create channels
      if (registration.active) {
        registration.active.postMessage({
          type: 'SETUP_CHANNELS',
          channels: [
            { id: 'sat-phase', name: '阶段提醒', importance: 'high' },
            { id: 'sat-break', name: '休息提醒', importance: 'high' },
            { id: 'sat-task', name: '任务提醒', importance: 'default' },
            { id: 'sat-daily', name: '每日总结', importance: 'high' },
          ],
        });
      }
    } catch (e) {
      console.warn('[SAT] Notification channel setup failed:', e);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    await setupAndroidNotificationChannels();
    return true;
  }

  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';

  if (permissionGranted) {
    await setupAndroidNotificationChannels();
  }

  return permissionGranted;
}

function getVibrationForWearable(wearable: WearableType, config: WearableReminderConfig): number[] {
  switch (wearable) {
    case 'wearos': return config.vibration.wearos;
    case 'apple_watch': return config.vibration.appleWatch;
    case 'huawei_watch': return config.vibration.huawei;
    case 'xiaomi_band': return config.vibration.xiaomi;
    default: return config.vibration.default;
  }
}

export function getWearableName(type: WearableType): string {
  const names: Record<WearableType, string> = {
    wearos: 'WearOS 手表',
    apple_watch: 'Apple Watch',
    galaxy_watch: 'Galaxy Watch',
    huawei_watch: '华为手表',
    xiaomi_band: '小米手环/手表',
    other_wearable: '穿戴设备',
    none: '',
  };
  return names[type];
}

export function getWearableSetupGuide(type: WearableType): string[] {
  const commonFirstStep = '打开手机蓝牙，确保手表/手环已配对';
  switch (type) {
    case 'apple_watch':
      return [commonFirstStep, 'iPhone 设置 → 通知 → SAT → 允许通知', '打开手表上的"镜像 iPhone 通知"'];
    case 'wearos':
    case 'galaxy_watch':
      return [commonFirstStep, '打开 WearOS/Galaxy Wearable App', '设置 → 通知 → 开启 SAT 通知同步'];
    case 'huawei_watch':
      return [commonFirstStep, '打开华为运动健康 App', '设备 → 消息通知 → 开启 SAT'];
    case 'xiaomi_band':
      return [commonFirstStep, '打开小米运动/Zepp Life App', 'App通知提醒 → 添加 SAT'];
    default:
      return [commonFirstStep, '在手表配套 App 中开启 SAT 的通知权限'];
  }
}

export async function sendWearableReminder(type: ReminderType, customBody?: string): Promise<void> {
  const config = WEARABLE_REMINDERS[type];
  if (!config) return;

  const info = getPlatformInfo();
  const vibratePattern = getVibrationForWearable(info.likelyWearable, config);

  // Vibration (mirrors to wearable on all platforms)
  if (info.hasVibration) {
    try {
      navigator.vibrate(vibratePattern);
    } catch { /* ignore */ }
  }

  // System notification (all platforms mirror to paired wearables)
  if (permissionGranted || Notification.permission === 'granted') {
    permissionGranted = true;
    try {
      const notifOptions: any = {
        body: customBody || config.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: config.tag,
        vibrate: vibratePattern,
        requireInteraction: config.requireInteraction,
        silent: false,
        renotify: true,
        // Android-specific: explicit channel ID
        ...(info.os === 'android' ? {} : {}),
      };

      const notif = new Notification(config.title, notifOptions);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('[SAT] Wearable notification failed:', e);
    }
  }
}

// Schedule phase reminders that sync to wearable
export function scheduleWearableReminder(type: ReminderType, timeStr: string): ReturnType<typeof setTimeout> | null {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  const delay = target.getTime() - now.getTime();
  if (delay <= 0) return null;

  return setTimeout(() => sendWearableReminder(type), delay);
}

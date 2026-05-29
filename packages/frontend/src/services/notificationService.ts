// Notification + Vibration service for SAT
// Smart wearables (Apple Watch, WearOS, Galaxy Watch, etc.) automatically
// mirror phone notifications, so no special hardware API is needed.

type ReminderType = 'phase' | 'break' | 'task_start' | 'task_end' | 'daily_summary';

interface NotificationActionItem {
  action: string;
  title: string;
}

interface ReminderConfig {
  title: string;
  body: string;
  vibratePattern: number[];
  tag: string;
  requireInteraction?: boolean;
  actions?: NotificationActionItem[];
}

const REMINDER_CONFIGS: Record<ReminderType, ReminderConfig> = {
  phase: {
    title: 'SAT · 阶段提醒',
    body: '当前阶段即将结束，不管任务有没有完成，请注意休息！',
    vibratePattern: [300, 200, 300, 200, 500],
    tag: 'sat-phase-reminder',
    requireInteraction: true,
    actions: [
      { action: 'ok', title: '知道了' },
      { action: 'snooze', title: '10分钟后提醒' },
    ],
  },
  break: {
    title: 'SAT · 休息提醒',
    body: '你已经连续专注2小时了，请休息15分钟！站起来活动一下吧。',
    vibratePattern: [200, 100, 200, 100, 200, 100, 400],
    tag: 'sat-break-reminder',
    requireInteraction: true,
    actions: [
      { action: 'break', title: '开始休息' },
      { action: 'snooze', title: '再等5分钟' },
    ],
  },
  task_start: {
    title: 'SAT · 任务开始',
    body: '专注时间到！集中精力，开始你的任务吧',
    vibratePattern: [150, 100, 300],
    tag: 'sat-task-start',
  },
  task_end: {
    title: 'SAT · 任务完成',
    body: '太棒了！任务已完成，休息一下，准备下一项任务吧。',
    vibratePattern: [100, 100, 100, 100, 600],
    tag: 'sat-task-end',
  },
  daily_summary: {
    title: 'SAT · 今日总结',
    body: '今天的任务全部完成！记得拍照打卡哦',
    vibratePattern: [200, 200, 200, 200, 200, 200],
    tag: 'sat-daily-summary',
    requireInteraction: true,
  },
};

let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[SAT] Notification API not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';
  return permissionGranted;
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

export function isWearableLikelyConnected(): boolean {
  return isNotificationSupported() && isVibrationSupported();
}

export async function sendReminder(type: ReminderType, customBody?: string): Promise<void> {
  const config = REMINDER_CONFIGS[type];
  if (!config) return;

  // Send vibration (mirrors to wearable devices)
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(config.vibratePattern);
    } catch {
      // Vibration not available, silently ignore
    }
  }

  // Send notification (automatically appears on paired smartwatches)
  if (permissionGranted || Notification.permission === 'granted') {
    permissionGranted = true;
    try {
      const notif = new Notification(config.title, {
        body: customBody || config.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: config.tag,
        // vibrate is a valid Notification option per spec, but TS types lag
        ...({ vibrate: config.vibratePattern } as object),
        requireInteraction: config.requireInteraction ?? false,
        silent: false,
        renotify: true,
      } as NotificationOptions);

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('[SAT] Notification failed:', e);
    }
  }
}

// Service Worker registration for background notifications
export async function registerServiceWorkerForNotifications(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.ready;
    console.log('[SAT] Service Worker ready for notifications');
  } catch (e) {
    console.warn('[SAT] Service Worker registration issue:', e);
  }
}

// Schedule a reminder at specific time
export function scheduleReminder(type: ReminderType, timeStr: string): ReturnType<typeof setTimeout> | null {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  const delay = target.getTime() - now.getTime();
  if (delay <= 0) return null;

  return setTimeout(() => {
    sendReminder(type);
  }, delay);
}

export const PHASE_TIMES = {
  morning: { start: '06:00', end: '12:00', reminder: '12:10' },
  afternoon: { start: '12:00', end: '17:30', reminder: '17:30' },
  evening: { start: '17:30', end: '23:59', reminder: '22:30' },
} as const;

export const MAX_TASK_DURATION_MINUTES = 120;
export const BREAK_DURATION_MINUTES = 15;
export const MAX_TASKS_PER_DAY = 20;
export const QUOTE_DISPLAY_DURATION_MS = 5000;
export const PHOTO_HISTORY_DAYS = 30;

export const PRIORITY_LABELS: Record<string, string> = {
  high: '高优先',
  medium: '中优先',
  low: '低优先',
};

export const PHASE_LABELS: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  skipped: '已跳过',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#3B82F6',
};

export const SHARE_PLATFORMS = [
  { id: 'wechat', name: '微信', color: '#07C160' },
  { id: 'weibo', name: '微博', color: '#E6162D' },
  { id: 'xiaohongshu', name: '小红书', color: '#FE2C55' },
  { id: 'douyin', name: '抖音', color: '#000000' },
  { id: 'kuaishou', name: '快手', color: '#FF4906' },
] as const;

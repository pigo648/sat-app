import { create } from 'zustand';
import type { AppSettings, Toast, Quote } from '../types/task';
import { db } from '../db/database';
import { getTodayDate, getCurrentPhase, generateId } from '../utils/time';
import type { Phase } from '../types/task';

const BUILTIN_QUOTES: Quote[] = [
  { text: '成功不是最终的，失败不是致命的：继续前进的勇气才是最重要的。', author: '丘吉尔' },
  { text: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
  { text: '今天所做之事勿候明天，自己所做之事勿候他人。', author: '歌德' },
  { text: '不要等待机会，而要创造机会。', author: '培根' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '成功是由日复一日的微小努力积累而成的。', author: '罗伯特·科利尔' },
  { text: '你的时间有限，不要浪费在模仿别人的生活上。', author: '乔布斯' },
  { text: '志当存高远。', author: '诸葛亮' },
  { text: '一分耕耘，一分收获。', author: '谚语' },
  { text: '合理安排时间，就等于节约时间。', author: '培根' },
  { text: '业精于勤，荒于嬉。', author: '韩愈' },
  { text: '自律是自由的第一步。', author: '亚里士多德' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { text: '人的差异在于业余时间。', author: '爱因斯坦' },
  { text: '天行健，君子以自强不息。', author: '周易' },
  { text: '自律给我自由。', author: '康德' },
  { text: '真正的高贵是优于过去的自己。', author: '海明威' },
  { text: '专注是效率的灵魂。', author: '佚名' },
  { text: '最好的时机是现在。', author: '佚名' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '行动是治愈恐惧的良药。', author: '戴尔·卡耐基' },
  { text: '少壮不努力，老大徒伤悲。', author: '汉乐府' },
  { text: '成大事不在于力量的大小，而在于能坚持多久。', author: '约翰逊' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '天才是百分之一的灵感加上百分之九十九的汗水。', author: '爱迪生' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '非洲谚语' },
  { text: '当你觉得为时已晚的时候，恰恰是最早的时候。', author: '哈佛校训' },
  { text: '只有极其努力，才能看起来毫不费力。', author: '刘同' },
  { text: '人生在勤，不索何获。', author: '张衡' },
  { text: '时间是世界上一切成就的土壤。', author: '麦金西' },
  { text: '既然选择了远方，便只顾风雨兼程。', author: '汪国真' },
  { text: '明日复明日，明日何其多。', author: '钱鹤滩' },
  { text: '希望是附丽于存在的，有存在，便有希望。', author: '鲁迅' },
];

interface AppState {
  isOnline: boolean;
  settings: AppSettings | null;
  todayDate: string;
  currentPhase: Phase;
  toasts: Toast[];
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  refreshPhase: () => void;
}

const defaultSettings: AppSettings = {
  key: 'app_settings',
  defaultTimeRangeStart: '09:00',
  defaultTimeRangeEnd: '21:00',
  soundEnabled: true,
  phaseRemindersEnabled: true,
  breakRemindersEnabled: true,
  xiaoYunEnabled: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  isOnline: navigator.onLine,
  settings: null,
  todayDate: getTodayDate(),
  currentPhase: getCurrentPhase(),
  toasts: [],
  isLoading: true,

  loadSettings: async () => {
    let settings = await db.settings.get('app_settings');
    if (!settings) {
      settings = { ...defaultSettings };
      await db.settings.put(settings);
    }
    // Seed quotes on first load
    const quoteCount = await db.quotes.count();
    if (quoteCount === 0) {
      await db.quotes.bulkAdd(BUILTIN_QUOTES);
    }
    set({ settings, isLoading: false });
  },

  updateSettings: async (partial) => {
    const { settings } = get();
    if (!settings) return;
    const updated = { ...settings, ...partial };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  setOnlineStatus: (online) => set({ isOnline: online }),

  addToast: (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };
    set((s) => ({ toasts: [...s.toasts, newToast] }));
    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  refreshPhase: () => {
    set({ currentPhase: getCurrentPhase() });
  },
}));

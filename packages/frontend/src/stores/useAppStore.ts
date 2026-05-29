import { create } from 'zustand';
import type { AppSettings, Toast } from '../types/task';
import { db } from '../db/database';
import { getTodayDate, getCurrentPhase, generateId } from '../utils/time';
import type { Phase } from '../types/task';

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

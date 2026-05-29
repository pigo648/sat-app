import { create } from 'zustand';
import { db } from '../db/database';
import { useTaskStore } from './useTaskStore';
import { useAppStore } from './useAppStore';
import { MAX_TASK_DURATION_MINUTES, BREAK_DURATION_MINUTES } from '../utils/constants';

interface TimerState {
  activeTaskId: number | null;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  focusSessionId: number | null;
  totalFocusedTodaySeconds: number;
  continuousFocusSeconds: number;
  showBreakReminder: boolean;

  startTimer: (taskId: number, durationSeconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  completeTimer: () => Promise<void>;
  dismissBreakReminder: () => void;
  syncTotalFocused: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  activeTaskId: null,
  totalDurationSeconds: 0,
  remainingSeconds: 0,
  isRunning: false,
  isPaused: false,
  focusSessionId: null,
  totalFocusedTodaySeconds: 0,
  continuousFocusSeconds: 0,
  showBreakReminder: false,

  startTimer: (taskId, durationSeconds) => {
    const sessionId = Date.now();
    set({
      activeTaskId: taskId,
      totalDurationSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
      isPaused: false,
      focusSessionId: sessionId,
      showBreakReminder: false,
    });
  },

  pauseTimer: () => {
    set({ isRunning: false, isPaused: true });
  },

  resumeTimer: () => {
    set({ isRunning: true, isPaused: false });
  },

  resetTimer: () => {
    set({
      activeTaskId: null,
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      isRunning: false,
      isPaused: false,
      focusSessionId: null,
      showBreakReminder: false,
    });
  },

  tick: () => {
    const { isRunning, remainingSeconds, activeTaskId } = get();
    if (!isRunning || !activeTaskId) return;

    const newRemaining = remainingSeconds - 1;
    if (newRemaining <= 0) {
      set({ remainingSeconds: 0 });
      get().completeTimer();
      return;
    }
    set({ remainingSeconds: newRemaining });
  },

  completeTimer: async () => {
    const { activeTaskId, focusSessionId } = get();
    if (activeTaskId) {
      await useTaskStore.getState().toggleTaskStatus(activeTaskId);
    }
    if (focusSessionId) {
      const now = Date.now();
    }
    set({
      isRunning: false,
      isPaused: false,
      activeTaskId: null,
      focusSessionId: null,
    });

    // Check if quote should be shown
    const store = useAppStore.getState();
    store.addToast({
      type: 'success',
      message: '任务完成！太棒了！',
      duration: 2000,
    });
  },

  dismissBreakReminder: () => {
    set({ showBreakReminder: false });
  },

  syncTotalFocused: async () => {
    const sessions = await db.focusSessions.toArray();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter((s) => s.startTime >= todayStart.getTime() && s.completed);
    const total = todaySessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
    set({ totalFocusedTodaySeconds: total });
  },
}));

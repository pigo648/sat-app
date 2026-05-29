import { create } from 'zustand';
import type { ChatMessage, Plan } from '../types/task';
import { generateId } from '../utils/time';
import { useTaskStore } from './useTaskStore';
import { useAppStore } from './useAppStore';
import { generatePlan, generateAlternatives } from '../services/xiaoyunService';

interface PlanContext {
  tasks: string;
  timeRange: { start: string; end: string };
  constraints?: string;
}

interface XiaoYunState {
  messages: ChatMessage[];
  plans: Plan[];
  selectedPlan: Plan | null;
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;

  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string, context: PlanContext) => Promise<void>;
  requestAlternatives: (feedback: string) => Promise<void>;
  selectPlan: (plan: Plan) => void;
  applyPlan: (plan: Plan) => Promise<void>;
  clearConversation: () => void;
}

export const useXiaoYunStore = create<XiaoYunState>((set, get) => ({
  messages: [],
  plans: [],
  selectedPlan: null,
  conversationId: null,
  isLoading: false,
  error: null,
  isOpen: false,

  openChat: () => set({ isOpen: true, error: null }),
  closeChat: () => set({ isOpen: false }),

  sendMessage: async (text, context) => {
    const { messages, conversationId } = get();
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    set({ messages: [...messages, userMsg], isLoading: true, error: null, plans: [] });

    try {
      const data = await generatePlan(text, context.timeRange, context.constraints);

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'xiao_yun',
        text: data.plans?.[0]?.summary ?? '这是我根据你的需求制定的方案，来看看吧～',
        timestamp: Date.now(),
        plans: data.plans,
      };

      set({
        messages: [...get().messages, aiMsg],
        plans: data.plans ?? [],
        conversationId: data.conversationId ?? conversationId,
        isLoading: false,
      });
    } catch (e) {
      const errMsg = (e as Error).message;
      set({ error: errMsg, isLoading: false, plans: [] });
      useAppStore.getState().addToast({ type: 'error', message: '小云暂时无法连接，请稍后重试' });
    }
  },

  requestAlternatives: async (feedback) => {
    const { messages, conversationId } = get();

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: feedback,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMsg], isLoading: true, error: null, plans: [] });

    try {
      const data = await generateAlternatives(feedback, conversationId ?? undefined);

      if (!data.plans || data.plans.length === 0) {
        throw new Error('未能生成替代方案，请尝试重新描述你的需求');
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'xiao_yun',
        text: '收到你的反馈啦！我重新整理了以下方案，每个方案的侧重点都不同，看看有没有更合你心意的～',
        timestamp: Date.now(),
        plans: data.plans,
      };

      set({
        messages: [...get().messages, aiMsg],
        plans: data.plans,
        isLoading: false,
      });
    } catch (e) {
      const errMsg = (e as Error).message;
      set({ error: errMsg, isLoading: false, plans: [] });
      useAppStore.getState().addToast({ type: 'error', message: '获取替代方案失败，请稍后重试' });
    }
  },

  selectPlan: (plan) => set({ selectedPlan: plan }),

  applyPlan: async (plan) => {
    const taskStore = useTaskStore.getState();
    const store = useAppStore.getState();
    const todayPlan = taskStore.dailyPlan;

    if (!todayPlan?.id) {
      // Create a daily plan first if none exists
      await taskStore.createDailyPlan(
        { date: new Date().toISOString().split('T')[0], timeRangeStart: '09:00', timeRangeEnd: '21:00' },
        [],
      );
      await taskStore.loadTodayPlan();
      const newPlan = taskStore.dailyPlan;
      if (!newPlan?.id) {
        store.addToast({ type: 'error', message: '创建计划失败，请先手动创建今日计划' });
        return;
      }
    }

    const planId = taskStore.dailyPlan?.id;
    if (!planId) return;

    const now = Date.now();
    const { db } = await import('../db/database');
    await db.tasks.where('dailyPlanId').equals(planId).delete();

    const tasks = plan.tasks.map((pt, i) => ({
      dailyPlanId: planId,
      name: pt.name,
      startTime: pt.startTime,
      endTime: pt.endTime,
      durationMinutes: pt.durationMinutes,
      priority: pt.priority,
      phase: pt.phase,
      status: 'pending' as const,
      sortOrder: i,
      notes: '',
      createdAt: now,
      updatedAt: now,
    }));

    await db.tasks.bulkAdd(tasks);
    await taskStore.loadTodayPlan();
    set({ isOpen: false, selectedPlan: plan });
    store.addToast({ type: 'success', message: '小云已经把计划安排好啦！去首页看看吧～' });
  },

  clearConversation: () => {
    set({
      messages: [],
      plans: [],
      selectedPlan: null,
      conversationId: null,
      isLoading: false,
      error: null,
    });
  },
}));

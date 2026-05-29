import { create } from 'zustand';
import type { ChatMessage, Plan } from '../types/task';
import { generateId } from '../utils/time';
import { useTaskStore } from './useTaskStore';
import { useAppStore } from './useAppStore';

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
    const { messages } = get();
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    set({ messages: [...messages, userMsg], isLoading: true, error: null });

    try {
      const res = await fetch('/api/xiaoyun/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: text, timeRange: context.timeRange, constraints: context.constraints }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '请求失败');

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'xiao_yun',
        text: data.plans?.[0]?.summary ?? '这是为您生成的计划方案：',
        timestamp: Date.now(),
        plans: data.plans,
      };

      set({
        messages: [...get().messages, aiMsg],
        plans: data.plans ?? [],
        conversationId: data.conversationId ?? null,
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      useAppStore.getState().addToast({ type: 'error', message: '小云连接失败，请检查网络' });
    }
  },

  requestAlternatives: async (feedback) => {
    const { conversationId, plans } = get();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/xiaoyun/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          feedback,
          previousPlanId: plans[0]?.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '请求失败');

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'xiao_yun',
        text: '好的，我为您重新规划了以下替代方案：',
        timestamp: Date.now(),
        plans: data.plans,
      };

      set({
        messages: [...get().messages, aiMsg],
        plans: data.plans ?? [],
        isLoading: false,
      });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
      useAppStore.getState().addToast({ type: 'error', message: '获取替代方案失败' });
    }
  },

  selectPlan: (plan) => set({ selectedPlan: plan }),

  applyPlan: async (plan) => {
    const taskStore = useTaskStore.getState();
    const store = useAppStore.getState();
    const todayPlan = taskStore.dailyPlan;

    if (!todayPlan?.id) return;

    const now = Date.now();
    // Delete existing tasks for today
    await import('../db/database').then((m) =>
      m.db.tasks.where('dailyPlanId').equals(todayPlan.id!).delete()
    );

    const tasks = plan.tasks.map((pt, i) => ({
      dailyPlanId: todayPlan.id!,
      name: pt.name,
      startTime: pt.startTime,
      endTime: pt.endTime,
      durationMinutes: pt.durationMinutes,
      priority: pt.priority,
      phase: pt.phase,
      status: 'pending' as const,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    }));

    await import('../db/database').then((m) => m.db.tasks.bulkAdd(tasks));
    await taskStore.loadTodayPlan();
    set({ isOpen: false, selectedPlan: plan });
    store.addToast({ type: 'success', message: '小云的时间计划已应用！' });
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

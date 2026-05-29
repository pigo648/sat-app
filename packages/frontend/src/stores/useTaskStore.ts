import { create } from 'zustand';
import type { DailyPlan, Task, TaskStatus, TaskTemplate } from '../types/task';
import { db } from '../db/database';
import { getTodayDate, getPhaseFromTime, getDurationMinutes } from '../utils/time';
import { MAX_TASKS_PER_DAY } from '../utils/constants';

interface TaskState {
  dailyPlan: DailyPlan | null;
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  completedCount: number;
  totalCount: number;
  completionRate: number;
  currentTask: Task | null;
  nextTask: Task | null;

  loadTodayPlan: () => Promise<void>;
  createDailyPlan: (plan: Omit<DailyPlan, 'id' | 'createdAt' | 'updatedAt'>, tasks: Omit<Task, 'id' | 'dailyPlanId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateTask: (id: number, partial: Partial<Task>) => Promise<void>;
  reorderTasks: (orderedIds: number[]) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskStatus: (id: number) => Promise<void>;
  startTask: (id: number) => Promise<void>;
  skipTask: (id: number) => Promise<void>;
  loadFromTemplate: (template: TaskTemplate) => Promise<void>;
  clearTodayPlan: () => Promise<void>;
  recalculatePhases: () => void;
  _recomputeDerived: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  dailyPlan: null,
  tasks: [],
  isLoading: false,
  error: null,
  completedCount: 0,
  totalCount: 0,
  completionRate: 0,
  currentTask: null,
  nextTask: null,

  loadTodayPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const today = getTodayDate();
      const plan = await db.dailyPlans.where('date').equals(today).first();
      if (!plan) {
        set({ dailyPlan: null, tasks: [], isLoading: false });
        return;
      }
      const tasks = await db.tasks.where('dailyPlanId').equals(plan.id!).sortBy('sortOrder');
      get()._recomputeDerived(tasks);
      set({ dailyPlan: plan, tasks, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  createDailyPlan: async (plan, tasks) => {
    set({ isLoading: true, error: null });
    try {
      const now = Date.now();
      const planId = await db.dailyPlans.add({
        ...plan,
        createdAt: now,
        updatedAt: now,
      });
      const taskRecords = tasks.map((t, i) => ({
        ...t,
        dailyPlanId: planId as number,
        sortOrder: i,
        createdAt: now,
        updatedAt: now,
      }));
      await db.tasks.bulkAdd(taskRecords);
      await get().loadTodayPlan();
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  updateTask: async (id, partial) => {
    const now = Date.now();
    if (partial.startTime || partial.endTime) {
      const task = (await db.tasks.get(id))!;
      const start = partial.startTime ?? task.startTime;
      const end = partial.endTime ?? task.endTime;
      partial.durationMinutes = getDurationMinutes(start, end);
      partial.phase = getPhaseFromTime(start);
    }
    await db.tasks.update(id, { ...partial, updatedAt: now });
    await get().loadTodayPlan();
  },

  reorderTasks: async (orderedIds) => {
    const now = Date.now();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.tasks.update(orderedIds[i], { sortOrder: i, updatedAt: now });
    }
    await get().loadTodayPlan();
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    await get().loadTodayPlan();
  },

  toggleTaskStatus: async (id) => {
    const task = await db.tasks.get(id);
    if (!task) return;
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    const now = Date.now();
    await db.tasks.update(id, {
      status: newStatus,
      actualEndTime: newStatus === 'completed' ? new Date().toISOString() : undefined,
      updatedAt: now,
    });
    await get().loadTodayPlan();
  },

  startTask: async (id) => {
    const now = Date.now();
    const nowISO = new Date().toISOString();
    // Set any previously in_progress task back to pending
    const { tasks } = get();
    for (const t of tasks) {
      if (t.status === 'in_progress' && t.id !== id) {
        await db.tasks.update(t.id!, { status: 'pending', updatedAt: now });
      }
    }
    await db.tasks.update(id, {
      status: 'in_progress',
      actualStartTime: nowISO,
      updatedAt: now,
    });
    await get().loadTodayPlan();
  },

  skipTask: async (id) => {
    const now = Date.now();
    await db.tasks.update(id, { status: 'skipped', updatedAt: now });
    await get().loadTodayPlan();
  },

  loadFromTemplate: async (template) => {
    const { settings } = await import('./useAppStore').then((m) => m.useAppStore.getState());
    const startTime = settings?.defaultTimeRangeStart ?? '09:00';
    const endTime = settings?.defaultTimeRangeEnd ?? '21:00';
    const plan: Omit<DailyPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      date: getTodayDate(),
      timeRangeStart: template.timeRangeStart || startTime,
      timeRangeEnd: template.timeRangeEnd || endTime,
    };
    const tasks = template.tasks.map((t, i) => ({
      ...t,
      dailyPlanId: 0,
      status: 'pending' as const,
      sortOrder: i,
      createdAt: 0,
      updatedAt: 0,
    }));
    await get().createDailyPlan(plan, tasks);
  },

  clearTodayPlan: async () => {
    const { dailyPlan } = get();
    if (!dailyPlan?.id) return;
    await db.tasks.where('dailyPlanId').equals(dailyPlan.id).delete();
    await db.dailyPlans.delete(dailyPlan.id);
    set({ dailyPlan: null, tasks: [], completedCount: 0, totalCount: 0, completionRate: 0, currentTask: null, nextTask: null });
  },

  recalculatePhases: () => {
    const { tasks } = get();
    const updated = tasks.map((t) => ({ ...t, phase: getPhaseFromTime(t.startTime) }));
    get()._recomputeDerived(updated);
    set({ tasks: updated });
  },

  _recomputeDerived: (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const rate = total > 0 ? completed / total : 0;
    const currentTask = tasks.find((t) => t.status === 'in_progress') ?? null;
    const nextTask = tasks.find((t) => t.status === 'pending') ?? null;
    set({
      completedCount: completed,
      totalCount: total,
      completionRate: rate,
      currentTask,
      nextTask,
    });
  },
}));

import Dexie, { type Table } from 'dexie';
import type { DailyPlan, Task, TaskTemplate, Quote, PhotoCheckin, AppSettings, FocusSession } from '../types/task';

class SATDatabase extends Dexie {
  dailyPlans!: Table<DailyPlan, number>;
  tasks!: Table<Task, number>;
  taskTemplates!: Table<TaskTemplate, number>;
  quotes!: Table<Quote, number>;
  photoCheckins!: Table<PhotoCheckin, number>;
  settings!: Table<AppSettings, string>;
  focusSessions!: Table<FocusSession, number>;

  constructor() {
    super('SATDatabase');

    this.version(1).stores({
      dailyPlans: '++id, date',
      tasks: '++id, dailyPlanId, status, phase, priority, sortOrder',
      taskTemplates: '++id, name',
      quotes: '++id',
      photoCheckins: '++id, date',
      settings: 'key',
      focusSessions: '++id, taskId, startTime',
    });
  }
}

export const db = new SATDatabase();

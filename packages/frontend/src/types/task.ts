export type Priority = 'high' | 'medium' | 'low';
export type Phase = 'morning' | 'afternoon' | 'evening';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface DailyPlan {
  id?: number;
  date: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id?: number;
  dailyPlanId: number;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priority: Priority;
  phase: Phase;
  status: TaskStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  focusDurationSeconds?: number;
  sortOrder: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskTemplate {
  id?: number;
  name: string;
  description?: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  tasks: Omit<Task, 'id' | 'dailyPlanId' | 'status' | 'actualStartTime' | 'actualEndTime' | 'focusDurationSeconds' | 'createdAt' | 'updatedAt'>[];
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Quote {
  id?: number;
  text: string;
  author: string;
  category?: string;
}

export interface PhotoCheckin {
  id?: number;
  date: string;
  photoData: Blob;
  overlayText: string;
  generatedText: string;
  thumbnailData?: Blob;
  sharedTo?: string[];
  createdAt: number;
}

export interface DailyStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  completionRate: number;
  morningTasks: number;
  morningCompleted: number;
  afternoonTasks: number;
  afternoonCompleted: number;
  eveningTasks: number;
  eveningCompleted: number;
  totalFocusSeconds: number;
  avgFocusPerTaskSeconds: number;
}

export interface AppSettings {
  key: string;
  defaultTimeRangeStart: string;
  defaultTimeRangeEnd: string;
  soundEnabled: boolean;
  phaseRemindersEnabled: boolean;
  breakRemindersEnabled: boolean;
  xiaoYunEnabled: boolean;
  lastUsedTemplateId?: number;
}

export interface FocusSession {
  id?: number;
  taskId: number;
  startTime: number;
  endTime?: number;
  durationSeconds?: number;
  pausedDurationSeconds: number;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'xiao_yun';
  text: string;
  timestamp: number;
  plans?: Plan[];
}

export interface Plan {
  id: string;
  planName: string;
  tasks: PlanTask[];
  breaks: PlanBreak[];
  summary: string;
}

export interface PlanTask {
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  phase: Phase;
  priority: Priority;
}

export interface PlanBreak {
  startTime: string;
  endTime: string;
  label: string;
}

export interface AllTimeStats {
  totalDaysTracked: number;
  totalTasksCompleted: number;
  totalFocusHours: number;
  averageCompletionRate: number;
  streakDays: number;
  bestDay: { date: string; completionRate: number };
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

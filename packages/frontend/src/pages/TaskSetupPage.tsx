import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useTaskStore } from '../stores/useTaskStore';
import { useAppStore } from '../stores/useAppStore';
import TimeRangePicker from '../components/task/TimeRangePicker';
import TaskForm from '../components/task/TaskForm';
import { getPhaseFromTime, getDurationMinutes } from '../utils/time';
import { MAX_TASK_DURATION_MINUTES } from '../utils/constants';
import type { Task, Priority } from '../types/task';
import XiaoYunChat from '../components/xiaoyun/ChatWindow';
import XiaoYunAvatar from '../components/xiaoyun/XiaoYunAvatar';

export default function TaskSetupPage() {
  const navigate = useNavigate();
  const { dailyPlan, tasks, loadTodayPlan, createDailyPlan, updateTask, deleteTask, reorderTasks } = useTaskStore();
  const { settings } = useAppStore();
  const [startTime, setStartTime] = useState(settings?.defaultTimeRangeStart ?? '09:00');
  const [endTime, setEndTime] = useState(settings?.defaultTimeRangeEnd ?? '21:00');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showXiaoYun, setShowXiaoYun] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: '', startTime: '', endTime: '', priority: 'medium' as Priority, notes: '' });

  useEffect(() => {
    loadTodayPlan();
  }, [loadTodayPlan]);

  useEffect(() => {
    if (dailyPlan) {
      setStartTime(dailyPlan.timeRangeStart);
      setEndTime(dailyPlan.timeRangeEnd);
    }
  }, [dailyPlan]);

  const handleSavePlan = async () => {
    if (!dailyPlan) {
      // Create new
      await createDailyPlan(
        { date: new Date().toISOString().split('T')[0], timeRangeStart: startTime, timeRangeEnd: endTime },
        tasks.map((t) => ({
          name: t.name,
          startTime: t.startTime,
          endTime: t.endTime,
          durationMinutes: t.durationMinutes,
          priority: t.priority,
          phase: t.phase,
          status: t.status,
          sortOrder: t.sortOrder,
          notes: t.notes,
        }))
      );
    }
    navigate('/');
  };

  const handleAddTask = () => {
    if (!taskForm.name || !taskForm.startTime || !taskForm.endTime) return;
    const duration = getDurationMinutes(taskForm.startTime, taskForm.endTime);
    if (duration > MAX_TASK_DURATION_MINUTES) {
      alert(`每项任务不能超过${MAX_TASK_DURATION_MINUTES}分钟（2小时）`);
      return;
    }
    const phase = getPhaseFromTime(taskForm.startTime);
    const newTask: Task = {
      dailyPlanId: dailyPlan?.id ?? 0,
      name: taskForm.name,
      startTime: taskForm.startTime,
      endTime: taskForm.endTime,
      durationMinutes: duration,
      priority: taskForm.priority,
      phase,
      status: 'pending',
      sortOrder: tasks.length,
      notes: taskForm.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (dailyPlan) {
      // Add directly via update individually
      import('../db/database').then(({ db }) => {
        db.tasks.add(newTask).then(() => loadTodayPlan());
      });
    } else {
      // Add to local pending list
    }

    setTaskForm({ name: '', startTime: '', endTime: '', priority: 'medium', notes: '' });
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask(id);
  };

  return (
    <PageContainer>
      {/* Time Range */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">今日时间范围</h2>
        <TimeRangePicker start={startTime} end={endTime} onStartChange={setStartTime} onEndChange={setEndTime} />
      </div>

      {/* Task List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            任务列表 ({tasks.length})
          </h2>
          <Button variant="primary" size="sm" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
            + 添加任务
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            还没有添加任务，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">{task.name}</div>
                  <div className="text-xs text-gray-400">
                    {task.startTime}-{task.endTime} · {task.durationMinutes}min · {task.priority}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors"
                    onClick={() => { setEditingTask(task); setTaskForm({ name: task.name, startTime: task.startTime, endTime: task.endTime, priority: task.priority, notes: task.notes || '' }); setShowTaskForm(true); }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => task.id && handleDeleteTask(task.id)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button variant="primary" size="lg" className="w-full mb-2" onClick={handleSavePlan}>
        保存并返回
      </Button>

      {/* Xiao Yun FAB */}
      <div className="fixed bottom-24 right-4 z-30">
        <XiaoYunAvatar
          state="idle"
          size={56}
          onClick={() => setShowXiaoYun(true)}
          className="shadow-lg rounded-full"
        />
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowTaskForm(false)}>
          <div className="absolute inset-0 bottom-sheet-backdrop" />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">{editingTask ? '编辑任务' : '新建任务'}</h3>
            <TaskForm
              values={taskForm}
              onChange={setTaskForm}
              onSubmit={handleAddTask}
              onCancel={() => { setShowTaskForm(false); setEditingTask(null); }}
              rangeStart={startTime}
              rangeEnd={endTime}
            />
          </div>
        </div>
      )}

      {/* Xiao Yun Chat Modal */}
      {showXiaoYun && (
        <XiaoYunChat
          timeRange={{ start: startTime, end: endTime }}
          onClose={() => setShowXiaoYun(false)}
        />
      )}
    </PageContainer>
  );
}

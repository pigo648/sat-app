import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { db } from '../db/database';
import type { TaskTemplate, Priority } from '../types/task';
import { getPhaseFromTime, getDurationMinutes } from '../utils/time';
import { MAX_TASK_DURATION_MINUTES } from '../utils/constants';
import { useAppStore } from '../stores/useAppStore';

interface TemplateTask {
  name: string;
  startTime: string;
  endTime: string;
  priority: Priority;
}

export default function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const isEdit = !!templateId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('21:00');
  const [tasks, setTasksInner] = useState<TemplateTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState<TemplateTask>({ name: '', startTime: '', endTime: '', priority: 'medium' });

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    const tpl = await db.taskTemplates.get(Number(templateId));
    if (tpl) {
      setName(tpl.name);
      setDescription(tpl.description ?? '');
      setTimeStart(tpl.timeRangeStart);
      setTimeEnd(tpl.timeRangeEnd);
      setTasksInner(tpl.tasks.map((t: any) => ({
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        priority: t.priority,
      })));
    }
  };

  const handleAddTask = () => {
    if (!taskForm.name || !taskForm.startTime || !taskForm.endTime) return;
    const duration = getDurationMinutes(taskForm.startTime, taskForm.endTime);
    if (duration > MAX_TASK_DURATION_MINUTES) {
      alert('每项任务不能超过120分钟');
      return;
    }
    setTasksInner([...tasks, { ...taskForm }]);
    setTaskForm({ name: '', startTime: '', endTime: '', priority: 'medium' });
    setShowForm(false);
  };

  const handleRemoveTask = (index: number) => {
    setTasksInner(tasks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      addToast({ type: 'error', message: '请输入模板名称' });
      return;
    }

    const now = Date.now();
    const templateData = {
      name,
      description,
      timeRangeStart: timeStart,
      timeRangeEnd: timeEnd,
      tasks: tasks.map((t) => ({
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMinutes: getDurationMinutes(t.startTime, t.endTime),
        priority: t.priority,
        phase: getPhaseFromTime(t.startTime),
        sortOrder: 0,
      })),
      useCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (isEdit) {
      await db.taskTemplates.update(Number(templateId), templateData);
      addToast({ type: 'success', message: '模板已更新' });
    } else {
      await db.taskTemplates.add(templateData);
      addToast({ type: 'success', message: '模板已创建' });
    }
    navigate('/templates');
  };

  return (
    <PageContainer>
      <h2 className="text-base font-semibold text-gray-700 mb-4">{isEdit ? '编辑模板' : '新建模板'}</h2>

      {/* Template Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">模板名称</label>
          <input
            type="text"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
            placeholder="例如：工作日安排"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">描述（可选）</label>
          <input
            type="text"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
            placeholder="描述这个模板的用途"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">开始时间</label>
            <input
              type="time"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">结束时间</label>
            <input
              type="time"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">模板任务 ({tasks.length})</h3>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + 添加任务
          </Button>
        </div>
        {tasks.map((t, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm mb-2 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-gray-800">{t.name}</div>
              <div className="text-xs text-gray-400">{t.startTime}-{t.endTime} · {t.priority}</div>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500"
              onClick={() => handleRemoveTask(i)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <Button variant="primary" size="lg" className="w-full" onClick={handleSave}>
        {isEdit ? '更新模板' : '保存模板'}
      </Button>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bottom-sheet-backdrop" />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">添加模板任务</h3>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                placeholder="任务名称"
                value={taskForm.name}
                onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
              />
              <div className="flex gap-3">
                <input
                  type="time"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                  value={taskForm.startTime}
                  onChange={(e) => setTaskForm({ ...taskForm, startTime: e.target.value })}
                />
                <input
                  type="time"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                  value={taskForm.endTime}
                  onChange={(e) => setTaskForm({ ...taskForm, endTime: e.target.value })}
                />
              </div>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
              >
                <option value="high">高优先</option>
                <option value="medium">中优先</option>
                <option value="low">低优先</option>
              </select>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>取消</Button>
                <Button variant="primary" className="flex-1" onClick={handleAddTask}>添加</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

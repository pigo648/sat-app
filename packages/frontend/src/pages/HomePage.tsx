import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useTaskStore } from '../stores/useTaskStore';
import { useAppStore } from '../stores/useAppStore';
import { STATUS_LABELS, PRIORITY_COLORS, PHASE_LABELS } from '../utils/constants';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import QuoteCard from '../components/quote/QuoteCard';
import type { Task, Quote } from '../types/task';
import { db } from '../db/database';

export default function HomePage() {
  const navigate = useNavigate();
  const { dailyPlan, tasks, isLoading, loadTodayPlan, startTask, toggleTaskStatus, skipTask, totalCount, completedCount, completionRate } = useTaskStore();
  const { currentPhase, settings } = useAppStore();
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<number | null>(null);

  useEffect(() => {
    loadTodayPlan();
  }, [loadTodayPlan]);

  // Watch for newly completed tasks to show quote
  useEffect(() => {
    const lastCompleted = tasks.filter((t) => t.status === 'completed').pop();
    if (lastCompleted && lastCompleted.id !== lastCompletedId) {
      setLastCompletedId(lastCompleted.id ?? null);
      showRandomQuote();
    }
  }, [tasks]);

  const showRandomQuote = async () => {
    const quotes = await db.quotes.toArray();
    if (quotes.length > 0) {
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      setCurrentQuote(q);
      setShowQuote(true);
      setTimeout(() => setShowQuote(false), 5000);
    }
  };

  const getPhaseTaskInfo = () => {
    const phaseTasks = tasks.filter((t) => t.phase === currentPhase);
    const phaseCompleted = phaseTasks.filter((t) => t.status === 'completed').length;
    return { total: phaseTasks.length, completed: phaseCompleted };
  };

  const allTasksDone = totalCount > 0 && completedCount === totalCount;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!dailyPlan) {
    return (
      <PageContainer>
        <EmptyState
          icon="📅"
          message="今天还没有计划"
          description="设置你的每日时间表，让 SAT 帮你管理时间"
          action={{ label: '创建今日计划', onClick: () => navigate('/setup') }}
        />
      </PageContainer>
    );
  }

  const phaseInfo = getPhaseTaskInfo();

  return (
    <PageContainer>
      {/* Completion Ring */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#2563EB" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${completionRate * 213.6} 213.6`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary-700">{Math.round(completionRate * 100)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">今日进度</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-gray-800">{completedCount}</span>
              <span className="text-sm text-gray-400">/ {totalCount} 项完成</span>
            </div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                {PHASE_LABELS[currentPhase]}
              </span>
              <span className="text-xs text-gray-400">
                本阶段 {phaseInfo.completed}/{phaseInfo.total}
              </span>
            </div>
          </div>
        </div>
        {allTasksDone && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/photo')}
            >
              📸 拍照打卡
            </Button>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">任务列表</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/setup')}>
            编辑
          </Button>
        </div>

        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onStart={() => {
              startTask(task.id!);
              navigate(`/focus/${task.id}`);
            }}
            onToggle={() => toggleTaskStatus(task.id!)}
            onSkip={() => skipTask(task.id!)}
          />
        ))}
      </div>

      {/* Quote */}
      {showQuote && currentQuote && (
        <QuoteCard quote={currentQuote} />
      )}
    </PageContainer>
  );
}

function TaskRow({ task, onStart, onToggle, onSkip }: {
  task: Task;
  onStart: () => void;
  onToggle: () => void;
  onSkip: () => void;
}) {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isSkipped = task.status === 'skipped';

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-all ${
        isCompleted ? 'border-green-400 opacity-70' :
        isSkipped ? 'border-gray-300 opacity-50' :
        isInProgress ? 'border-primary-500 shadow-md' :
        'border-gray-200'
      }`}
      style={{
        borderLeftColor: isCompleted ? '#4ADE80' : isSkipped ? '#D1D5DB' : (PRIORITY_COLORS[task.priority] ?? '#D1D5DB'),
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {task.name}
            </h3>
            {isCompleted && <span className="text-green-500 text-xs">✓</span>}
            {isInProgress && <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-soft" />}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{task.startTime} - {task.endTime}</span>
            <span>·</span>
            <span>{task.durationMinutes}分钟</span>
            <span>·</span>
            <span>{STATUS_LABELS[task.status]}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {task.status === 'pending' && (
            <>
              <button
                className="min-touch flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                onClick={onStart}
                title="开始专注"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </>
          )}
          {task.status === 'in_progress' && (
            <>
              <button
                className="min-touch flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                onClick={onToggle}
                title="标记完成"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </>
          )}
          {task.status !== 'completed' && task.status !== 'skipped' && (
            <button
              className="min-touch flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-gray-400 hover:bg-gray-50 transition-colors"
              onClick={onSkip}
              title="跳过"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Plan } from '../../types/task';
import { PHASE_LABELS } from '../../utils/constants';
import Button from '../ui/Button';

interface Props {
  plans: Plan[];
  onSelect: (plan: Plan) => void;
  onReject: () => void;
  isLoading: boolean;
}

export default function PlanCarousel({ plans, onSelect, onReject, isLoading }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPlan = plans[currentIndex];

  // Reset index when plans change
  useEffect(() => {
    setCurrentIndex(0);
  }, [plans]);

  if (!plans.length) return null;

  if (!currentPlan) return null;

  const priorityColors: Record<string, string> = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#3B82F6',
  };

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Scheme selector tabs */}
      {plans.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {plans.map((plan, i) => (
            <button
              key={plan.id || i}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                i === currentIndex
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-200'
              }`}
              onClick={() => setCurrentIndex(i)}
            >
              {plan.planName || `方案 ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Plan Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {currentIndex === 0 ? '🏃' : currentIndex === 1 ? '⚖️' : '🎯'}
            </span>
            <div>
              <h4 className="font-semibold text-sm text-gray-800">
                {currentPlan.planName || `方案 ${currentIndex + 1}`}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{currentPlan.summary}</p>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="px-4 py-2 max-h-52 overflow-y-auto">
          {(!currentPlan.tasks || currentPlan.tasks.length === 0) ? (
            <p className="text-center text-sm text-gray-400 py-4">暂无任务数据</p>
          ) : (
            currentPlan.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: priorityColors[task.priority] || '#3B82F6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 truncate">{task.name}</div>
                  <div className="text-xs text-gray-400">
                    {task.startTime} - {task.endTime} · {task.durationMinutes}分钟
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  {PHASE_LABELS[task.phase] || ''}
                </span>
              </div>
            ))
          )}

          {/* Breaks */}
          {currentPlan.breaks && currentPlan.breaks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <span>☕</span> 休息时间
              </div>
              {currentPlan.breaks.map((b, i) => (
                <div key={i} className="text-xs text-green-600 pl-4 py-0.5">
                  {b.startTime}-{b.endTime} {b.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onReject}
            loading={isLoading}
          >
            不满意，换方案
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onSelect(currentPlan)}
          >
            就这个了！
          </Button>
        </div>
      </div>

      {/* Page indicator dots */}
      {plans.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plans.map((_, i) => (
            <button
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-primary-600 w-4' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

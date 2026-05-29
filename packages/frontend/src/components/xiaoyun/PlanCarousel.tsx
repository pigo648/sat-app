import { useState } from 'react';
import type { Plan } from '../../types/task';
import { PHASE_LABELS, PRIORITY_LABELS } from '../../utils/constants';
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

  if (!currentPlan) return null;

  return (
    <div className="space-y-3">
      {/* Scheme selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {plans.map((plan, i) => (
          <button
            key={plan.id}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              i === currentIndex
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
            onClick={() => setCurrentIndex(i)}
          >
            {plan.planName || `方案 ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Plan Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h4 className="font-semibold text-sm text-gray-800">{currentPlan.planName || '时间方案'}</h4>
          <p className="text-xs text-gray-400 mt-1">{currentPlan.summary}</p>
        </div>

        <div className="px-4 py-2 max-h-48 overflow-y-auto">
          {currentPlan.tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F59E0B' : '#3B82F6' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 truncate">{task.name}</div>
                <div className="text-xs text-gray-400">
                  {task.startTime}-{task.endTime} · {task.durationMinutes}min
                </div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{PHASE_LABELS[task.phase]}</span>
            </div>
          ))}

          {/* Breaks */}
          {currentPlan.breaks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400 mb-1">休息时间</div>
              {currentPlan.breaks.map((b, i) => (
                <div key={i} className="text-xs text-green-600 pl-3 py-0.5">
                  ☕ {b.startTime}-{b.endTime} {b.label}
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
            应用此方案
          </Button>
        </div>
      </div>

      {/* Page indicator */}
      {plans.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plans.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

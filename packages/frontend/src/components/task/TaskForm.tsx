import Button from '../ui/Button';
import type { Priority } from '../../types/task';

interface TaskFormValues {
  name: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  notes: string;
}

interface Props {
  values: TaskFormValues;
  onChange: (v: TaskFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  rangeStart?: string;
  rangeEnd?: string;
}

export default function TaskForm({ values, onChange, onSubmit, onCancel }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">任务名称</label>
        <input
          type="text"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none transition-colors"
          placeholder="例如：学习英语"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">开始时间</label>
          <input
            type="time"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
            value={values.startTime}
            onChange={(e) => onChange({ ...values, startTime: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">结束时间</label>
          <input
            type="time"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
            value={values.endTime}
            onChange={(e) => onChange({ ...values, endTime: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">优先级</label>
        <div className="flex gap-2">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                values.priority === p
                  ? p === 'high' ? 'bg-red-50 text-red-600 border border-red-200' :
                    p === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                    'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-gray-50 text-gray-400 border border-gray-100'
              }`}
              onClick={() => onChange({ ...values, priority: p })}
            >
              {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">备注（可选）</label>
        <input
          type="text"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none"
          placeholder="添加备注..."
          value={values.notes}
          onChange={(e) => onChange({ ...values, notes: e.target.value })}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSubmit}>
          确定
        </Button>
      </div>
    </div>
  );
}

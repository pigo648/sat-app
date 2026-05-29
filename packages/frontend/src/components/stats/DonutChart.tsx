interface Props {
  completed: number;
  total: number;
  skipped: number;
}

export default function DonutChart({ completed, total, skipped }: Props) {
  const pending = total - completed - skipped;
  const circumference = 2 * Math.PI * 40;

  const segments = [
    { value: completed, color: '#22C55E', label: '已完成' },
    { value: skipped, color: '#D1D5DB', label: '已跳过' },
    { value: pending, color: '#93C5FD', label: '待完成' },
  ].filter((s) => s.value > 0);

  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {segments.reduce((acc, seg, i) => {
            const dashArray = (seg.value / totalValue) * circumference;
            const dashOffset = segments.slice(0, i).reduce((s, prev) => s + (prev.value / totalValue) * circumference, 0);
            acc.push(
              <circle
                key={i}
                cx="50" cy="50" r="40"
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={-dashOffset}
                className="transition-all duration-500"
              />
            );
            return acc;
          }, [] as JSX.Element[])}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">{Math.round((completed / Math.max(total, 1)) * 100)}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            {seg.label} {seg.value}
          </div>
        ))}
      </div>
    </div>
  );
}

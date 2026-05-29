interface Props {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export default function TimeRangePicker({ start, end, onStartChange, onEndChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="text-xs text-gray-400 mb-1 block">开始时间</label>
        <input
          type="time"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none transition-colors"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </div>
      <div className="text-gray-400 pt-5">至</div>
      <div className="flex-1">
        <label className="text-xs text-gray-400 mb-1 block">结束时间</label>
        <input
          type="time"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-400 outline-none transition-colors"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </div>
    </div>
  );
}

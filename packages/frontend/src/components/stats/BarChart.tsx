interface Props {
  data: { label: string; value: number }[];
}

export default function BarChart({ data }: Props) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{d.value}%</span>
          <div className="w-full bg-primary-200 rounded-t-md transition-all duration-500" style={{
            height: `${(d.value / maxValue) * 100}%`,
            minHeight: '4px',
            backgroundColor: d.value >= 80 ? '#22C55E' : d.value >= 50 ? '#2563EB' : '#F59E0B',
          }} />
          <span className="text-[10px] text-gray-400 mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

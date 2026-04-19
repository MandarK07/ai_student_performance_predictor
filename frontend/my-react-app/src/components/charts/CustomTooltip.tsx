import type { TooltipContentProps } from "recharts";

type TooltipEntry = NonNullable<TooltipContentProps["payload"]>[number];
type CustomTooltipProps = Partial<TooltipContentProps>;

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // Determine the label text - Recharts sometimes passes weird label values for PieCharts
    const displayLabel = label || payload[0].payload?.name;

    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur peer z-50">
        {displayLabel && <p className="mb-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">{displayLabel}</p>}
        <div className="space-y-1.5 mt-1">
          {payload.map((entry: TooltipEntry, index: number) => (
            <div key={index} className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="block h-2.5 w-2.5 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color || entry.payload?.fill || "#cbd5e1" }} 
                />
                <span className="text-sm font-medium text-slate-600">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

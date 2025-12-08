// frontend/web/src/modules/shared/components/ui/KPIChip.tsx

interface KPIChipProps {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
}

export default function KPIChip({ label, value, tone = "default" }: KPIChipProps) {
  const base = "inline-flex flex-col rounded-xl px-3 py-2 text-xs";
  const toneClass =
    {
      default:
        "bg-slate-50 border border-slate-200 text-slate-900 dark:bg-slate-950/80 dark:border-slate-700 dark:text-slate-100",
      success:
        "bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/70 dark:border-emerald-600 dark:text-emerald-200",
      warning:
        "bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/70 dark:border-amber-600 dark:text-amber-200",
      danger:
        "bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/70 dark:border-rose-600 dark:text-rose-200",
    }[tone] || "";

  return (
    <div className={`${base} ${toneClass}`}>
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}


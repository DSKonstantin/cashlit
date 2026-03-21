import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import type { PeriodFilter } from "@/lib/types";

const periods: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "All" },
];

export default function PeriodSelector() {
  const { period, setPeriod } = useAppContext();

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/[0.03] p-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className="relative rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors"
        >
          {period === p.value && (
            <motion.div
              layoutId="period-active"
              className="absolute inset-0 rounded-md bg-white/[0.08] border border-white/[0.1]"
              transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            />
          )}
          <span
            className={`relative z-10 ${
              period === p.value ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {p.label}
          </span>
        </button>
      ))}
    </div>
  );
}

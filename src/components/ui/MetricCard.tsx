import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  trend,
  icon,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="glass glass-hover rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
            {label}
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold text-text-primary">
            {value}
          </p>
        </div>
        {icon && (
          <div className="rounded-lg bg-white/5 p-2 text-text-secondary">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend.isPositive ? (
            <TrendingUp size={12} className="text-accent-green" />
          ) : (
            <TrendingDown size={12} className="text-accent-red" />
          )}
          <span
            className={cn(
              "text-[11px] font-semibold",
              trend.isPositive ? "text-accent-green" : "text-accent-red",
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

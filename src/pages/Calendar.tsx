import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePayments } from "@/hooks/useAnalytics";
import { useProviders } from "@/hooks/useProviders";
import { formatMoney } from "@/lib/utils";
import type { Payment } from "@/lib/types";

interface CalendarProps {
  onDayClick: (date: Date) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

function groupPaymentsByDay(
  payments: Payment[],
  year: number,
  month: number,
) {
  const map: Record<number, Payment[]> = {};
  for (const p of payments) {
    const d = new Date(p.paidAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(p);
    }
  }
  return map;
}

function dayTotal(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount.cents, 0);
}

const providerColors: Record<string, string> = {
  coinflow: "bg-accent-blue",
  stripe: "bg-accent-purple",
  paypal: "bg-accent-yellow",
};

export default function Calendar({
  onDayClick,
  currentDate,
  onDateChange,
}: CalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: providers } = useProviders();
  const hasProviders = providers && providers.length > 0;

  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  const { data: payments, isFetching } = usePayments(monthStart, monthEnd);

  const paymentsByDay = useMemo(() => {
    if (!payments) return {};
    return groupPaymentsByDay(payments, year, month);
  }, [payments, year, month]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const monthTotal = useMemo(() => {
    if (!payments) return 0;
    return payments
      .filter((p) => {
        const d = new Date(p.paidAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount.cents, 0);
  }, [payments, year, month]);

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const hoveredDayPayments =
    hoveredDay !== null ? paymentsByDay[hoveredDay] || [] : [];
  const hoveredTotal =
    hoveredDay !== null ? dayTotal(hoveredDayPayments) : 0;
  const displayCents =
    hoveredDay !== null && hoveredTotal > 0 ? hoveredTotal : monthTotal;
  const isShowingDay = hoveredDay !== null && hoveredTotal > 0;

  const hoveredDayLabel =
    hoveredDay !== null
      ? new Date(year, month, hoveredDay).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex flex-col items-center px-5 pt-1 pb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onDateChange(new Date(year, month - 1, 1))}
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <h1 className="min-w-[150px] text-center text-[14px] font-semibold text-text-primary">
            {monthLabel}
          </h1>
          <button
            onClick={() => onDateChange(new Date(year, month + 1, 1))}
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {hasProviders && (
          <div className="relative mt-1 flex h-[42px] flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {isFetching && !payments ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <div className="h-1 w-1 animate-pulse rounded-full bg-text-tertiary" style={{ animationDelay: "0ms" }} />
                  <div className="h-1 w-1 animate-pulse rounded-full bg-text-tertiary" style={{ animationDelay: "150ms" }} />
                  <div className="h-1 w-1 animate-pulse rounded-full bg-text-tertiary" style={{ animationDelay: "300ms" }} />
                </motion.div>
              ) : (
                <motion.p
                  key={displayCents}
                  initial={{ opacity: 0, y: -5, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`font-mono text-[24px] font-bold tracking-tight ${
                    isShowingDay ? "text-accent-green" : "text-text-primary"
                  } ${isFetching ? "opacity-50" : ""}`}
                >
                  {monthTotal > 0
                    ? formatMoney({ cents: displayCents, currency: "USD" })
                    : "$0.00"}
                </motion.p>
              )}
            </AnimatePresence>
            <span
              className={`text-[10px] font-medium transition-all duration-150 ${
                isShowingDay && hoveredDayLabel
                  ? "text-text-secondary opacity-100"
                  : "text-text-tertiary opacity-0"
              }`}
            >
              {isShowingDay && hoveredDayLabel
                ? `${hoveredDayLabel} · ${hoveredDayPayments.length} payment${hoveredDayPayments.length !== 1 ? "s" : ""}`
                : "\u00A0"}
            </span>
          </div>
        )}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-4">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="pb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 gap-1.5 px-4 pb-4">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const dayPayments = paymentsByDay[day] || [];
          const hasTx = dayPayments.length > 0;
          const total = hasTx ? dayTotal(dayPayments) : 0;
          const todayMark = isToday(day);
          const hasRefund = dayPayments.some((p) => p.status === "Refunded");
          const hasDispute = dayPayments.some((p) => p.status === "Failed");

          return (
            <motion.button
              key={`day-${day}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.006 }}
              onClick={() => onDayClick(new Date(year, month, day))}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`day-cell flex flex-col rounded-xl px-2 py-1.5 ${
                hasTx ? "day-cell-active" : ""
              } ${todayMark ? "ring-1 ring-accent-blue/30" : ""}`}
            >
              {/* Amount + status markers + dots */}
              {hasTx ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className="self-start font-mono text-[12px] font-bold text-text-primary">
                      ${(total / 100).toFixed(total >= 10000 ? 0 : 2)}
                    </span>
                    {hasDispute && (
                      <span className="h-[6px] w-[6px] rounded-full bg-accent-red" title="Dispute" />
                    )}
                    {hasRefund && !hasDispute && (
                      <span className="h-[6px] w-[6px] rounded-full bg-accent-orange" title="Refund" />
                    )}
                  </div>
                  <div className="flex items-center gap-[3px]">
                    {[...new Set(dayPayments.map((p) => p.provider))]
                      .slice(0, 3)
                      .map((provider, j) => (
                        <div
                          key={j}
                          className={`h-[5px] w-[5px] rounded-full ${providerColors[provider] || "bg-text-tertiary"}`}
                          style={{
                            boxShadow: `0 0 4px ${
                              provider === "coinflow"
                                ? "rgba(10,132,255,0.4)"
                                : provider === "stripe"
                                  ? "rgba(191,90,242,0.4)"
                                  : "rgba(255,159,10,0.4)"
                            }`,
                          }}
                        />
                      ))}
                    {dayPayments.length > 1 && (
                      <span className="text-[8px] font-medium text-text-secondary">
                        {dayPayments.length}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Day number — bottom right */}
              <span
                className={`mt-auto self-end text-[10px] font-medium ${
                  todayMark
                    ? "flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent-blue text-white"
                    : hasTx
                      ? "text-text-secondary"
                      : "text-text-tertiary"
                }`}
              >
                {day}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

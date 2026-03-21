import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import Card from "@/components/ui/Card";
import ProviderBadge from "@/components/ui/ProviderBadge";
import ProjectSelector from "@/components/ui/ProjectSelector";
import ProviderFilter from "@/components/ui/ProviderFilter";
import { usePayments } from "@/hooks/useAnalytics";
import { formatMoney } from "@/lib/utils";
import type { Payment } from "@/lib/types";

interface DayDetailProps {
  date: Date;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  Completed: { label: "Completed", color: "bg-accent-green", bg: "bg-accent-green/15 text-accent-green" },
  Pending: { label: "Pending", color: "bg-accent-yellow", bg: "bg-accent-yellow/15 text-accent-yellow" },
  Failed: { label: "Dispute", color: "bg-accent-red", bg: "bg-accent-red/15 text-accent-red" },
  Refunded: { label: "Refunded", color: "bg-accent-orange", bg: "bg-accent-orange/15 text-accent-orange" },
};

function TransactionRow({ payment, index }: { payment: Payment; index: number }) {
  const [copied, setCopied] = useState(false);
  const st = statusLabels[payment.status] || statusLabels.Completed;
  const copyText = payment.customerEmail || payment.providerId;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  }, [copyText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: index * 0.03 }}
    >
      <Card className="group p-3 transition-all hover:border-glass-border-visible">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 shrink-0 rounded-full ${st.color}`} />
              <button
                onClick={handleCopy}
                className="flex min-w-0 items-center gap-1.5 text-left"
                title={`Click to copy: ${copyText}`}
              >
                <span className="truncate text-sm font-medium text-text-primary">
                  {payment.customerEmail || "Anonymous"}
                </span>
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check size={12} className="shrink-0 text-accent-green" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} className="text-text-tertiary" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              {payment.status !== "Completed" && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${st.bg}`}>
                  {st.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pl-4">
              <ProviderBadge provider={payment.provider} />
              <span className="text-[11px] text-text-tertiary">{payment.method}</span>
              <span className="text-[11px] text-text-tertiary">
                {new Date(payment.paidAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right pl-3">
            <p
              className={`font-mono text-sm font-semibold ${
                payment.status === "Refunded" || payment.status === "Failed"
                  ? "text-accent-red"
                  : "text-text-primary"
              }`}
            >
              {payment.status === "Refunded" || payment.status === "Failed" ? "-" : ""}
              {formatMoney(payment.amount)}
            </p>
            {payment.fees.cents > 0 && payment.status === "Completed" && (
              <p className="font-mono text-[10px] text-text-tertiary">
                -{formatMoney(payment.fees)} fees
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DayDetail({ date }: DayDetailProps) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const { data: payments } = usePayments(monthStart, monthEnd);

  const dayPayments = useMemo(() => {
    if (!payments) return [];
    return payments
      .filter((p) => {
        const d = new Date(p.paidAt);
        return (
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      })
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }, [payments, date]);

  const completed = dayPayments.filter((p) => p.status === "Completed");
  const refunded = dayPayments.filter((p) => p.status === "Refunded");
  const disputes = dayPayments.filter((p) => p.status === "Failed");
  const pending = dayPayments.filter((p) => p.status === "Pending");

  const gross = completed.reduce((s, p) => s + p.amount.cents, 0);
  const fees = completed.reduce((s, p) => s + p.fees.cents, 0);
  const refundTotal = refunded.reduce((s, p) => s + p.amount.cents, 0);
  const disputeTotal = disputes.reduce((s, p) => s + p.amount.cents, 0);
  const net = gross - fees - refundTotal - disputeTotal;
  const successRate =
    dayPayments.length > 0
      ? Math.round((completed.length / dayPayments.length) * 100)
      : 0;
  const avgTransaction =
    completed.length > 0 ? Math.round(gross / completed.length) : 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-3 p-4"
    >
      {/* Filters */}
      <div className="flex items-center justify-end gap-2">
        <ProjectSelector />
        <ProviderFilter />
      </div>

      {dayPayments.length > 0 && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
              <p className="font-mono text-base font-bold text-text-primary">
                {dayPayments.length}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">
                Total
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
              <p className={`font-mono text-base font-bold ${successRate >= 90 ? "text-accent-green" : successRate >= 70 ? "text-accent-yellow" : "text-accent-red"}`}>
                {successRate}%
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">
                Success
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
              <p className="font-mono text-base font-bold text-text-primary">
                {formatMoney({ cents: avgTransaction, currency: "USD" })}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">
                Avg
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
              <p className={`font-mono text-base font-bold ${net >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {formatMoney({ cents: net, currency: "USD" })}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-text-tertiary">
                Net
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <Card className="p-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Gross</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatMoney({ cents: gross, currency: "USD" })}
                </span>
              </div>
              {fees > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Fees</span>
                  <span className="font-mono text-text-tertiary">
                    -{formatMoney({ cents: fees, currency: "USD" })}
                  </span>
                </div>
              )}
              {refundTotal > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-accent-orange">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-orange" />
                    Refunds ({refunded.length})
                  </span>
                  <span className="font-mono text-accent-orange">
                    -{formatMoney({ cents: refundTotal, currency: "USD" })}
                  </span>
                </div>
              )}
              {disputeTotal > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-accent-red">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-red" />
                    Disputes ({disputes.length})
                  </span>
                  <span className="font-mono text-accent-red">
                    -{formatMoney({ cents: disputeTotal, currency: "USD" })}
                  </span>
                </div>
              )}
              {pending.length > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-accent-yellow">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow" />
                    Pending ({pending.length})
                  </span>
                  <span className="font-mono text-accent-yellow">
                    {formatMoney({
                      cents: pending.reduce((s, p) => s + p.amount.cents, 0),
                      currency: "USD",
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Transactions */}
      {dayPayments.length > 0 ? (
        <div className="space-y-1.5">
          <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            Transactions
          </h3>
          {dayPayments.map((payment, i) => (
            <TransactionRow key={payment.id} payment={payment} index={i} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-text-tertiary">No payments on this day</p>
        </Card>
      )}
    </motion.div>
  );
}

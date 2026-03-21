import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
  AlertTriangle,
  Percent,
} from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import PeriodSelector from "@/components/ui/PeriodSelector";
import Card from "@/components/ui/Card";
import { useAnalytics, usePlans } from "@/hooks/useAnalytics";
import { formatMoney } from "@/lib/utils";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function Analytics() {
  const { data: analytics, isLoading } = useAnalytics();
  const { data: plans } = usePlans();
  const hasSubscriptions = analytics && analytics.activeSubscribers > 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-4 p-4"
    >
      <div className="flex justify-end">
        <PeriodSelector />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse p-4">
              <div className="h-3 w-16 rounded bg-glass" />
              <div className="mt-3 h-6 w-24 rounded bg-glass" />
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Revenue metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Gross Revenue"
              value={formatMoney(analytics.revenue)}
              icon={<DollarSign size={16} />}
              delay={0}
            />
            <MetricCard
              label="Net Revenue"
              value={formatMoney(analytics.netRevenue)}
              icon={<TrendingUp size={16} />}
              delay={0.05}
            />
            <MetricCard
              label="Total Fees"
              value={formatMoney(analytics.totalFees)}
              icon={<Percent size={16} />}
              delay={0.1}
            />
            <MetricCard
              label="Payments"
              value={String(analytics.totalPayments)}
              icon={<Receipt size={16} />}
              delay={0.15}
            />
          </div>

          {/* Refunds & Disputes */}
          {(analytics.refundCount > 0 || analytics.disputeCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="p-4">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Refunds & Disputes
                </h2>
                <div className="space-y-2.5">
                  {analytics.refundCount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-accent-orange/15 p-1.5">
                          <RotateCcw size={14} className="text-accent-orange" />
                        </div>
                        <div>
                          <p className="text-sm text-text-primary">
                            {analytics.refundCount} Refund{analytics.refundCount !== 1 ? "s" : ""}
                          </p>
                          <p className="text-[11px] text-text-tertiary">
                            {analytics.refundRate}% refund rate
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-accent-orange">
                        -{formatMoney(analytics.totalRefunds)}
                      </span>
                    </div>
                  )}
                  {analytics.disputeCount > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-accent-red/15 p-1.5">
                          <AlertTriangle size={14} className="text-accent-red" />
                        </div>
                        <div>
                          <p className="text-sm text-text-primary">
                            {analytics.disputeCount} Dispute{analytics.disputeCount !== 1 ? "s" : ""}
                          </p>
                          <p className={`text-[11px] ${
                            analytics.disputeRate > 1 ? "text-accent-red" : "text-text-tertiary"
                          }`}>
                            {analytics.disputeRate}% dispute rate
                            {analytics.disputeRate > 1 && " ⚠"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Revenue breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card className="p-4">
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                Breakdown
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Gross Revenue</span>
                  <span className="font-mono text-text-primary">
                    {formatMoney(analytics.revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Fees</span>
                  <span className="font-mono text-text-tertiary">
                    -{formatMoney(analytics.totalFees)}
                  </span>
                </div>
                {analytics.refundCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-accent-orange">Refunds</span>
                    <span className="font-mono text-accent-orange">
                      -{formatMoney(analytics.totalRefunds)}
                    </span>
                  </div>
                )}
                <div className="border-t border-glass-border pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-text-primary">Net</span>
                    <span className="font-mono font-bold text-accent-green">
                      {formatMoney(analytics.netRevenue)}
                    </span>
                  </div>
                </div>
                {hasSubscriptions && (
                  <>
                    <div className="mt-2 border-t border-glass-border pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">MRR</span>
                        <span className="font-mono text-text-primary">
                          {formatMoney(analytics.mrr)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Active Subscribers</span>
                      <span className="text-text-primary">{analytics.activeSubscribers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Avg / Subscriber</span>
                      <span className="font-mono text-text-primary">
                        {formatMoney(analytics.avgRevenuePerSubscriber)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Plans */}
          {plans && plans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="p-4">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Plans
                </h2>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{plan.name}</p>
                        <p className="text-[11px] text-text-tertiary">
                          {plan.interval} &middot; {plan.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-semibold text-text-primary">
                        {formatMoney(plan.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}

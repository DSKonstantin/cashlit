import { type DateRange, type Money, type PeriodFilter } from "./types";

export function formatMoney(money: Money): string {
  const amount = money.cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatMoneyShort(money: Money): string {
  const amount = money.cents / 100;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return formatMoney(money);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function periodToDateRange(period: PeriodFilter): DateRange {
  const now = Date.now();
  const until = now;

  switch (period) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { since: start.getTime(), until };
    }
    case "7d":
      return { since: now - 7 * 24 * 60 * 60 * 1000, until };
    case "30d":
      return { since: now - 30 * 24 * 60 * 60 * 1000, until };
    case "90d":
      return { since: now - 90 * 24 * 60 * 60 * 1000, until };
    case "all":
      return { since: 0, until };
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

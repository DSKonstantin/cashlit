// Provider types
export type Provider = "coinflow" | "stripe" | "paypal";

export type BillingInterval = "Daily" | "Weekly" | "Monthly" | "Yearly";

export type SubscriptionStatus =
  | "Active"
  | "Cancelled"
  | "PastDue"
  | "Trialing"
  | "Paused";

export type PaymentStatus = "Completed" | "Pending" | "Failed" | "Refunded";

export type PaymentMethod =
  | "Card"
  | "ACH"
  | "Crypto"
  | "BankTransfer"
  | "Wallet"
  | "Other";

// Core data types
export interface Money {
  cents: number;
  currency: string;
}

export interface Plan {
  id: string;
  provider: Provider;
  providerId: string;
  name: string;
  interval: BillingInterval;
  amount: Money;
  active: boolean;
  subscriberCount: number;
}

export interface Subscriber {
  id: string;
  provider: Provider;
  providerId: string;
  email: string | null;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  createdAt: string;
  currentPeriodEnd: string | null;
}

export interface Payment {
  id: string;
  provider: Provider;
  providerId: string;
  subscriberId: string | null;
  amount: Money;
  fees: Money;
  netAmount: Money;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt: string;
  customerEmail: string | null;
}

export interface AnalyticsSummary {
  provider: Provider | null;
  mrr: Money;
  revenue: Money;
  netRevenue: Money;
  totalFees: Money;
  totalRefunds: Money;
  refundCount: number;
  refundRate: number;
  disputeCount: number;
  disputeRate: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  activeSubscribers: number;
  totalPayments: number;
  avgRevenuePerSubscriber: Money;
}

// Provider configuration
export interface ProviderConfig {
  id: string;
  provider: Provider;
  environment: "sandbox" | "production";
  displayName: string;
  connected: boolean;
  maskedKey: string;
}

export interface NewProviderConfig {
  provider: Provider;
  environment: "sandbox" | "production";
  apiKey: string;
  apiSecret?: string;
  displayName: string;
}

// Projects
export interface Project {
  id: string;
  name: string;
  providerIds: string[];
}

export interface NewProject {
  name: string;
}

// Period filter
export type PeriodFilter = "today" | "7d" | "30d" | "90d" | "all";

export interface DateRange {
  since: number; // epoch ms
  until: number; // epoch ms
}

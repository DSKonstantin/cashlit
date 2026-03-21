use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    Coinflow,
    Stripe,
    Paypal,
}

impl std::fmt::Display for Provider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Provider::Coinflow => write!(f, "coinflow"),
            Provider::Stripe => write!(f, "stripe"),
            Provider::Paypal => write!(f, "paypal"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    Sandbox,
    Production,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Money {
    pub cents: i64,
    pub currency: String,
}

impl Money {
    pub fn usd(cents: i64) -> Self {
        Self {
            cents,
            currency: "USD".to_string(),
        }
    }

    pub fn zero() -> Self {
        Self::usd(0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BillingInterval {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

impl BillingInterval {
    pub fn to_monthly_multiplier(&self) -> f64 {
        match self {
            BillingInterval::Daily => 30.0,
            BillingInterval::Weekly => 4.33,
            BillingInterval::Monthly => 1.0,
            BillingInterval::Yearly => 1.0 / 12.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubscriptionStatus {
    Active,
    Cancelled,
    PastDue,
    Trialing,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaymentStatus {
    Completed,
    Pending,
    Failed,
    Refunded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaymentMethod {
    Card,
    #[serde(rename = "ACH")]
    Ach,
    Crypto,
    BankTransfer,
    Wallet,
    Other,
}

// --- Unified models ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub id: String,
    pub provider: Provider,
    pub provider_id: String,
    pub name: String,
    pub interval: BillingInterval,
    pub amount: Money,
    pub active: bool,
    pub subscriber_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subscriber {
    pub id: String,
    pub provider: Provider,
    pub provider_id: String,
    pub email: Option<String>,
    pub plan_id: String,
    pub plan_name: String,
    pub status: SubscriptionStatus,
    pub created_at: DateTime<Utc>,
    pub current_period_end: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Payment {
    pub id: String,
    pub provider: Provider,
    pub provider_id: String,
    pub subscriber_id: Option<String>,
    pub amount: Money,
    pub fees: Money,
    pub net_amount: Money,
    pub status: PaymentStatus,
    pub method: PaymentMethod,
    pub paid_at: DateTime<Utc>,
    pub customer_email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSummary {
    pub provider: Option<Provider>,
    pub mrr: Money,
    pub revenue: Money,
    pub net_revenue: Money,
    pub total_fees: Money,
    pub total_refunds: Money,
    pub refund_count: u32,
    pub refund_rate: f64,
    pub dispute_count: u32,
    pub dispute_rate: f64,
    pub new_subscriptions: u32,
    pub churned_subscriptions: u32,
    pub active_subscribers: u32,
    pub total_payments: u32,
    pub avg_revenue_per_subscriber: Money,
}

// --- Provider config ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    pub id: String,
    pub provider: Provider,
    pub environment: Environment,
    pub display_name: String,
    pub connected: bool,
    pub masked_key: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewProviderConfig {
    pub provider: Provider,
    pub environment: Environment,
    pub api_key: String,
    /// Second key for PayPal (client_secret)
    #[serde(default)]
    pub api_secret: Option<String>,
    pub display_name: String,
}

// --- Projects ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub provider_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewProject {
    pub name: String,
}

// --- Provider trait ---

#[async_trait::async_trait]
pub trait PaymentProvider: Send + Sync {
    fn provider_type(&self) -> Provider;
    fn display_name(&self) -> &str;
    fn config_id(&self) -> &str;

    async fn get_plans(&self) -> Result<Vec<Plan>, crate::error::AppError>;
    async fn get_subscribers(&self) -> Result<Vec<Subscriber>, crate::error::AppError>;
    async fn get_payments(
        &self,
        since: DateTime<Utc>,
        until: DateTime<Utc>,
    ) -> Result<Vec<Payment>, crate::error::AppError>;
    async fn test_connection(&self) -> Result<bool, crate::error::AppError>;
}

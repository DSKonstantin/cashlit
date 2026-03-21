use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowPlan {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub code: Option<String>,
    pub interval: String,
    #[serde(default)]
    pub duration: Option<i32>,
    pub amount: CoinflowAmount,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub active: bool,
    #[serde(default)]
    pub merchant_initiated: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CoinflowAmount {
    #[serde(default)]
    pub cents: i64,
    #[serde(default)]
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowSubscriber {
    pub id: String,
    #[serde(default)]
    pub plan_id: Option<String>,
    #[serde(default)]
    pub plan_name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowCustomer {
    #[serde(default, alias = "_id")]
    pub id: Option<String>,
    #[serde(default)]
    pub customer_id: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub blockchain: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowPayment {
    #[serde(default, alias = "_id")]
    pub id: Option<String>,
    #[serde(default)]
    pub payment_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub payment_status: Option<String>,
    #[serde(default, alias = "paymentMethod")]
    pub method: Option<String>,
    #[serde(default)]
    pub payment_type: Option<String>,
    // Customer as nested object
    #[serde(default)]
    pub customer: Option<CoinflowCustomer>,
    // Or email at top level
    #[serde(default, alias = "customerEmail")]
    pub email: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub totals: Option<CoinflowTotals>,
    #[serde(default)]
    pub amount: Option<CoinflowAmount>,
    #[serde(default)]
    pub subtotal: Option<i64>,
}

impl CoinflowPayment {
    /// Get the best available status string
    pub fn effective_status(&self) -> &str {
        self.payment_status
            .as_deref()
            .or(self.status.as_deref())
            .unwrap_or("completed")
    }

    /// Get customer email from nested customer or top-level
    pub fn effective_email(&self) -> Option<String> {
        self.email.clone().or_else(|| {
            self.customer.as_ref().and_then(|c| {
                c.email.clone().or_else(|| {
                    // Use short customer ID as fallback
                    c.customer_id.as_ref().map(|id| {
                        if id.len() > 8 {
                            format!("{}...{}", &id[..4], &id[id.len()-4..])
                        } else {
                            id.clone()
                        }
                    })
                })
            })
        })
    }

    /// Get the best available ID
    pub fn effective_id(&self) -> String {
        self.payment_id
            .clone()
            .or_else(|| self.id.clone())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowTotals {
    #[serde(default)]
    pub subtotal: Option<CoinflowAmount>,
    #[serde(default)]
    pub total: Option<CoinflowAmount>,
    #[serde(default)]
    pub credit_card_fees: Option<CoinflowAmount>,
    #[serde(default)]
    pub chargeback_protection_fees: Option<CoinflowAmount>,
    #[serde(default)]
    pub gas_fees: Option<CoinflowAmount>,
    #[serde(default)]
    pub fx_fees: Option<CoinflowAmount>,
    #[serde(default)]
    pub network_fees: Option<CoinflowAmount>,
}

// Refund from GET /api/refunds
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowRefund {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub payment_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>, // Pending, Invoiced, Settled, Failed
    #[serde(default)]
    pub method: Option<String>, // Card, Ach, Pix, Iban, Wire
    #[serde(default)]
    pub totals: Option<CoinflowRefundTotals>,
    #[serde(default)]
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinflowRefundTotals {
    #[serde(default)]
    pub subtotal: Option<CoinflowAmount>,
    #[serde(default)]
    pub total: Option<CoinflowAmount>,
}

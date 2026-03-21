use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct StripeList<T> {
    pub data: Vec<T>,
    #[serde(default)]
    pub has_more: bool,
}

#[derive(Debug, Deserialize)]
pub struct StripePrice {
    pub id: String,
    #[serde(default)]
    pub active: bool,
    #[serde(default)]
    pub nickname: Option<String>,
    #[serde(default)]
    pub unit_amount: Option<i64>,
    #[serde(default)]
    pub currency: Option<String>,
    #[serde(default)]
    pub recurring: Option<StripeRecurring>,
    #[serde(default)]
    pub product: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct StripeRecurring {
    #[serde(default)]
    pub interval: Option<String>,
    #[serde(default)]
    pub interval_count: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct StripeSubscription {
    pub id: String,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub customer: Option<String>,
    #[serde(default)]
    pub created: Option<i64>,
    #[serde(default)]
    pub current_period_end: Option<i64>,
    #[serde(default)]
    pub items: Option<StripeSubscriptionItems>,
}

#[derive(Debug, Deserialize)]
pub struct StripeSubscriptionItems {
    pub data: Vec<StripeSubscriptionItem>,
}

#[derive(Debug, Deserialize)]
pub struct StripeSubscriptionItem {
    #[serde(default)]
    pub price: Option<StripePrice>,
}

#[derive(Debug, Deserialize)]
pub struct StripeCharge {
    pub id: String,
    #[serde(default)]
    pub amount: Option<i64>,
    #[serde(default)]
    pub currency: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub created: Option<i64>,
    #[serde(default)]
    pub customer: Option<serde_json::Value>, // string or expanded object
    #[serde(default)]
    pub receipt_email: Option<String>,
    #[serde(default)]
    pub billing_details: Option<StripeBillingDetails>,
    #[serde(default)]
    pub payment_method_details: Option<StripePaymentMethodDetails>,
    #[serde(default)]
    pub balance_transaction: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

impl StripeCharge {
    pub fn effective_email(&self) -> Option<String> {
        // 1. receipt_email
        self.receipt_email.clone()
            // 2. billing_details.email
            .or_else(|| self.billing_details.as_ref().and_then(|b| b.email.clone()))
            // 3. billing_details.name
            .or_else(|| self.billing_details.as_ref().and_then(|b| b.name.clone()))
            // 4. description
            .or_else(|| self.description.clone())
            // 5. customer ID (shortened)
            .or_else(|| {
                self.customer.as_ref().and_then(|c| {
                    c.as_str().map(|s| {
                        if s.len() > 12 {
                            format!("{}...{}", &s[..8], &s[s.len()-4..])
                        } else {
                            s.to_string()
                        }
                    })
                })
            })
    }

    pub fn customer_id(&self) -> Option<String> {
        self.customer.as_ref().and_then(|c| {
            c.as_str().map(String::from).or_else(|| c.get("id").and_then(|id| id.as_str()).map(String::from))
        })
    }
}

#[derive(Debug, Deserialize)]
pub struct StripeBillingDetails {
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StripePaymentMethodDetails {
    #[serde(default, rename = "type")]
    pub method_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StripeBalanceTransaction {
    pub id: String,
    #[serde(default)]
    pub amount: Option<i64>,
    #[serde(default)]
    pub fee: Option<i64>,
    #[serde(default)]
    pub net: Option<i64>,
    #[serde(default)]
    pub currency: Option<String>,
}

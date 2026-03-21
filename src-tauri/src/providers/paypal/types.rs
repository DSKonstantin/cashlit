use serde::Deserialize;

// Auth
#[derive(Debug, Deserialize)]
pub struct PayPalToken {
    pub access_token: String,
}

// Plans
#[derive(Debug, Deserialize)]
pub struct PayPalPlanList {
    #[serde(default)]
    pub plans: Vec<PayPalPlan>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalPlan {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub billing_cycles: Option<Vec<PayPalBillingCycle>>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalBillingCycle {
    #[serde(default)]
    pub frequency: Option<PayPalFrequency>,
    #[serde(default)]
    pub pricing_scheme: Option<PayPalPricingScheme>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalFrequency {
    #[serde(default)]
    pub interval_unit: Option<String>,
    #[serde(default)]
    pub interval_count: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalPricingScheme {
    #[serde(default)]
    pub fixed_price: Option<PayPalMoney>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalMoney {
    #[serde(default)]
    pub value: Option<String>,
    #[serde(default)]
    pub currency_code: Option<String>,
}

// Subscriptions
#[derive(Debug, Deserialize)]
pub struct PayPalSubscriptionList {
    #[serde(default)]
    pub subscriptions: Vec<PayPalSubscription>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalSubscription {
    pub id: String,
    #[serde(default)]
    pub plan_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub subscriber: Option<PayPalSubscriber>,
    #[serde(default)]
    pub create_time: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalSubscriber {
    #[serde(default)]
    pub email_address: Option<String>,
}

// Transactions
#[derive(Debug, Deserialize)]
pub struct PayPalTransactionList {
    #[serde(default)]
    pub transaction_details: Vec<PayPalTransaction>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalTransaction {
    #[serde(default)]
    pub transaction_info: Option<PayPalTransactionInfo>,
    #[serde(default)]
    pub payer_info: Option<PayPalPayerInfo>,
    #[serde(default)]
    pub shipping_info: Option<PayPalShippingInfo>,
}

impl PayPalTransaction {
    pub fn effective_email(&self) -> Option<String> {
        // 1. payer email
        self.payer_info.as_ref().and_then(|p| p.email_address.clone())
            // 2. payer name
            .or_else(|| {
                self.payer_info.as_ref().and_then(|p| p.payer_name.as_ref()).and_then(|n| {
                    match (n.given_name.as_deref(), n.surname.as_deref()) {
                        (Some(first), Some(last)) => Some(format!("{} {}", first, last)),
                        (Some(first), None) => Some(first.to_string()),
                        (None, Some(last)) => Some(last.to_string()),
                        _ => None,
                    }
                })
            })
            // 3. shipping name
            .or_else(|| {
                self.shipping_info.as_ref().and_then(|s| s.name.clone())
            })
            // 4. transaction subject
            .or_else(|| {
                self.transaction_info.as_ref().and_then(|t| t.transaction_subject.clone())
            })
            // 5. account id (shortened)
            .or_else(|| {
                self.payer_info.as_ref().and_then(|p| p.account_id.as_ref()).map(|id| {
                    if id.len() > 10 {
                        format!("{}...{}", &id[..6], &id[id.len()-4..])
                    } else {
                        id.clone()
                    }
                })
            })
    }
}

#[derive(Debug, Deserialize)]
pub struct PayPalTransactionInfo {
    #[serde(default)]
    pub transaction_id: Option<String>,
    #[serde(default)]
    pub transaction_status: Option<String>,
    #[serde(default)]
    pub transaction_amount: Option<PayPalMoney>,
    #[serde(default)]
    pub fee_amount: Option<PayPalMoney>,
    #[serde(default)]
    pub transaction_initiation_date: Option<String>,
    #[serde(default)]
    pub transaction_subject: Option<String>,
    #[serde(default)]
    pub transaction_note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalPayerInfo {
    #[serde(default)]
    pub email_address: Option<String>,
    #[serde(default)]
    pub account_id: Option<String>,
    #[serde(default)]
    pub payer_name: Option<PayPalName>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalName {
    #[serde(default)]
    pub given_name: Option<String>,
    #[serde(default)]
    pub surname: Option<String>,
    #[serde(default)]
    pub alternate_full_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PayPalShippingInfo {
    #[serde(default)]
    pub name: Option<String>,
}

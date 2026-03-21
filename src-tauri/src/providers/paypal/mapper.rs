use chrono::Utc;

use super::types::*;
use crate::providers::types::{self as unified, Provider};

fn parse_money(m: &Option<PayPalMoney>) -> (i64, String) {
    m.as_ref()
        .map(|money| {
            let cents = money
                .value
                .as_deref()
                .and_then(|v| v.parse::<f64>().ok())
                .map(|v| (v * 100.0) as i64)
                .unwrap_or(0);
            let currency = money.currency_code.clone().unwrap_or_else(|| "USD".to_string());
            (cents, currency)
        })
        .unwrap_or((0, "USD".to_string()))
}

pub fn plan_to_unified(raw: PayPalPlan, config_id: &str) -> unified::Plan {
    let cycle = raw.billing_cycles.as_ref().and_then(|c| c.first());

    let interval = match cycle.and_then(|c| c.frequency.as_ref()).and_then(|f| f.interval_unit.as_deref()) {
        Some("DAY") => unified::BillingInterval::Daily,
        Some("WEEK") => unified::BillingInterval::Weekly,
        Some("MONTH") => unified::BillingInterval::Monthly,
        Some("YEAR") => unified::BillingInterval::Yearly,
        _ => unified::BillingInterval::Monthly,
    };

    let (cents, currency) = cycle
        .and_then(|c| c.pricing_scheme.as_ref())
        .map(|ps| parse_money(&ps.fixed_price))
        .unwrap_or((0, "USD".to_string()));

    unified::Plan {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Paypal,
        provider_id: raw.id,
        name: raw.name.unwrap_or_else(|| "PayPal Plan".to_string()),
        interval,
        amount: unified::Money { cents, currency },
        active: raw.status.as_deref() == Some("ACTIVE"),
        subscriber_count: 0,
    }
}

pub fn transaction_to_payment(raw: PayPalTransaction, config_id: &str) -> unified::Payment {
    let customer_email = raw.effective_email();
    let info = raw.transaction_info.as_ref();

    let tx_id = info
        .and_then(|i| i.transaction_id.clone())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let status = match info.and_then(|i| i.transaction_status.as_deref()) {
        Some("S") | Some("SUCCESS") => unified::PaymentStatus::Completed,
        Some("P") | Some("PENDING") => unified::PaymentStatus::Pending,
        Some("D") | Some("DENIED") => unified::PaymentStatus::Failed,
        Some("V") | Some("REVERSED") => unified::PaymentStatus::Refunded,
        _ => unified::PaymentStatus::Completed,
    };

    let (amount_cents, currency) = info
        .map(|i| parse_money(&i.transaction_amount))
        .unwrap_or((0, "USD".to_string()));

    let (fee_cents, _) = info
        .map(|i| parse_money(&i.fee_amount))
        .unwrap_or((0, "USD".to_string()));

    let paid_at = info
        .and_then(|i| i.transaction_initiation_date.as_deref())
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);

    unified::Payment {
        id: format!("{}:{}", config_id, tx_id),
        provider: Provider::Paypal,
        provider_id: tx_id,
        subscriber_id: None,
        amount: unified::Money { cents: amount_cents.abs(), currency: currency.clone() },
        fees: unified::Money { cents: fee_cents.abs(), currency: currency.clone() },
        net_amount: unified::Money { cents: (amount_cents.abs() - fee_cents.abs()).max(0), currency },
        status,
        method: unified::PaymentMethod::Wallet,
        paid_at,
        customer_email,
    }
}

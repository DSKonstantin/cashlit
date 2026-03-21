use chrono::{TimeZone, Utc};

use super::types::*;
use crate::providers::types::{self as unified, Provider};

pub fn price_to_plan(raw: StripePrice, config_id: &str) -> unified::Plan {
    let interval = match raw.recurring.as_ref().and_then(|r| r.interval.as_deref()) {
        Some("day") => unified::BillingInterval::Daily,
        Some("week") => unified::BillingInterval::Weekly,
        Some("month") => unified::BillingInterval::Monthly,
        Some("year") => unified::BillingInterval::Yearly,
        _ => unified::BillingInterval::Monthly,
    };

    let name = raw.nickname
        .or_else(|| {
            raw.product.as_ref().and_then(|p| {
                p.get("name").and_then(|n| n.as_str()).map(String::from)
            })
        })
        .unwrap_or_else(|| raw.id.clone());

    let currency = raw.currency.as_deref().unwrap_or("usd").to_uppercase();

    unified::Plan {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Stripe,
        provider_id: raw.id,
        name,
        interval,
        amount: unified::Money {
            cents: raw.unit_amount.unwrap_or(0),
            currency,
        },
        active: raw.active,
        subscriber_count: 0,
    }
}

pub fn subscription_to_subscriber(raw: StripeSubscription, config_id: &str) -> unified::Subscriber {
    let status = match raw.status.as_deref() {
        Some("active") => unified::SubscriptionStatus::Active,
        Some("canceled") => unified::SubscriptionStatus::Cancelled,
        Some("past_due") => unified::SubscriptionStatus::PastDue,
        Some("trialing") => unified::SubscriptionStatus::Trialing,
        Some("paused") => unified::SubscriptionStatus::Paused,
        _ => unified::SubscriptionStatus::Active,
    };

    let created_at = raw.created
        .and_then(|ts| Utc.timestamp_opt(ts, 0).single())
        .unwrap_or_else(Utc::now);

    let current_period_end = raw.current_period_end
        .and_then(|ts| Utc.timestamp_opt(ts, 0).single());

    let plan_id = raw.items
        .and_then(|items| items.data.first().and_then(|i| i.price.as_ref().map(|p| p.id.clone())))
        .unwrap_or_default();

    unified::Subscriber {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Stripe,
        provider_id: raw.id,
        email: None,
        plan_id,
        plan_name: String::new(),
        status,
        created_at,
        current_period_end,
    }
}

pub fn charge_to_payment(raw: StripeCharge, config_id: &str) -> unified::Payment {
    let status = match raw.status.as_deref() {
        Some("succeeded") => unified::PaymentStatus::Completed,
        Some("pending") => unified::PaymentStatus::Pending,
        Some("failed") => unified::PaymentStatus::Failed,
        _ => unified::PaymentStatus::Completed,
    };

    let method = match raw.payment_method_details.as_ref().and_then(|d| d.method_type.as_deref()) {
        Some("card") => unified::PaymentMethod::Card,
        Some("ach_debit") | Some("ach_credit") => unified::PaymentMethod::Ach,
        Some("bank_transfer") => unified::PaymentMethod::BankTransfer,
        _ => unified::PaymentMethod::Card,
    };

    let currency = raw.currency.as_deref().unwrap_or("usd").to_uppercase();
    let amount_cents = raw.amount.unwrap_or(0);

    let paid_at = raw.created
        .and_then(|ts| Utc.timestamp_opt(ts, 0).single())
        .unwrap_or_else(Utc::now);

    let customer_email = raw.effective_email();
    let subscriber_id = raw.customer_id();

    unified::Payment {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Stripe,
        provider_id: raw.id,
        subscriber_id,
        amount: unified::Money { cents: amount_cents, currency: currency.clone() },
        fees: unified::Money::zero(),
        net_amount: unified::Money { cents: amount_cents, currency },
        status,
        method,
        paid_at,
        customer_email,
    }
}

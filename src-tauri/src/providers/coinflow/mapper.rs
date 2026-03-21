use chrono::Utc;

use super::types::*;
use crate::providers::types::{self as unified, Provider};

pub fn plan_to_unified(raw: CoinflowPlan, config_id: &str) -> unified::Plan {
    let interval = match raw.interval.as_str() {
        "Daily" => unified::BillingInterval::Daily,
        "Weekly" => unified::BillingInterval::Weekly,
        "Monthly" => unified::BillingInterval::Monthly,
        "Yearly" => unified::BillingInterval::Yearly,
        _ => unified::BillingInterval::Monthly,
    };

    unified::Plan {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Coinflow,
        provider_id: raw.id,
        name: raw.name,
        interval,
        amount: unified::Money {
            cents: raw.amount.cents,
            currency: raw.amount.currency.unwrap_or_else(|| "USD".to_string()),
        },
        active: raw.active,
        subscriber_count: 0,
    }
}

pub fn subscriber_to_unified(raw: CoinflowSubscriber, config_id: &str) -> unified::Subscriber {
    let status = match raw.status.as_deref() {
        Some("active") => unified::SubscriptionStatus::Active,
        Some("cancelled") | Some("canceled") => unified::SubscriptionStatus::Cancelled,
        Some("past_due") => unified::SubscriptionStatus::PastDue,
        Some("trialing") => unified::SubscriptionStatus::Trialing,
        Some("paused") => unified::SubscriptionStatus::Paused,
        _ => unified::SubscriptionStatus::Active,
    };

    let created_at = raw
        .created_at
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);

    unified::Subscriber {
        id: format!("{}:{}", config_id, raw.id),
        provider: Provider::Coinflow,
        provider_id: raw.id,
        email: raw.email,
        plan_id: raw.plan_id.unwrap_or_default(),
        plan_name: raw.plan_name.unwrap_or_else(|| "Unknown".to_string()),
        status,
        created_at,
        current_period_end: None,
    }
}

pub fn payment_to_unified(raw: CoinflowPayment, config_id: &str) -> unified::Payment {
    let payment_id = raw.effective_id();
    let customer_email = raw.effective_email();

    // Status: use effective_status() which checks paymentStatus then status
    let status_str = raw.effective_status().to_lowercase();
    let status = match status_str.as_str() {
        "completed" | "settled" | "succeeded" | "paid" | "success" => {
            unified::PaymentStatus::Completed
        }
        "pending" | "processing" | "created" | "initiated" => {
            unified::PaymentStatus::Pending
        }
        "failed" | "declined" | "error" => unified::PaymentStatus::Failed,
        "refunded" | "reversed" => unified::PaymentStatus::Refunded,
        _ => unified::PaymentStatus::Completed,
    };

    // Method
    let method_str = raw.method.as_deref()
        .or(raw.payment_type.as_deref())
        .unwrap_or("");
    let method = match method_str.to_lowercase().as_str() {
        "card" | "credit_card" | "creditcard" => unified::PaymentMethod::Card,
        "ach" => unified::PaymentMethod::Ach,
        "crypto" => unified::PaymentMethod::Crypto,
        "bank_transfer" | "banktransfer" => unified::PaymentMethod::BankTransfer,
        "wallet" | "apple_pay" | "google_pay" | "applepay" | "googlepay" => {
            unified::PaymentMethod::Wallet
        }
        _ => unified::PaymentMethod::Card, // default to Card for Coinflow
    };

    // Amounts: subtotal = what customer paid, total = subtotal + fees
    // So: amount = subtotal, fees = total - subtotal, net = subtotal
    let (amount, fees, net_amount) = if let Some(ref totals) = raw.totals {
        let subtotal = totals.subtotal.as_ref().map(|a| a.cents).unwrap_or(0);
        let total = totals.total.as_ref().map(|a| a.cents).unwrap_or(subtotal);

        // Sum up all fee components
        let fee_sum = [
            &totals.credit_card_fees,
            &totals.chargeback_protection_fees,
            &totals.gas_fees,
            &totals.fx_fees,
            &totals.network_fees,
        ]
        .iter()
        .filter_map(|f| f.as_ref().map(|a| a.cents))
        .sum::<i64>();

        let fees = if fee_sum > 0 { fee_sum } else { (total - subtotal).abs() };

        (
            unified::Money::usd(subtotal),
            unified::Money::usd(fees),
            unified::Money::usd(subtotal - fees.min(subtotal)),
        )
    } else if let Some(ref amt) = raw.amount {
        (
            unified::Money::usd(amt.cents),
            unified::Money::zero(),
            unified::Money::usd(amt.cents),
        )
    } else if let Some(sub) = raw.subtotal {
        (
            unified::Money::usd(sub),
            unified::Money::zero(),
            unified::Money::usd(sub),
        )
    } else {
        (unified::Money::zero(), unified::Money::zero(), unified::Money::zero())
    };

    // Date: try createdAt
    let paid_at = raw
        .created_at
        .and_then(|s| {
            chrono::DateTime::parse_from_rfc3339(&s)
                .ok()
                .or_else(|| chrono::DateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S%.fZ").ok())
        })
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);

    unified::Payment {
        id: format!("{}:{}", config_id, payment_id),
        provider: Provider::Coinflow,
        provider_id: payment_id,
        subscriber_id: None,
        amount,
        fees,
        net_amount,
        status,
        method,
        paid_at,
        customer_email,
    }
}

pub fn refund_to_unified(raw: CoinflowRefund, config_id: &str) -> unified::Payment {
    let refund_id = raw.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let amount_cents = raw.totals
        .as_ref()
        .and_then(|t| t.subtotal.as_ref().map(|a| a.cents))
        .unwrap_or(0);

    let method = match raw.method.as_deref() {
        Some("Card") | Some("card") => unified::PaymentMethod::Card,
        Some("Ach") | Some("ach") => unified::PaymentMethod::Ach,
        _ => unified::PaymentMethod::Other,
    };

    let paid_at = raw.created_at
        .and_then(|s| {
            chrono::DateTime::parse_from_rfc3339(&s)
                .ok()
                .or_else(|| chrono::DateTime::parse_from_str(&s, "%Y-%m-%dT%H:%M:%S%.fZ").ok())
        })
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(Utc::now);

    unified::Payment {
        id: format!("{}:refund:{}", config_id, refund_id),
        provider: Provider::Coinflow,
        provider_id: refund_id,
        subscriber_id: raw.payment_id,
        amount: unified::Money::usd(amount_cents),
        fees: unified::Money::zero(),
        net_amount: unified::Money::usd(amount_cents),
        status: unified::PaymentStatus::Refunded,
        method,
        paid_at,
        customer_email: None,
    }
}

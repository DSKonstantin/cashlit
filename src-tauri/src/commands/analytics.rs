use chrono::{TimeZone, Utc};
use tauri::State;

use crate::error::AppError;
use crate::providers::types::*;
use crate::state::AppState;

#[tauri::command]
pub async fn get_plans(
    state: State<'_, AppState>,
    provider: Option<Provider>,
) -> Result<Vec<Plan>, AppError> {
    let registry = state.registry.read().await;
    registry.get_all_plans(provider.as_ref()).await
}

#[tauri::command]
pub async fn get_subscribers(
    state: State<'_, AppState>,
    provider: Option<Provider>,
) -> Result<Vec<Subscriber>, AppError> {
    let registry = state.registry.read().await;
    registry.get_all_subscribers(provider.as_ref()).await
}

#[tauri::command]
pub async fn get_payments(
    state: State<'_, AppState>,
    since: i64,
    until: i64,
    provider: Option<Provider>,
) -> Result<Vec<Payment>, AppError> {
    let since_dt = Utc.timestamp_millis_opt(since).single().unwrap_or_else(Utc::now);
    let until_dt = Utc.timestamp_millis_opt(until).single().unwrap_or_else(Utc::now);
    let registry = state.registry.read().await;
    registry.get_all_payments(since_dt, until_dt, provider.as_ref()).await
}

#[tauri::command]
pub async fn get_analytics(
    state: State<'_, AppState>,
    since: i64,
    until: i64,
    provider: Option<Provider>,
) -> Result<AnalyticsSummary, AppError> {
    let since_dt = Utc.timestamp_millis_opt(since).single().unwrap_or_else(Utc::now);
    let until_dt = Utc.timestamp_millis_opt(until).single().unwrap_or_else(Utc::now);

    let registry = state.registry.read().await;
    let plans = registry.get_all_plans(provider.as_ref()).await?;
    let subscribers = registry.get_all_subscribers(provider.as_ref()).await?;
    let payments = registry.get_all_payments(since_dt, until_dt, provider.as_ref()).await?;

    // Subscriptions
    let active_subscribers: Vec<_> = subscribers
        .iter()
        .filter(|s| matches!(s.status, SubscriptionStatus::Active))
        .collect();

    let mut mrr_cents: i64 = 0;
    for sub in &active_subscribers {
        if let Some(plan) = plans.iter().find(|p| p.provider_id == sub.plan_id) {
            mrr_cents += (plan.amount.cents as f64 * plan.interval.to_monthly_multiplier()) as i64;
        }
    }

    let new_subs = subscribers
        .iter()
        .filter(|s| s.created_at >= since_dt && s.created_at <= until_dt)
        .count() as u32;

    let churned = subscribers
        .iter()
        .filter(|s| matches!(s.status, SubscriptionStatus::Cancelled))
        .count() as u32;

    let active_count = active_subscribers.len() as u32;

    // Completed payments (revenue)
    let completed: Vec<_> = payments
        .iter()
        .filter(|p| matches!(p.status, PaymentStatus::Completed))
        .collect();

    let revenue_cents: i64 = completed.iter().map(|p| p.amount.cents).sum();
    let total_fees_cents: i64 = completed.iter().map(|p| p.fees.cents).sum();
    let net_revenue_cents: i64 = revenue_cents - total_fees_cents;
    let total_completed = completed.len() as u32;

    // Refunds
    let refunds: Vec<_> = payments
        .iter()
        .filter(|p| matches!(p.status, PaymentStatus::Refunded))
        .collect();
    let refund_cents: i64 = refunds.iter().map(|p| p.amount.cents).sum();
    let refund_count = refunds.len() as u32;
    let refund_rate = if total_completed > 0 {
        refund_count as f64 / total_completed as f64 * 100.0
    } else {
        0.0
    };

    // Disputes — count failed/reversed that look like disputes
    // In real API data, disputes come as separate status or from chargebacks endpoint
    let dispute_count = payments
        .iter()
        .filter(|p| matches!(p.status, PaymentStatus::Failed))
        .count() as u32;
    let dispute_rate = if total_completed > 0 {
        dispute_count as f64 / total_completed as f64 * 100.0
    } else {
        0.0
    };

    // Total payments = completed + refunded (not failed)
    let total_payments = total_completed + refund_count;

    let avg_rev = if total_completed > 0 {
        revenue_cents / total_completed as i64
    } else if active_count > 0 {
        mrr_cents / active_count as i64
    } else {
        0
    };

    Ok(AnalyticsSummary {
        provider,
        mrr: Money::usd(mrr_cents),
        revenue: Money::usd(revenue_cents),
        net_revenue: Money::usd(net_revenue_cents),
        total_fees: Money::usd(total_fees_cents),
        total_refunds: Money::usd(refund_cents),
        refund_count,
        refund_rate: (refund_rate * 10.0).round() / 10.0,
        dispute_count,
        dispute_rate: (dispute_rate * 10.0).round() / 10.0,
        new_subscriptions: new_subs,
        churned_subscriptions: churned,
        active_subscribers: active_count,
        total_payments,
        avg_revenue_per_subscriber: Money::usd(avg_rev),
    })
}

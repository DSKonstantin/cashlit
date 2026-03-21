mod client;
mod mapper;
mod types;

use chrono::{DateTime, Utc};

use super::types::*;
use crate::error::AppError;
use client::StripeClient;

pub struct StripeProvider {
    client: StripeClient,
    config_id: String,
    display_name: String,
}

impl StripeProvider {
    pub fn new(api_key: String, config_id: String, display_name: String) -> Self {
        Self {
            client: StripeClient::new(api_key),
            config_id,
            display_name,
        }
    }
}

#[async_trait::async_trait]
impl PaymentProvider for StripeProvider {
    fn provider_type(&self) -> Provider {
        Provider::Stripe
    }

    fn display_name(&self) -> &str {
        &self.display_name
    }

    fn config_id(&self) -> &str {
        &self.config_id
    }

    async fn get_plans(&self) -> Result<Vec<Plan>, AppError> {
        let prices = self.client.get_prices().await?;
        Ok(prices.into_iter().map(|p| mapper::price_to_plan(p, &self.config_id)).collect())
    }

    async fn get_subscribers(&self) -> Result<Vec<Subscriber>, AppError> {
        let subs = self.client.get_subscriptions().await?;
        Ok(subs.into_iter().map(|s| mapper::subscription_to_subscriber(s, &self.config_id)).collect())
    }

    async fn get_payments(&self, since: DateTime<Utc>, until: DateTime<Utc>) -> Result<Vec<Payment>, AppError> {
        let charges = self.client.get_charges(since, until).await?;
        Ok(charges.into_iter().map(|c| mapper::charge_to_payment(c, &self.config_id)).collect())
    }

    async fn test_connection(&self) -> Result<bool, AppError> {
        self.client.test().await
    }
}

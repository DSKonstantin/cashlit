mod client;
mod mapper;
mod types;

use chrono::{DateTime, Utc};

use super::types::*;
use crate::error::AppError;
use client::PayPalClient;

pub struct PayPalProvider {
    client: PayPalClient,
    config_id: String,
    display_name: String,
}

impl PayPalProvider {
    pub fn new(
        client_id: String,
        client_secret: String,
        environment: Environment,
        config_id: String,
        display_name: String,
    ) -> Self {
        Self {
            client: PayPalClient::new(client_id, client_secret, environment),
            config_id,
            display_name,
        }
    }
}

#[async_trait::async_trait]
impl PaymentProvider for PayPalProvider {
    fn provider_type(&self) -> Provider {
        Provider::Paypal
    }

    fn display_name(&self) -> &str {
        &self.display_name
    }

    fn config_id(&self) -> &str {
        &self.config_id
    }

    async fn get_plans(&self) -> Result<Vec<Plan>, AppError> {
        let plans = self.client.get_plans().await?;
        Ok(plans.into_iter().map(|p| mapper::plan_to_unified(p, &self.config_id)).collect())
    }

    async fn get_subscribers(&self) -> Result<Vec<Subscriber>, AppError> {
        // PayPal doesn't have a simple list-all-subscribers endpoint
        Ok(vec![])
    }

    async fn get_payments(&self, since: DateTime<Utc>, until: DateTime<Utc>) -> Result<Vec<Payment>, AppError> {
        let txs = self.client.get_transactions(since, until).await?;
        Ok(txs.into_iter().map(|t| mapper::transaction_to_payment(t, &self.config_id)).collect())
    }

    async fn test_connection(&self) -> Result<bool, AppError> {
        self.client.test().await
    }
}

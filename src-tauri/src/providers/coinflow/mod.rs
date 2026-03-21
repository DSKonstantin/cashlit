mod client;
mod mapper;
mod types;

use chrono::{DateTime, Utc};

use super::types::*;
use crate::error::AppError;
use client::CoinflowClient;

pub struct CoinflowProvider {
    client: CoinflowClient,
    config_id: String,
    display_name: String,
}

impl CoinflowProvider {
    pub fn new(api_key: String, environment: Environment, config_id: String, display_name: String) -> Self {
        Self {
            client: CoinflowClient::new(api_key, environment),
            config_id,
            display_name,
        }
    }
}

#[async_trait::async_trait]
impl PaymentProvider for CoinflowProvider {
    fn provider_type(&self) -> Provider {
        Provider::Coinflow
    }

    fn display_name(&self) -> &str {
        &self.display_name
    }

    fn config_id(&self) -> &str {
        &self.config_id
    }

    async fn get_plans(&self) -> Result<Vec<Plan>, AppError> {
        let raw_plans = self.client.get_plans().await?;
        Ok(raw_plans
            .into_iter()
            .map(|p| mapper::plan_to_unified(p, &self.config_id))
            .collect())
    }

    async fn get_subscribers(&self) -> Result<Vec<Subscriber>, AppError> {
        let raw = self.client.get_subscribers().await?;
        Ok(raw
            .into_iter()
            .map(|s| mapper::subscriber_to_unified(s, &self.config_id))
            .collect())
    }

    async fn get_payments(
        &self,
        since: DateTime<Utc>,
        until: DateTime<Utc>,
    ) -> Result<Vec<Payment>, AppError> {
        // Fetch payments and refunds in parallel
        let (raw_payments, raw_refunds) = tokio::join!(
            self.client.get_payments(since, until),
            self.client.get_refunds(since, until)
        );

        let mut result: Vec<Payment> = raw_payments?
            .into_iter()
            .map(|p| mapper::payment_to_unified(p, &self.config_id))
            .collect();

        // Add refunds — match with original payments to get customer email
        if let Ok(refunds) = raw_refunds {
            println!("[Coinflow] Found {} refunds", refunds.len());
            for refund in refunds {
                let original_email = refund.payment_id.as_deref().and_then(|pid| {
                    result.iter().find(|p| p.provider_id == pid).and_then(|p| p.customer_email.clone())
                });
                let mut refund_payment = mapper::refund_to_unified(refund, &self.config_id);
                if refund_payment.customer_email.is_none() {
                    refund_payment.customer_email = original_email;
                }
                result.push(refund_payment);
            }
        }

        Ok(result)
    }

    async fn test_connection(&self) -> Result<bool, AppError> {
        self.client.get_plans().await?;
        Ok(true)
    }
}

use chrono::{DateTime, Utc};
use reqwest::Client;

use super::types::*;
use crate::error::AppError;
use crate::providers::types::Environment;

pub struct CoinflowClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl CoinflowClient {
    pub fn new(api_key: String, environment: Environment) -> Self {
        let base_url = match environment {
            Environment::Sandbox => "https://api-sandbox.coinflow.cash/api".to_string(),
            Environment::Production => "https://api.coinflow.cash/api".to_string(),
        };

        Self {
            client: Client::new(),
            base_url,
            api_key,
        }
    }

    pub async fn get_plans(&self) -> Result<Vec<CoinflowPlan>, AppError> {
        let url = format!("{}/merchant/subscription/plans", self.base_url);
        println!("[Coinflow] GET {}", url);

        let resp = self
            .client
            .get(&url)
            .header("Authorization", &self.api_key)
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        println!("[Coinflow] Plans response ({}): {}", status, &body[..body.len().min(500)]);

        if !status.is_success() {
            return Err(AppError::Provider(format!("Coinflow API error {}: {}", status, body)));
        }

        let plans: Vec<CoinflowPlan> = serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("Failed to parse plans: {} | Body: {}", e, &body[..body.len().min(300)])))?;
        Ok(plans)
    }

    pub async fn get_subscribers(&self) -> Result<Vec<CoinflowSubscriber>, AppError> {
        let url = format!("{}/merchant/subscription/subscribers", self.base_url);
        println!("[Coinflow] GET {}", url);

        let resp = self
            .client
            .get(&url)
            .header("Authorization", &self.api_key)
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        println!("[Coinflow] Subscribers response ({}): {}", status, &body[..body.len().min(500)]);

        if !status.is_success() {
            return Err(AppError::Provider(format!("Coinflow API error {}: {}", status, body)));
        }

        let subs: Vec<CoinflowSubscriber> = serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("Failed to parse subscribers: {} | Body: {}", e, &body[..body.len().min(300)])))?;
        Ok(subs)
    }

    pub async fn get_payments(
        &self,
        since: DateTime<Utc>,
        until: DateTime<Utc>,
    ) -> Result<Vec<CoinflowPayment>, AppError> {
        let since_ms = since.timestamp_millis().to_string();
        let until_ms = until.timestamp_millis().to_string();
        let url = format!("{}/merchant/payments", self.base_url);
        println!("[Coinflow] GET {} since={} until={}", url, since_ms, until_ms);

        let resp = self
            .client
            .get(&url)
            .header("Authorization", &self.api_key)
            .query(&[
                ("since", since_ms.as_str()),
                ("until", until_ms.as_str()),
                ("limit", "100"),
                ("page", "1"),
            ])
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        println!("[Coinflow] Payments response ({}): {}", status, &body[..body.len().min(1000)]);

        if !status.is_success() {
            return Err(AppError::Provider(format!("Coinflow API error {}: {}", status, body)));
        }

        let payments: Vec<CoinflowPayment> = serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("Failed to parse payments: {} | Body: {}", e, &body[..body.len().min(500)])))?;
        Ok(payments)
    }

    pub async fn get_refunds(
        &self,
        since: DateTime<Utc>,
        until: DateTime<Utc>,
    ) -> Result<Vec<CoinflowRefund>, AppError> {
        let since_ms = since.timestamp_millis().to_string();
        let until_ms = until.timestamp_millis().to_string();
        let url = format!("{}/refunds", self.base_url);
        println!("[Coinflow] GET {} since={} until={}", url, since_ms, until_ms);

        let resp = self
            .client
            .get(&url)
            .header("Authorization", &self.api_key)
            .query(&[
                ("since", since_ms.as_str()),
                ("until", until_ms.as_str()),
            ])
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        println!("[Coinflow] Refunds response ({}): {}", status, &body[..body.len().min(500)]);

        if !status.is_success() {
            // Refunds endpoint might not exist for all merchants, return empty
            println!("[Coinflow] Refunds endpoint returned {}, returning empty", status);
            return Ok(vec![]);
        }

        let refunds: Vec<CoinflowRefund> = serde_json::from_str(&body)
            .map_err(|e| {
                println!("[Coinflow] Failed to parse refunds: {}", e);
                AppError::Provider(format!("Failed to parse refunds: {}", e))
            })?;
        Ok(refunds)
    }
}

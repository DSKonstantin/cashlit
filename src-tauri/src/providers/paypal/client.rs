use chrono::{DateTime, Utc};
use reqwest::Client;

use super::types::*;
use crate::error::AppError;
use crate::providers::types::Environment;

pub struct PayPalClient {
    client: Client,
    base_url: String,
    client_id: String,
    client_secret: String,
}

impl PayPalClient {
    pub fn new(client_id: String, client_secret: String, environment: Environment) -> Self {
        let base_url = match environment {
            Environment::Sandbox => "https://api-m.sandbox.paypal.com".to_string(),
            Environment::Production => "https://api-m.paypal.com".to_string(),
        };
        Self {
            client: Client::new(),
            base_url,
            client_id,
            client_secret,
        }
    }

    async fn get_token(&self) -> Result<String, AppError> {
        let resp = self
            .client
            .post(format!("{}/v1/oauth2/token", self.base_url))
            .basic_auth(&self.client_id, Some(&self.client_secret))
            .form(&[("grant_type", "client_credentials")])
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            return Err(AppError::Provider(format!("PayPal auth error {}: {}", status, &body[..body.len().min(300)])));
        }

        let token: PayPalToken = serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("PayPal token parse: {}", e)))?;
        Ok(token.access_token)
    }

    async fn get<T: serde::de::DeserializeOwned>(&self, path: &str) -> Result<T, AppError> {
        let token = self.get_token().await?;
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .client
            .get(&url)
            .bearer_auth(&token)
            .header("Content-Type", "application/json")
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;
        if !status.is_success() {
            return Err(AppError::Provider(format!("PayPal API error {}: {}", status, &body[..body.len().min(300)])));
        }

        serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("PayPal parse: {} | {}", e, &body[..body.len().min(300)])))
    }

    pub async fn get_plans(&self) -> Result<Vec<PayPalPlan>, AppError> {
        let list: PayPalPlanList = self.get("/v1/billing/plans?page_size=20&page=1&total_required=true").await?;
        Ok(list.plans)
    }

    pub async fn get_transactions(&self, since: DateTime<Utc>, until: DateTime<Utc>) -> Result<Vec<PayPalTransaction>, AppError> {
        let start = since.format("%Y-%m-%dT%H:%M:%SZ");
        let end = until.format("%Y-%m-%dT%H:%M:%SZ");
        let path = format!(
            "/v1/reporting/transactions?start_date={}&end_date={}&fields=transaction_info,payer_info,shipping_info&page_size=100&page=1",
            start, end
        );
        let list: PayPalTransactionList = self.get(&path).await?;
        Ok(list.transaction_details)
    }

    pub async fn test(&self) -> Result<bool, AppError> {
        self.get_token().await?;
        Ok(true)
    }
}

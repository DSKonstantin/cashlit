use chrono::{DateTime, Utc};
use reqwest::Client;

use super::types::*;
use crate::error::AppError;

pub struct StripeClient {
    client: Client,
    api_key: String,
}

impl StripeClient {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    async fn get<T: serde::de::DeserializeOwned>(&self, path: &str, query: &[(&str, &str)]) -> Result<T, AppError> {
        let url = format!("https://api.stripe.com/v1{}", path);
        let resp = self
            .client
            .get(&url)
            .basic_auth(&self.api_key, None::<&str>)
            .query(query)
            .send()
            .await?;

        let status = resp.status();
        let body = resp.text().await?;

        if !status.is_success() {
            return Err(AppError::Provider(format!("Stripe API error {}: {}", status, &body[..body.len().min(300)])));
        }

        serde_json::from_str(&body)
            .map_err(|e| AppError::Provider(format!("Stripe parse error: {} | {}", e, &body[..body.len().min(300)])))
    }

    pub async fn get_prices(&self) -> Result<Vec<StripePrice>, AppError> {
        let list: StripeList<StripePrice> = self.get("/prices", &[
            ("limit", "100"),
            ("active", "true"),
            ("type", "recurring"),
            ("expand[]", "data.product"),
        ]).await?;
        Ok(list.data)
    }

    pub async fn get_subscriptions(&self) -> Result<Vec<StripeSubscription>, AppError> {
        let list: StripeList<StripeSubscription> = self.get("/subscriptions", &[
            ("limit", "100"),
            ("expand[]", "data.items.data.price"),
        ]).await?;
        Ok(list.data)
    }

    pub async fn get_charges(&self, since: DateTime<Utc>, until: DateTime<Utc>) -> Result<Vec<StripeCharge>, AppError> {
        let since_ts = since.timestamp().to_string();
        let until_ts = until.timestamp().to_string();
        let list: StripeList<StripeCharge> = self.get("/charges", &[
            ("limit", "100"),
            ("created[gte]", &since_ts),
            ("created[lte]", &until_ts),
        ]).await?;
        Ok(list.data)
    }

    pub async fn test(&self) -> Result<bool, AppError> {
        let _: serde_json::Value = self.get("/balance", &[]).await?;
        Ok(true)
    }
}

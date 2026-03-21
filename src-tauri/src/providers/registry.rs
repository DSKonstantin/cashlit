use chrono::{DateTime, Utc};

use super::types::*;
use crate::error::AppError;

pub struct ProviderRegistry {
    providers: Vec<Box<dyn PaymentProvider>>,
    configs: Vec<ProviderConfig>,
}

impl ProviderRegistry {
    pub fn new() -> Self {
        Self {
            providers: Vec::new(),
            configs: Vec::new(),
        }
    }

    pub fn add(&mut self, provider: Box<dyn PaymentProvider>, config: ProviderConfig) {
        self.providers.push(provider);
        self.configs.push(config);
    }

    pub fn remove(&mut self, config_id: &str) {
        self.providers.retain(|p| p.config_id() != config_id);
        self.configs.retain(|c| c.id != config_id);
    }

    pub fn configs(&self) -> &[ProviderConfig] {
        &self.configs
    }

    pub async fn get_all_plans(
        &self,
        provider_filter: Option<&Provider>,
    ) -> Result<Vec<Plan>, AppError> {
        let mut all = Vec::new();
        for p in &self.providers {
            if let Some(filter) = provider_filter {
                if &p.provider_type() != filter {
                    continue;
                }
            }
            match p.get_plans().await {
                Ok(plans) => all.extend(plans),
                Err(e) => eprintln!("Error fetching plans from {}: {}", p.display_name(), e),
            }
        }
        Ok(all)
    }

    pub async fn get_all_subscribers(
        &self,
        provider_filter: Option<&Provider>,
    ) -> Result<Vec<Subscriber>, AppError> {
        let mut all = Vec::new();
        for p in &self.providers {
            if let Some(filter) = provider_filter {
                if &p.provider_type() != filter {
                    continue;
                }
            }
            match p.get_subscribers().await {
                Ok(subs) => all.extend(subs),
                Err(e) => eprintln!("Error fetching subscribers from {}: {}", p.display_name(), e),
            }
        }
        Ok(all)
    }

    pub async fn get_all_payments(
        &self,
        since: DateTime<Utc>,
        until: DateTime<Utc>,
        provider_filter: Option<&Provider>,
    ) -> Result<Vec<Payment>, AppError> {
        let mut all = Vec::new();
        for p in &self.providers {
            if let Some(filter) = provider_filter {
                if &p.provider_type() != filter {
                    continue;
                }
            }
            match p.get_payments(since, until).await {
                Ok(payments) => all.extend(payments),
                Err(e) => eprintln!("Error fetching payments from {}: {}", p.display_name(), e),
            }
        }
        Ok(all)
    }

    pub fn find_provider(&self, config_id: &str) -> Option<&dyn PaymentProvider> {
        self.providers
            .iter()
            .find(|p| p.config_id() == config_id)
            .map(|p| p.as_ref())
    }
}

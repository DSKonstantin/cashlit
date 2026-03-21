use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::credentials::CredentialStore;
use crate::providers::coinflow::CoinflowProvider;
use crate::providers::paypal::PayPalProvider;
use crate::providers::registry::ProviderRegistry;
use crate::providers::stripe::StripeProvider;
use crate::providers::types::*;

const CONFIG_FILE: &str = "providers.json";
const PROJECTS_FILE: &str = "projects.json";

pub struct AppState {
    pub registry: Arc<RwLock<ProviderRegistry>>,
    pub projects: Arc<RwLock<Vec<Project>>>,
    pub credentials: CredentialStore,
    pub data_dir: PathBuf,
}

impl AppState {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let config_path = app_data_dir.join(CONFIG_FILE);
        let projects_path = app_data_dir.join(PROJECTS_FILE);
        let credentials = CredentialStore::new(&app_data_dir);
        let mut registry = ProviderRegistry::new();

        if let Ok(data) = std::fs::read_to_string(&config_path) {
            if let Ok(configs) = serde_json::from_str::<Vec<ProviderConfig>>(&data) {
                for config in configs {
                    if let Ok(api_key) = credentials.get(&config.id) {
                        let provider: Box<dyn PaymentProvider> = match config.provider {
                            Provider::Coinflow => Box::new(CoinflowProvider::new(
                                api_key,
                                config.environment.clone(),
                                config.id.clone(),
                                config.display_name.clone(),
                            )),
                            Provider::Stripe => Box::new(StripeProvider::new(
                                api_key,
                                config.id.clone(),
                                config.display_name.clone(),
                            )),
                            Provider::Paypal => {
                                let secret = credentials
                                    .get(&format!("{}-secret", config.id))
                                    .unwrap_or_default();
                                Box::new(PayPalProvider::new(
                                    api_key,
                                    secret,
                                    config.environment.clone(),
                                    config.id.clone(),
                                    config.display_name.clone(),
                                ))
                            }
                        };
                        registry.add(provider, config);
                    }
                }
                println!("[State] Restored {} provider(s)", registry.configs().len());
            }
        }

        let projects = std::fs::read_to_string(&projects_path)
            .ok()
            .and_then(|data| serde_json::from_str::<Vec<Project>>(&data).ok())
            .unwrap_or_default();
        println!("[State] Restored {} project(s)", projects.len());

        Self {
            registry: Arc::new(RwLock::new(registry)),
            projects: Arc::new(RwLock::new(projects)),
            credentials,
            data_dir: app_data_dir,
        }
    }

    pub fn save_configs(&self, configs: &[ProviderConfig]) {
        save_json(&self.data_dir.join(CONFIG_FILE), configs);
    }

    pub fn save_projects(&self, projects: &[Project]) {
        save_json(&self.data_dir.join(PROJECTS_FILE), projects);
    }
}

fn save_json<T: serde::Serialize + ?Sized>(path: &PathBuf, data: &T) {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(data) {
        if let Err(e) = std::fs::write(path, json) {
            eprintln!("[State] Failed to save {}: {}", path.display(), e);
        }
    }
}

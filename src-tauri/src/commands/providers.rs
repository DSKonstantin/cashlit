use tauri::State;

use crate::error::AppError;
use crate::providers::coinflow::CoinflowProvider;
use crate::providers::paypal::PayPalProvider;
use crate::providers::stripe::StripeProvider;
use crate::providers::types::*;
use crate::state::AppState;

fn mask_key(key: &str) -> String {
    if key.len() <= 8 {
        "••••••••".to_string()
    } else {
        format!("{}••••{}", &key[..4], &key[key.len() - 4..])
    }
}

fn create_provider(
    config: &NewProviderConfig,
    config_id: &str,
) -> Result<Box<dyn PaymentProvider>, AppError> {
    match config.provider {
        Provider::Coinflow => Ok(Box::new(CoinflowProvider::new(
            config.api_key.clone(),
            config.environment.clone(),
            config_id.to_string(),
            config.display_name.clone(),
        ))),
        Provider::Stripe => Ok(Box::new(StripeProvider::new(
            config.api_key.clone(),
            config_id.to_string(),
            config.display_name.clone(),
        ))),
        Provider::Paypal => {
            let secret = config.api_secret.clone().ok_or_else(|| {
                AppError::Provider("PayPal requires both Client ID and Client Secret".to_string())
            })?;
            Ok(Box::new(PayPalProvider::new(
                config.api_key.clone(),
                secret,
                config.environment.clone(),
                config_id.to_string(),
                config.display_name.clone(),
            )))
        }
    }
}

#[tauri::command]
pub async fn get_providers(state: State<'_, AppState>) -> Result<Vec<ProviderConfig>, AppError> {
    let registry = state.registry.read().await;
    Ok(registry.configs().to_vec())
}

#[tauri::command]
pub async fn add_provider(
    state: State<'_, AppState>,
    config: NewProviderConfig,
) -> Result<ProviderConfig, AppError> {
    let config_id = uuid::Uuid::new_v4().to_string();
    let masked = mask_key(&config.api_key);

    // Store keys in file-based credential store
    state.credentials.set(&config_id, &config.api_key);
    if let Some(ref secret) = config.api_secret {
        state.credentials.set(&format!("{}-secret", config_id), secret);
    }

    let provider = create_provider(&config, &config_id)?;

    let provider_config = ProviderConfig {
        id: config_id,
        provider: config.provider,
        environment: config.environment,
        display_name: config.display_name,
        connected: true,
        masked_key: masked,
    };

    let mut registry = state.registry.write().await;
    registry.add(provider, provider_config.clone());
    state.save_configs(registry.configs());

    Ok(provider_config)
}

#[tauri::command]
pub async fn test_provider(config: NewProviderConfig) -> Result<bool, AppError> {
    let provider = create_provider(&config, "test")?;
    provider.test_connection().await
}

#[tauri::command]
pub async fn remove_provider(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    state.credentials.delete(&id);

    let mut registry = state.registry.write().await;
    registry.remove(&id);
    state.save_configs(registry.configs());
    Ok(())
}

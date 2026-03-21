use crate::auth;
use crate::error::AppError;

#[tauri::command]
pub async fn authenticate() -> Result<bool, AppError> {
    // Run on blocking thread since LAContext uses sync callbacks
    let result = tokio::task::spawn_blocking(|| {
        auth::authenticate("Authenticate to access Cashlit")
    })
    .await
    .map_err(|e| AppError::Provider(format!("Auth task failed: {}", e)))?;

    result
}

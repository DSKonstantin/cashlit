use std::collections::HashMap;
use std::path::{Path, PathBuf};

use crate::error::AppError;

const CREDENTIALS_FILE: &str = "credentials.json";

/// File-based credential store. Stores API keys in a JSON file
/// in the app data directory. No Keychain prompts.
pub struct CredentialStore {
    path: PathBuf,
}

impl CredentialStore {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join(CREDENTIALS_FILE),
        }
    }

    fn load(&self) -> HashMap<String, String> {
        std::fs::read_to_string(&self.path)
            .ok()
            .and_then(|data| serde_json::from_str(&data).ok())
            .unwrap_or_default()
    }

    fn save(&self, map: &HashMap<String, String>) {
        if let Some(parent) = self.path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string_pretty(map) {
            let _ = std::fs::write(&self.path, json);
        }
    }

    pub fn get(&self, key: &str) -> Result<String, AppError> {
        self.load()
            .get(key)
            .cloned()
            .ok_or_else(|| AppError::Config(format!("Credential not found: {}", key)))
    }

    pub fn set(&self, key: &str, value: &str) {
        let mut map = self.load();
        map.insert(key.to_string(), value.to_string());
        self.save(&map);
    }

    pub fn delete(&self, key: &str) {
        let mut map = self.load();
        map.remove(key);
        // Also remove -secret variant
        map.remove(&format!("{}-secret", key));
        self.save(&map);
    }
}

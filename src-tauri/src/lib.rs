mod auth;
mod commands;
mod credentials;
mod error;
mod providers;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Get app data dir for config persistence
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&data_dir).ok();

            let app_state = AppState::new(data_dir);
            app.manage(app_state);

            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    None,
                    Some(12.0),
                )
                .expect("Failed to apply vibrancy");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::analytics::get_analytics,
            commands::analytics::get_plans,
            commands::analytics::get_subscribers,
            commands::analytics::get_payments,
            commands::providers::get_providers,
            commands::providers::add_provider,
            commands::providers::test_provider,
            commands::providers::remove_provider,
            commands::projects::get_projects,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,
            commands::auth::authenticate,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

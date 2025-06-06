use std::sync::Mutex;

use argon2::Argon2;
use tauri::{Manager, State};

#[derive(Default)]
struct AppState {
    key: [u8; 32],
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn derive_encryption_key(
    username: &str,
    password: &str,
    app_state: State<Mutex<AppState>>,
) -> Result<(), String> {
    let mut app_state = app_state.lock().unwrap();

    let mut username_bytes = username.as_bytes().to_vec();
    if username_bytes.len() < 16 {
        username_bytes.resize(16, 0);
    }

    Argon2::default()
        .hash_password_into(
            password.as_bytes(),
            username_bytes.as_slice(),
            &mut app_state.key,
        )
        .unwrap();

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![derive_encryption_key])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

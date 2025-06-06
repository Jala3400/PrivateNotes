use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
use argon2::Argon2;
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;

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

    // Use the username as the salt for Argon2, min length is 16 bytes
    let mut username_bytes = username.as_bytes().to_vec();
    if username_bytes.len() < 16 {
        username_bytes.resize(16, 0);
    }

    // Derive a 32-byte key using Argon2
    Argon2::default()
        .hash_password_into(
            password.as_bytes(),
            username_bytes.as_slice(),
            &mut app_state.key,
        )
        .unwrap();

    Ok(())
}

#[tauri::command]
fn save_encrypted_note(
    title: &str,
    content: &str,
    app_state: State<Mutex<AppState>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let app_state = app_state.lock().unwrap();

    // Generate a random nonce for this encryption
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher instance
    let cipher = Aes256Gcm::new_from_slice(&app_state.key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Encrypt the content
    let encrypted_content = cipher
        .encrypt(nonce, content.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Create the data to save (nonce + encrypted content)
    let mut file_data = Vec::new();
    file_data.extend_from_slice(&nonce_bytes);
    file_data.extend_from_slice(&encrypted_content);

    // Show save dialog
    let file_path = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title))
        .blocking_save_file();

    // If the user selected a file, write the encrypted data to it
    if let Some(path) = file_path {
        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    } else {
        return Err("Save cancelled".to_string());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            derive_encryption_key,
            save_encrypted_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

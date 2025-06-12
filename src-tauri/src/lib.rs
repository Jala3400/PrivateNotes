use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
use argon2::Argon2;
use std::{path::PathBuf, sync::Mutex};
use tauri::{DragDropEvent, Emitter, Manager, State, Window, WindowEvent};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
struct AppState {
    key: Option<[u8; 32]>,
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
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), username_bytes.as_slice(), &mut key)
        .unwrap();

    app_state.key = Some(key);

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

    // Ensure the encryption key is set
    let Some(key) = &app_state.key else {
        return Err("Log in first".to_string());
    };

    // Generate a random nonce for this encryption
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher instance
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {}", e))?;

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

fn open_encrypted_note(
    file_path: &str,
    app_state: State<Mutex<AppState>>,
) -> Result<String, String> {
    let app_state = app_state.lock().unwrap();

    // Ensure the encryption key is set
    let Some(key) = &app_state.key else {
        return Err("Log in first".to_string());
    };

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Extract nonce and encrypted content
    if file_data.len() < 12 {
        return Err("File is too short".to_string());
    }
    let nonce_bytes = &file_data[..12];
    let encrypted_content = &file_data[12..];

    // Create nonce from bytes
    let nonce = Nonce::from_slice(nonce_bytes);

    // Create cipher instance
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Decrypt the content
    let decrypted_content = cipher
        .decrypt(nonce, encrypted_content)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    Ok(String::from_utf8(decrypted_content).unwrap_or_default())
}

fn open_from_path(file_path: &PathBuf, window: &Window) {
    // Check if the file path ends with .lockd
    if file_path.extension().and_then(|s| s.to_str()) == Some("lockd") {
        // Check if there's another extension before .lockd (e.g., .txt.lockd)
        let file_stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        if PathBuf::from(file_stem).extension().is_some() {
            // File has format like "name.txt.lockd" - call another function
            if let Err(err) = decrypt_file(
                file_path,
                window.state::<Mutex<AppState>>(),
                window.app_handle(),
            ) {
                window.emit("error", err).unwrap();
            }
        } else {
            // File has format like "name.lockd" - open as encrypted note
            let app_state = window.state::<Mutex<AppState>>();
            match open_encrypted_note(file_path.to_str().unwrap(), app_state) {
                // If successful, emit the content to the frontend
                Ok(content) => {
                    let title = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    window.emit("note-opened", (title, content)).unwrap();
                }
                // If an error occurs, emit the error message
                Err(err) => {
                    window.emit("error", err).unwrap();
                }
            }
        }
    } else {
        // If the file type is not .lockd, encrypt the file
        let app_state = window.state::<Mutex<AppState>>();
        let app_handle = window.app_handle();
        if let Err(err) = encrypt_file(file_path, app_state, app_handle) {
            window.emit("error", err).unwrap();
        }
    }
}

fn encrypt_file(
    file_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let app_state = app_state.lock().unwrap();

    // Ensure the encryption key is set
    let Some(key) = &app_state.key else {
        return Err("Log in first".to_string());
    };

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Generate a random nonce for this encryption
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher instance
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Encrypt the content
    let encrypted_content = cipher
        .encrypt(nonce, file_data.as_slice())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Create the data to save (nonce + encrypted content)
    let mut file_data = Vec::new();
    file_data.extend_from_slice(&nonce_bytes);
    file_data.extend_from_slice(&encrypted_content);

    // Show save dialog
    let title = file_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("encrypted_file");

    let file_path = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title))
        .set_directory(file_path.parent().unwrap_or(file_path.as_path()))
        .blocking_save_file();

    // Write the encrypted data back to the file
    if let Some(path) = file_path {
        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }

    Ok(())
}

fn decrypt_file(
    file_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let app_state = app_state.lock().unwrap();

    // Ensure the encryption key is set
    let Some(key) = &app_state.key else {
        return Err("Log in first".to_string());
    };

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Extract nonce and encrypted content
    if file_data.len() < 12 {
        return Err("File is too short".to_string());
    }
    let nonce_bytes = &file_data[..12];
    let encrypted_content = &file_data[12..];

    // Create nonce from bytes
    let nonce = Nonce::from_slice(nonce_bytes);

    // Create cipher instance
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Decrypt the content
    let decrypted_content = cipher
        .decrypt(nonce, encrypted_content)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    // Get the original filename without .lockd extension
    let original_filename = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("decrypted_file");

    // Show save dialog
    let save_path = app_handle
        .dialog()
        .file()
        .set_file_name(original_filename)
        .set_directory(file_path.parent().unwrap_or(file_path.as_path()))
        .blocking_save_file();

    // Write the decrypted data to the chosen location
    if let Some(path) = save_path {
        std::fs::write(path.as_path().unwrap(), decrypted_content)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| match event {
            // Drag and drop event handling
            WindowEvent::DragDrop(e) => match e {
                // When a file is dropped
                DragDropEvent::Drop { paths, .. } => {
                    if let Some(path) = paths.first() {
                        open_from_path(path, window);
                    }
                }
                _ => {}
            },
            _ => {}
        })
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

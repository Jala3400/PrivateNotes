use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;

use crate::{
    encryption::{decrypt_data, encrypt_data},
    notes::open_encrypted_note,
    state::AppState,
};

/// Opens a file from the given path, handling both encrypted and non-encrypted files.
pub fn open_from_path(file_path: &PathBuf, window: &Window) {
    // Check if the file path ends with .lockd
    if file_path.extension().and_then(|s| s.to_str()) == Some("lockd") {
        // Check if there's another extension before .lockd (e.g., .txt.lockd)
        let file_stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

        if PathBuf::from(file_stem).extension().is_some() {
            // File has format like "name.txt.lockd" - decrypt the file
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

/// Encrypts a file at the given path and saves it with a .lockd extension.
pub fn encrypt_file(
    file_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Encrypt the content using the shared utility function
    let encrypted_data = encrypt_data(&key, &file_data)?;

    // Show save dialog
    let title = file_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("encrypted_file");

    let save_path = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title))
        .set_directory(file_path.parent().unwrap_or(file_path.as_path()))
        .blocking_save_file();

    // Write the encrypted data back to the file
    if let Some(path) = save_path {
        std::fs::write(path.as_path().unwrap(), encrypted_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }

    Ok(())
}

pub fn decrypt_file(
    file_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Decrypt the content using the shared utility function
    let decrypted_content = decrypt_data(&key, &file_data)?;

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

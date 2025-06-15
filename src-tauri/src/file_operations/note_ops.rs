use crate::{encryption::decrypt_data, state::AppState};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, State, Window};

/// Opens an encrypted note and emits the content to the frontend
pub fn open_encrypted_note_and_emit(
    file_path: &PathBuf,
    window: &Window,
    app_state: State<Mutex<AppState>>,
) -> Result<(), String> {
    let file_path_str = file_path.to_str().ok_or("Invalid file path encoding")?;

    // Save the fiel path
    app_state
        .lock()
        .unwrap()
        .set_path(file_path_str.to_string());

    let content = open_encrypted_note(file_path_str, app_state)?;

    let title = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");

    window
        .emit("note-opened", (title, content))
        .map_err(|e| format!("Failed to emit event: {}", e))
}

/// Opens an encrypted note from the specified file path and returns its decrypted content.
pub fn open_encrypted_note(
    file_path: &str,
    app_state: State<Mutex<AppState>>,
) -> Result<String, String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Decrypt the content
    let decrypted_content = decrypt_data(&key, &file_data)?;

    Ok(String::from_utf8(decrypted_content).unwrap_or_default())
}

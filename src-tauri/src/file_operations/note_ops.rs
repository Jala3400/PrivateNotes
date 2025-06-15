use crate::{
    encryption::decrypt_data,
    file_operations::encryption_ops::{decrypt_file, decrypt_folder, encrypt_file, encrypt_folder},
    state::AppState,
};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, State, Window};

/// Opens a file from the given path, handling both encrypted and non-encrypted files.
pub fn open_from_path(file_path: &PathBuf, window: &Window) -> Result<(), String> {
    let app_state = window.state::<Mutex<AppState>>();
    let app_handle = window.app_handle();

    // Cache the extension check
    let is_lockd = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map_or(false, |ext| ext == "lockd");

    match (is_lockd, file_path.is_dir()) {
        // .lockd directory - decrypt folder
        (true, true) => decrypt_folder(file_path, app_state, app_handle),

        // .lockd file - check if it's a double extension or encrypted note
        (true, false) => handle_lockd_file(file_path, window, app_state, app_handle),

        // Regular directory - encrypt folder
        (false, true) => encrypt_folder(file_path, app_state, app_handle),

        // Regular file - encrypt file
        (false, false) => encrypt_file(file_path, app_state, app_handle),
    }
}

/// Handles .lockd files, determining whether they are encrypted notes or regular encrypted files
fn handle_lockd_file(
    file_path: &PathBuf,
    window: &Window,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Extract file stem once and check for double extension
    let file_stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

    // Check if file has double extension (e.g., "document.txt.lockd")
    if PathBuf::from(file_stem).extension().is_some() {
        // Double extension - decrypt as regular file
        decrypt_file(file_path, app_state, app_handle)
    } else {
        // Single extension - open as encrypted note
        open_encrypted_note_and_emit(file_path, window, app_state)
    }
}

/// Opens an encrypted note and emits the content to the frontend
pub fn open_encrypted_note_and_emit(
    file_path: &PathBuf,
    window: &Window,
    app_state: State<Mutex<AppState>>,
) -> Result<(), String> {
    let file_path_str = file_path.to_str().ok_or("Invalid file path encoding")?;

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

    // Save the fiel path
    app_state.lock().unwrap().set_last_path(file_path.to_string());

    Ok(String::from_utf8(decrypted_content).unwrap_or_default())
}

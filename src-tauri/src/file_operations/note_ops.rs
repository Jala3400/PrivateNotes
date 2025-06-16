use crate::{
    encryption::decrypt_data,
    state::{AppState, FileSystemItem},
};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, State, Window};

/// Opens an encrypted note and emits the content to the frontend
pub fn open_dropped_note(
    file_path: &PathBuf,
    window: &Window,
    app_state: State<Mutex<AppState>>,
) -> Result<(), String> {
    // Open the note and emit its content
    open_note_and_emit(file_path, window, &app_state)?;

    let file_path_str = file_path
        .to_str()
        .ok_or("Invalid file path encoding")?
        .to_string();

    let id = app_state
        .lock()
        .unwrap()
        .add_path_mapping(file_path_str.clone());

    // Create a FileSystemItem for the current note
    let current_note = FileSystemItem {
        id,
        parent_id: None, // No parent for single notes
        name: file_path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown Note")
            .to_string(),
        path: file_path_str,
        is_directory: false,
        is_note: true,
        children: None,
    };

    // Add the opened note to the app state and get frontend version
    let frontend_note = {
        let mut state = app_state.lock().unwrap();
        state.add_opened_item(current_note.clone());
        state.to_frontend_item(&current_note)
    };

    window
        .emit("item-opened", frontend_note)
        .map_err(|e| format!("Failed to emit event: {}", e))
}

/// Opens a note without adding items
pub fn open_note_and_emit(
    file_path: &PathBuf,
    window: &Window,
    app_state: &State<Mutex<AppState>>,
) -> Result<(), String> {
    let file_path_str = file_path.to_str().ok_or("Invalid file path encoding")?;

    // Save the file path
    app_state
        .lock()
        .unwrap()
        .set_path(file_path_str.to_string());

    // Decrypt the note
    let content = open_encrypted_note(file_path_str, &app_state)?;

    let title = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");

    window
        .emit("note-opened", (title, content))
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

/// Opens an encrypted note from the specified file path and returns its decrypted content.
pub fn open_encrypted_note(
    file_path: &str,
    app_state: &State<Mutex<AppState>>,
) -> Result<String, String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Read the file content
    let file_data = std::fs::read(file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Decrypt the content
    let decrypted_content = decrypt_data(&key, &file_data)?;

    Ok(String::from_utf8(decrypted_content).unwrap_or_default())
}

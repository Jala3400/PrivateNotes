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
    let file_path_str = file_path
        .to_str()
        .ok_or("Invalid file path encoding")?
        .to_string();

    // Check if the file path is already opened
    // You cant put this in the if statement because it causes a deadlock
    let existing_id = app_state.lock().unwrap().is_opened(file_path_str.clone());

    // Check if the note is already opened
    let id = if let Some(existing_id) = existing_id {
        existing_id
    } else {
        // If not opened, generate a new ID and add to mapping
        let id = app_state
            .lock()
            .unwrap()
            .add_path_mapping(file_path_str.clone());

        // Create a FileSystemItem for the current note
        let current_note = FileSystemItem {
            id: id.clone(),
            parent_id: None,
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

        // Add the opened note to the app state
        {
            let mut state = app_state.lock().unwrap();
            state.add_opened_item(&current_note);
            let frontend_note = state.to_frontend_item(&current_note);
            drop(state); // Release lock before emit

            // Emit the event to the frontend
            window
                .emit("item-opened", frontend_note)
                .map_err(|e| format!("Failed to emit event: {}", e))?;
        }

        id
    };

    // Open the note and emit the content
    open_note_and_emit(id, file_path, window, &app_state)?;

    Ok(())
}

/// Opens a note without adding items
pub fn open_note_and_emit(
    id: String,
    file_path: &PathBuf,
    window: &Window,
    app_state: &State<Mutex<AppState>>,
) -> Result<(), String> {
    let file_path_str = file_path.to_str().ok_or("Invalid file path encoding")?;

    // Decrypt the note
    let content = open_encrypted_note(file_path_str, &app_state)?;

    let title = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");

    window
        .emit("note-opened", (title, content, id))
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

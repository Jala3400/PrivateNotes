use crate::file_operations::note_ops::open_note_and_emit;
use crate::state::FileSystemItem;
use crate::{encryption::encrypt_data, state::AppState};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, State, Window};
use tauri_plugin_dialog::DialogExt;

/// Tauri command to get opened items
#[tauri::command]
pub fn get_opened_items(app_state: State<Mutex<AppState>>) -> Result<Vec<FileSystemItem>, String> {
    let state = app_state.lock().unwrap();
    Ok(state.get_opened_items())
}

/// Tauri command to close a item
#[tauri::command]
pub fn close_item(
    item_path: String,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    app_state.lock().unwrap().remove_opened_item(&item_path);

    // Emit event to frontend
    window
        .emit("item-closed", item_path)
        .map_err(|e| format!("Failed to emit item-closed event: {}", e))?;

    Ok(())
}

/// Tauri command to open a note from a item
#[tauri::command]
pub fn open_note_from_path(
    note_path: String,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    let path = PathBuf::from(&note_path);
    open_note_and_emit(&path, &window, &app_state)
}

#[tauri::command]
/// Encrypts a note and saves it to a file with the specified title.
pub fn save_note_as(
    title: &str,
    content: &str,
    app_state: State<Mutex<AppState>>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Encrypt the content
    let file_data = encrypt_data(&key, content.as_bytes())?;

    // Configure the file dialog
    let mut dialog = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title));

    // Set the initial directory to the last saved path if available
    let file_path = app_state.lock().unwrap().get_path();
    if let Some(path) = &file_path {
        let path_buf = std::path::Path::new(path);
        dialog = dialog.set_directory(path_buf.parent().unwrap_or(path_buf));
    }

    // Open the save file dialog
    let file_path = dialog.blocking_save_file();

    // If the user selected a file, write the encrypted data to it
    // It is Ok to cancel the dialog
    if let Some(path) = file_path {
        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
/// Encrypts a note and saves it to a given path.
pub fn save_note(content: &str, app_state: State<Mutex<AppState>>) -> Result<(), String> {
    // Get the encryption key
    let key = app_state
        .lock()
        .unwrap()
        .get_encryption_key()
        .map_err(|e| e.to_string())?;

    // Encrypt the content
    let file_data = encrypt_data(&key, content.as_bytes()).map_err(|e| e.to_string())?;

    // Create the path if it doesn't exist
    let file_path = app_state.lock().unwrap().get_path().unwrap();
    let path_buf = PathBuf::from(file_path);
    if let Some(parent) = path_buf.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Write the encrypted data to the file
    std::fs::write(path_buf, file_data).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

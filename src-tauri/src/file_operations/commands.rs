use crate::{encryption::encrypt_data, state::AppState};
use crate::{file_operations::note_ops::open_encrypted_note_and_emit, state::OpenedFolder};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use tauri::{Emitter, Window};
use tauri_plugin_dialog::DialogExt;

/// Tauri command to get opened folders
#[tauri::command]
pub fn get_opened_folders(app_state: State<Mutex<AppState>>) -> Result<Vec<OpenedFolder>, String> {
    let state = app_state.lock().unwrap();
    Ok(state.get_opened_folders())
}

/// Tauri command to close a folder
#[tauri::command]
pub fn close_folder(
    folder_path: String,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    app_state.lock().unwrap().remove_opened_folder(&folder_path);

    // Emit event to frontend
    window
        .emit("folder-closed", folder_path)
        .map_err(|e| format!("Failed to emit folder-closed event: {}", e))?;

    Ok(())
}

/// Tauri command to open a note from a folder
#[tauri::command]
pub fn open_note_from_folder(
    note_path: String,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    let path = PathBuf::from(&note_path);
    open_encrypted_note_and_emit(&path, &window, app_state)
}

#[tauri::command]
/// Encrypts a note and saves it to a file with the specified title.
pub fn save_encrypted_note(
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
    if let Some(path) = file_path {
        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    } else {
        return Err("Save cancelled".to_string());
    }

    Ok(())
}

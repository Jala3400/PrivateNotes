use crate::encryption::encrypt_data;
use crate::file_operations::note_ops::{open_note_and_emit, open_note_from_path};
use crate::state::{AppState, FileSystemItemFrontend};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;

/// Tauri command to get opened items
#[tauri::command]
pub fn get_opened_items(
    app_state: State<Mutex<AppState>>,
) -> Result<Vec<FileSystemItemFrontend>, String> {
    let state = app_state.lock().unwrap();
    Ok(state.get_opened_items())
}

/// Tauri command to close a item
#[tauri::command]
pub fn close_item(
    id: String,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    app_state.lock().unwrap().remove_opened_item(&id);

    // Emit event to frontend
    window
        .emit("item-closed", id)
        .map_err(|e| format!("Failed to emit item-closed event: {}", e))?;

    Ok(())
}

/// Tauri command to open a note from a item
#[tauri::command]
pub fn open_note_from_id(
    id: &str,
    parent_id: &str,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    // Get the actual file path from the ID
    let note_path = {
        let state = app_state.lock().unwrap();
        state.get_path_from_id(&id).ok_or("Note not found")?
    };

    let path = PathBuf::from(&note_path);
    open_note_and_emit(
        id.to_string(),
        parent_id.to_string(),
        &path,
        &window,
        &app_state,
    )
}

#[tauri::command]
/// Encrypts a note and saves it to a given path.
pub fn save_note(id: &str, content: &str, app_state: State<Mutex<AppState>>) -> Result<(), String> {
    // Get the encryption key
    let key = app_state
        .lock()
        .unwrap()
        .get_encryption_key()
        .map_err(|e| e.to_string())?;

    // Create the path if it doesn't exist
    let file_path = app_state.lock().unwrap().get_path_from_id(id).unwrap();
    let path_buf = PathBuf::from(file_path);
    if let Some(parent) = path_buf.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Encrypt the content
    let file_data = encrypt_data(&key, content.as_bytes()).map_err(|e| e.to_string())?;

    // Write the encrypted data to the file
    std::fs::write(path_buf, file_data).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

#[tauri::command]
/// Encrypts a note and saves it to a path to be specified by the user, no id is required.
/// Then the id is added to the opened items in the app state.
pub fn save_note_as(
    id: Option<&str>,
    title: &str,
    content: &str,
    app_state: State<Mutex<AppState>>,
    app_handle: AppHandle,
    window: Window,
) -> Result<bool, String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Configure the file dialog
    let mut dialog = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title));

    if let Some(id) = id {
        // Set the initial directory to the last saved path if available
        let file_path = app_state.lock().unwrap().get_path_from_id(id);
        if let Some(path) = &file_path {
            let path_buf = std::path::Path::new(path);
            dialog = dialog.set_directory(path_buf.parent().unwrap_or(path_buf));
        }
    }

    // Open the save file dialog
    let file_path = dialog.blocking_save_file();

    // If the user selected a file, write the encrypted data to it
    if let Some(path) = file_path {
        // Encrypt the content
        let file_data = encrypt_data(&key, content.as_bytes())?;

        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        // Immediately open the note from the path to add it to the opened items
        // and emit the event to the frontend
        open_note_from_path(&path.as_path().unwrap().to_path_buf(), &window, app_state)?;

        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
/// Encrypts a note and saves it to a file with the specified title.
pub fn save_note_copy(
    id: Option<&str>,
    title: &str,
    content: &str,
    app_state: State<Mutex<AppState>>,
    app_handle: AppHandle,
) -> Result<bool, String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Configure the file dialog
    let mut dialog = app_handle
        .dialog()
        .file()
        .add_filter(title, &["lockd"])
        .set_file_name(&format!("{}.lockd", title));

    if let Some(id) = id {
        // Set the initial directory to the last saved path if available
        let file_path = app_state.lock().unwrap().get_path_from_id(id);
        if let Some(path) = &file_path {
            let path_buf = std::path::Path::new(path);
            dialog = dialog.set_directory(path_buf.parent().unwrap_or(path_buf));
        }
    }

    // Open the save file dialog
    let file_path = dialog.blocking_save_file();

    // If the user selected a file, write the encrypted data to it
    // It is Ok to cancel the dialog
    if let Some(path) = file_path {
        // Encrypt the content
        let file_data = encrypt_data(&key, content.as_bytes())?;

        std::fs::write(path.as_path().unwrap(), file_data)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    } else {
        return Ok(false);
    }

    Ok(true)
}

#[tauri::command]
pub fn rename_note(
    id: &str,
    parent_id: &str,
    new_title: &str,
    app_state: State<Mutex<AppState>>,
    window: Window,
) -> Result<(), String> {
    let mut state = app_state.lock().unwrap();
    let note_path = state.get_path_from_id(id).ok_or("Note not found")?;

    // Get the parent directory of the note
    let binding = PathBuf::from(&note_path);
    let parent_dir = binding.parent().ok_or("Invalid note path")?;

    // Create the new file name with the new title
    let new_file_name = format!("{}.lockd", new_title);
    let new_file_path = parent_dir.join(&new_file_name);

    // Rename the file
    std::fs::rename(note_path, &new_file_path)
        .map_err(|e| format!("Failed to rename note: {}", e))?;

    // Update the state with the new path
    state.update_note_path(
        id,
        parent_id,
        new_file_path.to_string_lossy().to_string(),
        new_file_name.clone(),
    );

    window
        .emit("note-renamed", (id, parent_id, new_file_name))
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

#[tauri::command]
/// Returns the contents of the default configuration file.
pub fn get_initial_config(app_handle: AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|_| "Failed to get app config base directory")?;

    // Always create the app config directory, even if it already exists
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    let config_path = app_dir.join(".lockdfg");

    // Create the config file with empty content if it doesn't exist
    if !config_path.exists() {
        std::fs::write(&config_path, "{}")
            .map_err(|e| format!("Failed to create default config file: {}", e))?;
    }

    std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read default config file: {}", e))
}

#[tauri::command]
/// Saves the default configuration file with the provided content.
pub fn save_initial_config(content: &str, app_handle: AppHandle) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|_| "Failed to get app config base directory")?;

    // Always create the app config directory, even if it already exists
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app config directory: {}", e))?;

    let config_path = app_dir.join(".lockdfg");

    // Write the provided content to the config file
    std::fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write default config file: {}", e))?;

    Ok(())
}

use crate::{
    encryption::{decrypt_data, encrypt_data},
    state::AppState,
};
use std::sync::Mutex;
use tauri::State;
use tauri_plugin_dialog::DialogExt;

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
    app_state.lock().unwrap().set_path(file_path.to_string());

    Ok(String::from_utf8(decrypted_content).unwrap_or_default())
}

use crate::{
    encryption::{decrypt_data, encrypt_data},
    notes::open_encrypted_note,
    state::{AppState, NoteInfo, OpenedFolder},
};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, State, Window};
use tauri_plugin_dialog::DialogExt;

pub fn drop_handler(window: &Window, event: &tauri::DragDropEvent) -> Result<(), String> {
    match event {
        // Handle file drops
        tauri::DragDropEvent::Drop { paths, .. } => {
            for path in paths {
                // Check if it's a folder that can be opened
                if path.is_dir() && can_open_folder(path) {
                    open_folder(path, window)?;
                } else {
                    open_from_path(path, window)?;
                }
            }
        }
        _ => {}
    }
    Ok(())
}

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

fn open_encrypted_note_and_emit(
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
        .set_title(&format!("Save encrypted file: {}", title))
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
        .set_title(&format!("Save decrypted file: {}", original_filename))
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

/// Encrypts all files in a folder recursively
pub fn encrypt_folder(
    folder_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Get folder name for the dialog title
    let folder_name = folder_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("folder");

    // Show directory dialog for output location
    let output_dir = app_handle
        .dialog()
        .file()
        .set_title(&format!(
            "Select destination for encrypted folder: {}",
            folder_name
        ))
        .blocking_pick_folder();

    let Some(output_path) = output_dir else {
        // It is ok to cancel the dialog
        return Ok(());
    };

    // Create output folder name based on the original folder name
    let output_folder_name = format!("{}.lockd", folder_name);

    // Create the output folder path
    let output_folder = output_path.as_path().unwrap().join(&output_folder_name);

    std::fs::create_dir_all(&output_folder)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    encrypt_folder_recursive(folder_path, &output_folder, &key)?;

    Ok(())
}

/// Recursively encrypts all files in a folder
fn encrypt_folder_recursive(
    source_dir: &PathBuf,
    output_dir: &PathBuf,
    key: &[u8; 32],
) -> Result<(), String> {
    let entries = std::fs::read_dir(source_dir)
        .map_err(|e| format!("Failed to read directory {}: {}", source_dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            // Encrypt file
            let file_data = std::fs::read(&path)
                .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

            let encrypted_data = encrypt_data(key, &file_data)?;

            let filename = path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("encrypted_file");

            let output_file = output_dir.join(format!("{}.lockd", filename));

            std::fs::write(&output_file, encrypted_data).map_err(|e| {
                format!(
                    "Failed to write encrypted file {}: {}",
                    output_file.display(),
                    e
                )
            })?;
        } else if path.is_dir() {
            // Create subdirectory and recurse
            let dirname = path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("folder");

            let sub_output_dir = output_dir.join(dirname);
            std::fs::create_dir_all(&sub_output_dir)
                .map_err(|e| format!("Failed to create subdirectory: {}", e))?;

            encrypt_folder_recursive(&path, &sub_output_dir, key)?;
        }
    }

    Ok(())
}

/// Decrypts all files in a folder recursively
pub fn decrypt_folder(
    folder_path: &PathBuf,
    app_state: State<Mutex<AppState>>,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    // Get the encryption key
    let key = app_state.lock().unwrap().get_encryption_key()?;

    // Create output folder name based on the original folder name
    // Remove .lockd extension if present
    let folder_name = folder_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("decrypted_folder");

    // Show directory dialog for output location
    let output_dir = app_handle
        .dialog()
        .file()
        .set_title(&format!(
            "Select destination for decrypted folder: {}",
            folder_name
        ))
        .blocking_pick_folder();

    let Some(output_path) = output_dir else {
        // It is ok to cancel the dialog
        return Ok(());
    };

    // Create the output folder path
    let output_folder = output_path.as_path().unwrap().join(folder_name);

    std::fs::create_dir_all(&output_folder)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    decrypt_folder_recursive(folder_path, &output_folder, &key)?;

    Ok(())
}

/// Recursively decrypts all files in a folder
pub fn decrypt_folder_recursive(
    source_dir: &PathBuf,
    output_dir: &PathBuf,
    key: &[u8; 32],
) -> Result<(), String> {
    let entries = std::fs::read_dir(source_dir)
        .map_err(|e| format!("Failed to read directory {}: {}", source_dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            // Decrypt file
            let file_data = std::fs::read(&path)
                .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

            let decrypted_data = decrypt_data(key, &file_data)?;

            let filename = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("decrypted_file");

            let output_file = output_dir.join(filename);

            std::fs::write(&output_file, decrypted_data).map_err(|e| {
                format!(
                    "Failed to write decrypted file {}: {}",
                    output_file.display(),
                    e
                )
            })?;
        } else if path.is_dir() {
            // Create subdirectory and recurse
            let dirname = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("folder");

            let sub_output_dir = output_dir.join(dirname);
            std::fs::create_dir_all(&sub_output_dir)
                .map_err(|e| format!("Failed to create subdirectory: {}", e))?;

            decrypt_folder_recursive(&path, &sub_output_dir, key)?;
        }
    }

    Ok(())
}

/// Checks if a folder can be opened (contains a .lockd folder)
pub fn can_open_folder(folder_path: &PathBuf) -> bool {
    let lockd_folder = folder_path.join(".lockd");
    lockd_folder.exists() && lockd_folder.is_dir()
}

/// Opens a folder and loads its notes into the sidebar
pub fn open_folder(folder_path: &PathBuf, window: &Window) -> Result<(), String> {
    let app_state = window.state::<Mutex<AppState>>();

    // Get folder name
    let folder_name = folder_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown Folder")
        .to_string();

    let folder_path_str = folder_path
        .to_str()
        .ok_or("Invalid folder path encoding")?
        .to_string();

    // Scan for notes in the folder
    let notes = scan_folder_for_notes(folder_path)?;

    let opened_folder = OpenedFolder {
        name: folder_name,
        path: folder_path_str,
        notes,
    };

    // Add to app state
    app_state
        .lock()
        .unwrap()
        .add_opened_folder(opened_folder.clone());

    // Emit event to frontend
    window
        .emit("folder-opened", opened_folder)
        .map_err(|e| format!("Failed to emit folder-opened event: {}", e))?;

    Ok(())
}

/// Scans a folder for .lockd note files
fn scan_folder_for_notes(folder_path: &PathBuf) -> Result<Vec<NoteInfo>, String> {
    let mut notes = Vec::new();

    let entries = std::fs::read_dir(folder_path)
        .map_err(|e| format!("Failed to read directory {}: {}", folder_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        // Check if it's a .lockd file (note)
        if path.is_file() {
            if let Some(extension) = path.extension() {
                if extension == "lockd" {
                    // Check if it's a note (single extension, not double like file.txt.lockd)
                    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    if !PathBuf::from(file_stem).extension().is_some() {
                        let note_name = file_stem.to_string();
                        let note_path = path.to_str().unwrap_or("").to_string();

                        notes.push(NoteInfo {
                            name: note_name,
                            path: note_path,
                        });
                    }
                }
            }
        }
    }

    // Sort notes by name
    notes.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(notes)
}

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

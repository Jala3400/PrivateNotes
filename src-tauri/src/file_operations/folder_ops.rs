use crate::state::{AppState, FileSystemItem};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Window};

/// Opens a  folder and loads its file structure into the sidebar
pub fn open_folder(
    folder_path: &PathBuf,
    window: &Window,
    app_state: tauri::State<Mutex<AppState>>,
) -> Result<(), String> {
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

    // Check if the folder is already opened
    if app_state
        .lock()
        .unwrap()
        .is_opened(folder_path_str.clone())
        .is_some()
    {
        return Ok(()); // Folder already opened
    }

    // Generate ID for the folder and add to mapping
    let folder_id = app_state
        .lock()
        .unwrap()
        .add_path_mapping(folder_path_str.clone());

    // Scan for complete file structure
    let file_structure = scan_directory_structure(folder_path, &app_state, &folder_id)?;

    let opened_folder = FileSystemItem {
        id: folder_id,
        parent_id: None, // No parent for root folders
        name: folder_name,
        path: folder_path_str,
        is_directory: true,
        is_note: false,
        children: Some(file_structure),
    };

    // Add to app state
    let frontend_item = {
        let mut state = app_state.lock().unwrap();
        state.add_opened_item(&opened_folder.clone());
        state.to_frontend_item(&opened_folder)
    };

    // Emit event to frontend with frontend-safe item
    window
        .emit("item-opened", frontend_item)
        .map_err(|e| format!("Failed to emit item-opened event: {}", e))?;

    Ok(())
}

/// Scans the complete directory structure recursively
pub fn scan_directory_structure(
    folder_path: &PathBuf,
    app_state: &tauri::State<Mutex<AppState>>,
    parent_id: &String,
) -> Result<Vec<FileSystemItem>, String> {
    let mut items = Vec::new();

    let entries = std::fs::read_dir(folder_path)
        .map_err(|e| format!("Failed to read directory {}: {}", folder_path.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        let name = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();

        let path_str = path.to_str().unwrap_or("").to_string();
        let is_directory = path.is_dir();

        // Generate ID and add to mapping
        let item_id = app_state.lock().unwrap().add_path_mapping(path_str.clone());

        // Check if it's a .lockd file
        let is_note = if path.is_file() {
            if let Some(extension) = path.extension() {
                if extension == "lockd" {
                    // Check if it's a note (single extension, not double like file.txt.lockd)
                    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    !PathBuf::from(file_stem).extension().is_some()
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        };

        // Recursively scan subdirectories
        let children = if is_directory && !name.starts_with('.') {
            match scan_directory_structure(&path, app_state, &parent_id) {
                Ok(child_items) => Some(child_items),
                Err(_) => None, // Skip directories we can't read
            }
        } else {
            None
        };

        items.push(FileSystemItem {
            id: item_id,
            parent_id: Some(parent_id.clone()),
            name,
            path: path_str,
            is_directory,
            is_note,
            children,
        });
    }

    // Sort items: directories first, then files, both sorted alphabetically
    items.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.cmp(&b.name),
    });

    Ok(items)
}

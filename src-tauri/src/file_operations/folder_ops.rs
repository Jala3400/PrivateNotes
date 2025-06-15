use crate::state::{AppState, FileSystemItem, OpenedFolder};
use std::{path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, Window};

/// Checks if a folder can be opened (contains a .lockd folder)
pub fn can_open_folder(folder_path: &PathBuf) -> bool {
    let lockd_folder = folder_path.join(".lockd");
    lockd_folder.exists() && lockd_folder.is_dir()
}

/// Opens a folder and loads its file structure into the sidebar
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

    // Scan for complete file structure
    let file_structure = scan_directory_structure(folder_path)?;

    let opened_folder = OpenedFolder {
        name: folder_name,
        path: folder_path_str,
        file_structure,
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

/// Scans the complete directory structure recursively
pub fn scan_directory_structure(folder_path: &PathBuf) -> Result<Vec<FileSystemItem>, String> {
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
            match scan_directory_structure(&path) {
                Ok(child_items) => Some(child_items),
                Err(_) => None, // Skip directories we can't read
            }
        } else {
            None
        };

        items.push(FileSystemItem {
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

use crate::{
    file_operations::{
        encryption_ops::handle_path, folder_ops::open_folder,
        note_ops::open_dropped_note,
    },
    state::AppState,
};
use std::{path::PathBuf, sync::Mutex};
use tauri::{DragDropEvent, Manager, Window};

/// Handles drag and drop events for files and folders
pub fn drop_handler(window: &Window, event: &DragDropEvent) -> Result<(), String> {
    match event {
        // Handle file drops
        DragDropEvent::Drop { paths, .. } => {
            for path in paths {
                // Check if it's a folder that can be opened
                if can_open_path(path) {
                    open_from_path(path, window)?;
                } else {
                    handle_path(path, window)?;
                }
            }
        }
        _ => {}
    }
    Ok(())
}

/// Checks if a path can be opened by the app
pub fn can_open_path(path: &PathBuf) -> bool {
    // Check if the path is a directory and contains a .lockd folder
    if path.is_dir() {
        return can_open_folder(path);
    } else {
        return can_open_file(path);
    }
}

/// Checks if a folder can be opened (contains a .lockd folder)
pub fn can_open_folder(folder_path: &PathBuf) -> bool {
    let lockd_folder = folder_path.join(".lockd");
    lockd_folder.exists() && lockd_folder.is_dir()
}

/// Checks if a file can be opened (is a .lockd file)
pub fn can_open_file(file_path: &PathBuf) -> bool {
    let file_stem = file_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

    // Check if file has double extension (e.g., "document.txt.lockd")
    PathBuf::from(file_stem).extension().is_none()
}

/// Opens a file or folder based on its path
pub fn open_from_path(path: &PathBuf, window: &Window) -> Result<(), String> {
    if path.is_dir() {
        // If it's a directory, open it
        open_folder(path, window)
    } else if path.is_file() {
        // If it's a file, check if it's a .lockd file
        open_dropped_note(path, window, window.state::<Mutex<AppState>>())
    } else {
        Err("Invalid path".to_string())
    }
}

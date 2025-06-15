use tauri::{DragDropEvent, Window};
use crate::file_operations::{folder_ops::can_open_folder, folder_ops::open_folder, note_ops::open_from_path};

/// Handles drag and drop events for files and folders
pub fn drop_handler(window: &Window, event: &DragDropEvent) -> Result<(), String> {
    match event {
        // Handle file drops
        DragDropEvent::Drop { paths, .. } => {
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

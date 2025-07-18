use std::path::PathBuf;

use tauri::{Emitter, Window};

/// Opens a configuration file from a given path
pub fn open_rc_from_path(file_path: &PathBuf, window: &Window) -> Result<(), String> {
    // Read the contents of the file
    let file_content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    // Emit an event to the Tauri window with the file content
    window
        .emit("rc-opened", file_content)
        .map_err(|e| format!("Failed to emit item-opened event: {}", e))?;

    Ok(())
}

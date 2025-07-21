use std::path::PathBuf;

use tauri::{Emitter, Window};

pub fn open_config_from_path(file_path: &PathBuf, window: &Window) -> Result<(), String> {
    // Check if the file exists and is a valid configuration file
    if !file_path.exists() || !file_path.is_file() {
        return Err(format!(
            "File does not exist or is not a valid file: {}",
            file_path.display()
        ));
    }

    // Match on the file extension and delegate to the appropriate handler
    match file_path.extension().and_then(|s| s.to_str()) {
        Some("lockdrc") => return open_rc_from_path(file_path, window),
        Some("lockdfg") => return open_json_from_path(file_path, window),
        _ => {}
    }
    Ok(())
}

/// Opens a configuration file from a given path
pub fn open_rc_from_path(file_path: &PathBuf, window: &Window) -> Result<(), String> {
    // Read the contents of the file
    let file_content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read run commands file: {}", e))?;

    // Emit an event to the Tauri window with the file content
    window
        .emit("rc-opened", file_content)
        .map_err(|e| format!("Failed to emit rc-opened event: {}", e))?;

    Ok(())
}

pub fn open_json_from_path(file_path: &PathBuf, window: &Window) -> Result<(), String> {
    // Read the contents of the file
    let file_content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read JSON file: {}", e))?;

    // Emit an event to the Tauri window with the file content
    window
        .emit("config-opened", file_content)
        .map_err(|e| format!("Failed to emit json-opened event: {}", e))?;

    Ok(())
}

use std::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};

mod encryption;
mod file_operations;
mod notes;
mod state;

use encryption::derive_encryption_key;
use state::AppState;

use crate::{file_operations::drop_handler, notes::save_encrypted_note};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| {
            if let Err(err) = match event {
                // Drag and drop event handling
                WindowEvent::DragDrop(e) => drop_handler(window, e),
                _ => Ok(()),
            } {
                window.emit("error", err).unwrap();
            }
        })
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            derive_encryption_key,
            save_encrypted_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

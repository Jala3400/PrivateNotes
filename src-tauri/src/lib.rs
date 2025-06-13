use std::sync::Mutex;
use tauri::{DragDropEvent, Manager, WindowEvent};

mod encryption;
mod file_operations;
mod notes;
mod state;

use encryption::derive_encryption_key;
use file_operations::open_from_path;
use state::AppState;

use crate::notes::save_encrypted_note;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| match event {
            // Drag and drop event handling
            WindowEvent::DragDrop(e) => match e {
                // When a file is dropped
                DragDropEvent::Drop { paths, .. } => {
                    if let Some(path) = paths.first() {
                        open_from_path(path, window);
                    }
                }
                _ => {}
            },
            _ => {}
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

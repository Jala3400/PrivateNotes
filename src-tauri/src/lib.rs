use std::sync::Mutex;
use tauri::{Emitter, Manager, WindowEvent};

mod app_ops;
mod encryption;
mod file_operations;
mod state;

use crate::file_operations::{
    commands::{
        close_item, get_initial_config, get_opened_items, open_note_from_id, rename_note,
        save_initial_config, save_note, save_note_as, save_note_copy,
    },
    drag_drop::drop_handler,
};
use app_ops::reset_app;
use encryption::derive_encryption_key;
use state::AppState;

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
            save_note,
            save_note_as,
            save_note_copy,
            rename_note,
            get_opened_items,
            close_item,
            open_note_from_id,
            reset_app,
            get_initial_config,
            save_initial_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

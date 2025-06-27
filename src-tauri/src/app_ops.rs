use crate::state::AppState;
use std::sync::Mutex;
use tauri::State;

// Resets the app state and reloads the main window.
#[tauri::command]
pub fn reset_app(app_state: State<Mutex<AppState>>) -> Result<(), String> {
    // Reset the app state
    let mut state = app_state.lock().map_err(|e| e.to_string())?;
    state.reset();

    Ok(())
}

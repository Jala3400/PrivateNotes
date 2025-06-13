use crate::state::AppState;
use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
use argon2::Argon2;
use rand;
use std::sync::Mutex;
use tauri::State;

/// Create a cipher instance from the encryption key
fn create_cipher(key: &[u8; 32]) -> Result<Aes256Gcm, String> {
    Aes256Gcm::new_from_slice(key).map_err(|e| format!("Failed to create cipher: {}", e))
}

/// Encrypt data with the given key and return (nonce_bytes, encrypted_data)
pub fn encrypt_data(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, String> {
    // Generate a random nonce for this encryption
    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher instance
    let cipher = create_cipher(key)?;

    // Encrypt the content
    let encrypted_content = cipher
        .encrypt(nonce, data)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Create the data to save (nonce + encrypted content)
    let mut file_data = Vec::with_capacity(12 + encrypted_content.len());
    file_data.extend_from_slice(&nonce_bytes);
    file_data.extend_from_slice(&encrypted_content);

    Ok(file_data)
}

/// Decrypt data with the given key from file data (nonce + encrypted content)
pub fn decrypt_data(key: &[u8; 32], file_data: &[u8]) -> Result<Vec<u8>, String> {
    // Extract nonce and encrypted content
    if file_data.len() < 12 {
        return Err("File is too short".to_string());
    }
    let nonce_bytes = &file_data[..12];
    let encrypted_content = &file_data[12..];

    // Create nonce from bytes
    let nonce = Nonce::from_slice(nonce_bytes);

    // Create cipher instance
    let cipher = create_cipher(key)?;

    // Decrypt the content
    cipher
        .decrypt(nonce, encrypted_content)
        .map_err(|e| format!("Decryption failed: {}", e))
}

#[tauri::command]
/// Derive an encryption key using Argon2 with the username as salt
pub fn derive_encryption_key(
    username: &str,
    password: &str,
    app_state: State<Mutex<AppState>>,
) -> Result<(), String> {
    let mut app_state = app_state.lock().unwrap();

    // Use the username as the salt for Argon2, min length is 16 bytes
    let mut username_bytes = username.as_bytes().to_vec();
    if username_bytes.len() < 16 {
        username_bytes.resize(16, 0);
    }

    // Derive a 32-byte key using Argon2
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), username_bytes.as_slice(), &mut key)
        .unwrap();

    app_state.set_key(key);

    Ok(())
}

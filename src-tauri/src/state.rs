#[derive(Default)]
pub struct AppState {
    key: Option<[u8; 32]>,
    path: Option<String>,
}

impl AppState {
    pub fn set_key(&mut self, key: [u8; 32]) {
        self.key = Some(key);
    }

    // pub fn clear_key(&mut self) {
    //     self.key = None;
    // }

    // pub fn get_key(&self) -> Option<[u8; 32]> {
    //     self.key
    // }

    pub fn get_encryption_key(&self) -> Result<[u8; 32], &'static str> {
        self.key.ok_or("Log in first")
    }

    pub fn set_path(&mut self, path: String) {
        self.path = Some(path);
    }

    pub fn get_path(&self) -> Option<String> {
        self.path.clone()
    }
}

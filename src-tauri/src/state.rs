#[derive(Default)]
pub struct AppState {
    key: Option<[u8; 32]>,
    last_path: Option<String>,
    opened_folders: Vec<FileSystemItem>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct NoteInfo {
    pub name: String,
    pub path: String,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSystemItem {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_note: bool,
    pub children: Option<Vec<FileSystemItem>>,
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

    pub fn set_last_path(&mut self, path: String) {
        self.last_path = Some(path);
    }

    pub fn get_last_path(&self) -> Option<String> {
        self.last_path.clone()
    }

    pub fn add_opened_folder(&mut self, folder: FileSystemItem) {
        // Remove if already exists to avoid duplicates
        self.opened_folders.retain(|f| f.path != folder.path);
        self.opened_folders.push(folder);
    }

    pub fn remove_opened_folder(&mut self, folder_path: &str) {
        self.opened_folders.retain(|f| f.path != folder_path);
    }

    pub fn get_opened_folders(&self) -> Vec<FileSystemItem> {
        self.opened_folders.clone()
    }

    // pub fn clear_opened_folders(&mut self) {
    //     self.opened_folders.clear();
    // }
}

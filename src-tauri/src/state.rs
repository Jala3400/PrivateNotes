#[derive(Default)]
pub struct AppState {
    key: Option<[u8; 32]>,
    path: Option<String>,
    opened_items: Vec<FileSystemItem>,
    id_to_path_map: std::collections::HashMap<String, String>,
    next_id: u32,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct NoteInfo {
    pub name: String,
    pub path: String,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSystemItemFrontend {
    pub id: String,
    pub name: String,
    pub is_directory: bool,
    pub is_note: bool,
    pub children: Option<Vec<FileSystemItemFrontend>>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSystemItem {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub path: String, // Only used internally, not serialized to frontend
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

    pub fn set_path(&mut self, path: String) {
        self.path = Some(path);
    }

    pub fn get_path(&self) -> Option<String> {
        self.path.clone()
    }

    /// Check if an item is opened by its path
    /// Returns the ID of the opened item if it exists, otherwise returns None
    pub fn is_opened(&self, path: String) -> Option<String> {
        self.opened_items
            .iter()
            .find(|f| f.path == path)
            .map(|item| item.id.clone())
    }

    pub fn add_opened_item(&mut self, item: &FileSystemItem) -> bool {
        if self.opened_items.iter().any(|f| f.path == item.path) {
            // Item already exists, no need to add
            return false;
        }
        self.opened_items.push(item.clone());
        return true;
    }

    pub fn remove_opened_item(&mut self, item_id: &str) {
        // Remove from opened items and get the index
        if let Some(index) = self.opened_items.iter().position(|f| f.id == item_id) {
            // Remove the item from opened items
            let item = self.opened_items.remove(index);

            // Remove from ID mapping
            self.remove_from_id_mapping(item_id);

            // If the item has children, remove them from ID mapping as well
            if let Some(children) = &item.children {
                for child in children {
                    self.remove_from_id_mapping(&child.id);
                }
            }
        }
    }

    pub fn get_opened_items(&self) -> Vec<FileSystemItemFrontend> {
        self.opened_items
            .iter()
            .map(|item| self.to_frontend_item(item))
            .collect()
    }

    fn generate_id(&mut self) -> String {
        let id = format!("item_{}", self.next_id);
        self.next_id += 1;
        id
    }

    pub fn add_path_mapping(&mut self, path: String) -> String {
        let id = self.generate_id();
        self.id_to_path_map.insert(id.clone(), path);
        id
    }

    pub fn get_path_from_id(&self, id: &str) -> Option<String> {
        self.id_to_path_map.get(id).cloned()
    }

    pub fn remove_from_id_mapping(&mut self, id: &str) {
        self.id_to_path_map.remove(id);
    }

    pub fn to_frontend_item(&self, item: &FileSystemItem) -> FileSystemItemFrontend {
        FileSystemItemFrontend {
            id: item.id.clone(),
            name: item.name.clone(),
            is_directory: item.is_directory,
            is_note: item.is_note,
            children: item.children.as_ref().map(|children| {
                children
                    .iter()
                    .map(|child| self.to_frontend_item(child))
                    .collect()
            }),
        }
    }
}

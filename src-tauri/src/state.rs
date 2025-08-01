#[derive(Default)]
pub struct AppState {
    key: Option<[u8; 32]>,
    opened_items: Vec<FileSystemItem>,
    id_to_path_map: std::collections::HashMap<String, String>,
    next_id: u32,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[allow(non_snake_case)]
pub struct FileSystemItemFrontend {
    pub id: String,
    pub parentId: String,
    pub name: String,
    pub isDirectory: bool,
    pub isNote: bool,
    pub children: Option<Vec<FileSystemItemFrontend>>,
    pub collapsed: bool,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSystemItem {
    pub id: String,
    pub parent_id: String,
    pub name: String,
    pub path: String, // Only used internally, not serialized to frontend
    pub is_directory: bool,
    pub is_note: bool,
    pub children: Option<Vec<FileSystemItem>>,
}

impl AppState {
    pub fn reset(&mut self) {
        self.key = None;
        self.opened_items.clear();
        self.id_to_path_map.clear();
        self.next_id = 0;
    }

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

    pub fn is_logged_in(&self) -> bool {
        self.key.is_some()
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

    pub fn update_note_path(&mut self, id: &str, parent_id: &str, new_path: String, name: String) {
        // Update path in id_to_path_map
        if let Some(existing_path) = self.id_to_path_map.get_mut(id) {
            *existing_path = new_path.clone();
        }

        // Update path and name in opened_items
        if let Some(item) = self.get_item_from_id(id, parent_id) {
            item.path = new_path;
            item.name = name;
        }
    }

    pub fn find_item_mut<'a>(
        items: &'a mut [FileSystemItem],
        id: &str,
        parent_id: &str,
    ) -> Option<&'a mut FileSystemItem> {
        for item in items {
            if item.id == id && item.parent_id == parent_id {
                return Some(item);
            }
            if let Some(children) = item.children.as_mut() {
                if let Some(found) = Self::find_item_mut(children, id, parent_id) {
                    return Some(found);
                }
            }
        }
        None
    }

    pub fn get_item_from_id(&mut self, id: &str, parent_id: &str) -> Option<&mut FileSystemItem> {
        Self::find_item_mut(&mut self.opened_items, id, parent_id)
    }

    pub fn to_frontend_item(&self, item: &FileSystemItem) -> FileSystemItemFrontend {
        FileSystemItemFrontend {
            id: item.id.clone(),
            parentId: item.parent_id.clone(),
            name: item.name.clone(),
            isDirectory: item.is_directory,
            isNote: item.is_note,
            children: item.children.as_ref().map(|children| {
                children
                    .iter()
                    .map(|child| self.to_frontend_item(child))
                    .collect()
            }),
            collapsed: true,
        }
    }
}

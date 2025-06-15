export interface OpenedFolder {
    name: string;
    path: string;
    file_structure: FileSystemItem[];
}

export interface NoteInfo {
    name: string;
    path: string;
}

export interface FileSystemItem {
    name: string;
    path: string;
    is_directory: boolean;
    is_note: boolean;
    children?: FileSystemItem[];
}

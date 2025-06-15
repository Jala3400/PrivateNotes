export interface FileSystemItem {
    name: string;
    path: string;
    is_directory: boolean;
    is_note: boolean;
    children?: FileSystemItem[];
}

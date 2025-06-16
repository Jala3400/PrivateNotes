export interface FileSystemItem {
    id: string;
    name: string;
    is_directory: boolean;
    is_note: boolean;
    children?: FileSystemItem[];
}

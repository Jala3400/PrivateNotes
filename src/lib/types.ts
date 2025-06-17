export interface FileSystemItem {
    id: string;
    parentId: string;
    name: string;
    isDirectory: boolean;
    isNote: boolean;
    children?: FileSystemItem[];
}

export interface noteIds {
    id: string;
    parentId: string;
}

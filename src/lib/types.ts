export interface FileSystemItem {
    id: string;
    parentId: string;
    name: string;
    isDirectory: boolean;
    isNote: boolean;
    children?: FileSystemItem[];
    collapsed: boolean;
}

export interface NoteIds {
    id: string;
    parentId: string;
}

export interface EditorConfig {
    vimMode: boolean;
    lineNumbers: boolean;
    lineWrapping: boolean;
    autoCloseBrackets: boolean;
    highlightSelectionMatches: boolean;
    foldGutter: boolean;
    tabSize: number;
}

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

export type ConfigOptionsDescription = [
    string,
    EditorConfigOption,
    OptionType
][];
export type ConfigOptions = Record<string, any>;

export interface EditorConfigOption<T = any> {
    label: string;
    defaultValue?: T;
    min?: number; // Optional for number types
    max?: number; // Optional for number types
}

export enum OptionType {
    BOOLEAN,
    NUMBER,
}

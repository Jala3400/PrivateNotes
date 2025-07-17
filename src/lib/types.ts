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

export type ConfigGroup = [string, ConfigSection][];

export type ConfigSection = [string, ConfigOption, OptionType][];

export type ConfigOptions = Record<string, any>;

export interface ConfigOption<T = any> {
    label: string;
    defaultValue?: T;
    min?: number; // Optional for number types
    max?: number; // Optional for number types
    options?: T[]; // Optional for select types
}

export enum OptionType {
    BOOLEAN,
    NUMBER,
    SELECT,
}

export interface Command {
    name: string;
    pattern: RegExp;
    requireArgs?: boolean;
    execute: (args: string[]) => void;
}

import type { Writable } from "svelte/store";

export interface FileSystemItem {
    id: string;
    parentId: string;
    name: string;
    isDirectory: boolean;
    isNote: boolean;
    children?: FileSystemItem[];
    collapsed: boolean;
}

export interface CurrentNote {
    id: string;
    parentId: string;
    unsaved: boolean;
}

export type Options = Record<string, any>;

export interface ConfigurationGroup {
    name: string;
    key: string;
    sections: ConfigurationSection[];
    defaults: Options;
    store: Writable<Options>;
    setter: (newConfig: Options) => void;
}

export interface ConfigurationSection {
    name: string;
    options: ConfigOption[];
}

export interface ConfigOption<T = any> {
    name: string;
    key: string;
    defaultValue?: T;
    min?: number; // Optional for number types
    max?: number; // Optional for number types
    options?: T[]; // Optional for select types
    type: OptionType;
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

// Command list store for CommandPalette
import { writable } from "svelte/store";

export interface Command {
    name: string;
    pattern: RegExp;
    requireArgs?: boolean;
    execute: (args: string[]) => void;
}

export const commandList = writable<Command[]>([
    {
        name: "set tabSize ",
        pattern: /^set tabSize (\d+)$/i,
        requireArgs: true,
        execute: (args: string[]) => alert(`Tab size set to ${args[0]}`),
    },
    {
        name: "enable lineNumbers ",
        pattern: /^enable lineNumbers$/i,
        execute: () => alert("Line numbers enabled"),
    },
    {
        name: "disable lineNumbers ",
        pattern: /^disable lineNumbers$/i,
        execute: () => alert("Line numbers disabled"),
    },
]);

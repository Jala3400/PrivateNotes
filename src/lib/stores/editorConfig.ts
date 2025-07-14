import type { EditorConfig } from "$lib/types";
import { writable } from "svelte/store";

export const editorConfig = writable<EditorConfig>({
    vimMode: false,
});

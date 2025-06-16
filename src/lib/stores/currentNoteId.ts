import { writable } from "svelte/store";

export const currentNoteId = writable<string | null>(null);

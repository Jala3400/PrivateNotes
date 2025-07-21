import type { NoteIds } from "$lib/types";
import { writable } from "svelte/store";

export const currentNote = writable<NoteIds | null>(null);

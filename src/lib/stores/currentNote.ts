import type { CurrentNote } from "$lib/types";
import { writable } from "svelte/store";

export const currentNote = writable<CurrentNote | null>(null);

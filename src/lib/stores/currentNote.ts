import type { noteIds } from "$lib/types";
import { writable } from "svelte/store";

export const currentNote = writable<noteIds | null>(null);

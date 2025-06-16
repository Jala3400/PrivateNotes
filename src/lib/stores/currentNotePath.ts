import { writable } from "svelte/store";

export const currentNotePath = writable<string | null>(null);

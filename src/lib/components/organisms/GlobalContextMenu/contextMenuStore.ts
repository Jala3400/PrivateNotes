import { writable } from "svelte/store";

export interface ContextMenuItem {
    text?: string;
    action?: (() => void) | null;
    type?: "item" | "separator";
}

export interface ContextMenuState {
    show: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
}

const initialState: ContextMenuState = {
    show: false,
    x: 0,
    y: 0,
    items: [],
};

function createContextMenuStore() {
    const { subscribe, set, update } = writable<ContextMenuState>(initialState);

    return {
        subscribe,

        /**
         * Show context menu at the given position with specified items
         */
        show(x: number, y: number, items: ContextMenuItem[]): void {
            set({
                show: true,
                x,
                y,
                items,
            });
        },

        /**
         * Hide context menu
         */
        hide(): void {
            update((state) => ({
                ...state,
                show: false,
            }));
        },

        /**
         * Update menu items dynamically
         */
        updateItems(items: ContextMenuItem[]): void {
            update((state) => ({
                ...state,
                items,
            }));
        },

        /**
         * Reset to initial state
         */
        reset(): void {
            set(initialState);
        },
    };
}

export const contextMenuStore = createContextMenuStore();

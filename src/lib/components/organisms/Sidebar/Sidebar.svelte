<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import type { FileSystemItem } from "$lib/types";
    import Item from "$lib/components/molecules/Item.svelte";
    import { throwCustomError } from "$lib/error";

    interface Props {
        sidebar_collapsed?: boolean;
    }

    let { sidebar_collapsed = $bindable(false) }: Props = $props();

    let openedItems: FileSystemItem[] = $state([]);
    let unlistenItemOpened: UnlistenFn;
    let unlistenItemClosed: UnlistenFn;

    onMount(async () => {
        // Load initial opened items
        try {
            openedItems = await invoke("get_opened_items");

            // Sort items: directories first, then files, both sorted alphabetically
            openedItems.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
        } catch (error) {
            throwCustomError(
                "Failed to load opened items" + String(error),
                "An error occurred while trying to load the opened items."
            );
        }

        // Listen for item events
        unlistenItemOpened = await listen("item-opened", (event) => {
            const item = event.payload as FileSystemItem;

            // Insert the item in the correct position to maintain order
            const insertIndex = openedItems.findIndex((existingItem) => {
                // If new item is directory and existing is not, insert before
                if (item.isDirectory && !existingItem.isDirectory) return true;
                // If new item is not directory and existing is directory, continue
                if (!item.isDirectory && existingItem.isDirectory) return false;
                // Same type, compare names alphabetically
                return item.name.localeCompare(existingItem.name) < 0;
            });

            if (insertIndex === -1) {
                // Insert at the end if no position found
                openedItems.push(item);
            } else {
                // Insert at the found position
                openedItems.splice(insertIndex, 0, item);
            }

            // Trigger reactivity
            openedItems = openedItems;
        });

        unlistenItemClosed = await listen("item-closed", (event) => {
            const itemId = event.payload;
            openedItems = openedItems.filter((f) => f.id !== itemId);
        });
    });

    onDestroy(() => {
        if (unlistenItemOpened) unlistenItemOpened();
        if (unlistenItemClosed) unlistenItemClosed();
    });

    async function closeItem(id: string) {
        try {
            await invoke("close_item", { id });
        } catch (error) {
            throwCustomError(
                "Failed to close item" + String(error),
                "An error occurred while trying to close the item."
            );
        }
    }
    async function openNote(id: string, parentId: string) {
        try {
            await invoke("open_note_from_id", { id, parentId });
        } catch (error) {
            throwCustomError(
                "Failed to open note" + String(error),
                "An error occurred while trying to open the note."
            );
        }
    }
</script>

<div class="sidebar" class:collapsed={sidebar_collapsed}>
    <div class="sidebar-header">
        <h2>Opened Items</h2>
    </div>

    <div class="sidebar-content">
        {#if openedItems.length === 0}
            <div class="empty-state">
                <p>No items opened</p>
                <small
                    >Drop a .lockd file or a folder containing a .lockd
                    directory to open it</small
                >
            </div>
        {:else}
            {#each openedItems as item}
                <Item {item} {closeItem} {openNote} />
            {/each}
        {/if}
    </div>
</div>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 1em;

        padding: 1em;
        background-color: var(--background-dark-light);
        overflow: hidden;
        border-right: 1px solid var(--border-color-light);
    }

    .sidebar.collapsed {
        width: 0;
        overflow: hidden;
        padding: 0;
    }

    .sidebar-content {
        display: flex;
        flex-direction: column;
        gap: 0.8em;
        overflow: auto;
    }

    .empty-state {
        color: var(--text-secondary);
    }
</style>

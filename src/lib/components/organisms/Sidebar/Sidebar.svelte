<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import type { FileSystemItem } from "$lib/types";
    import Item from "$lib/components/molecules/Item.svelte";
    import { throwCustomError } from "$lib/error";
    import { currentNotePath } from "$lib/stores/currentNotePath";

    let openedItems: FileSystemItem[] = [];
    let unlistenItemOpened: UnlistenFn;
    let unlistenItemClosed: UnlistenFn;

    onMount(async () => {
        // Load initial opened items
        try {
            openedItems = await invoke("get_opened_items");

            // Sort items: directories first, then files, both sorted alphabetically
            openedItems.sort((a, b) => {
                if (a.is_directory && !b.is_directory) return -1;
                if (!a.is_directory && b.is_directory) return 1;
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

            if (item.is_note) {
                $currentNotePath = item.path; // Update the current note path store
            }

            // Remove existing item with same path and add new one
            openedItems = openedItems.filter((f) => f.path !== item.path);
            openedItems.push(item);

            // Sort items: directories first, then files, both sorted alphabetically
            openedItems.sort((a, b) => {
                if (a.is_directory && !b.is_directory) return -1;
                if (!a.is_directory && b.is_directory) return 1;
                return a.name.localeCompare(b.name);
            });
        });

        unlistenItemClosed = await listen("item-closed", (event) => {
            const itemPath = event.payload;
            openedItems = openedItems.filter((f) => f.path !== itemPath);
        });
    });

    onDestroy(() => {
        if (unlistenItemOpened) unlistenItemOpened();
        if (unlistenItemClosed) unlistenItemClosed();
    });

    async function closeItem(itemPath: string) {
        try {
            await invoke("close_item", { itemPath: itemPath });
        } catch (error) {
            throwCustomError(
                "Failed to close item" + String(error),
                "An error occurred while trying to close the item."
            );
        }
    }

    async function openNote(notePath: string) {
        try {
            await invoke("open_note_from_path", { notePath });
            $currentNotePath = notePath; // Update the current note path store
        } catch (error) {
            throwCustomError(
                "Failed to open note" + String(error),
                "An error occurred while trying to open the note."
            );
        }
    }
</script>

<div class="sidebar">
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

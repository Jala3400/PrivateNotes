<script lang="ts">
    import Item from "$lib/components/molecules/Item.svelte";
    import { throwCustomError } from "$lib/error";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { currentNote } from "$lib/stores/currentNote";
    import type { FileSystemItem } from "$lib/types";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import { ask } from "@tauri-apps/plugin-dialog";
    import { onDestroy, onMount } from "svelte";

    let openedItems: FileSystemItem[] = $state([]);
    let unlistenItemOpened: UnlistenFn;
    let unlistenItemClosed: UnlistenFn;
    let unlistenItemRenamed: UnlistenFn;

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
                "Failed to load opened items " + error,
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
        });

        unlistenItemClosed = await listen("item-closed", (event) => {
            const itemId = event.payload;
            openedItems = openedItems.filter((f) => f.id !== itemId);
        });

        unlistenItemRenamed = await listen("note-renamed", (event) => {
            const [id, parentId, newTitle] = event.payload as [
                string,
                string,
                string,
            ];

            const item = findItem(id, parentId, openedItems);

            if (item) {
                item.name = newTitle;
            }
        });
    });

    onDestroy(() => {
        unlistenItemOpened?.();
        unlistenItemClosed?.();
        unlistenItemRenamed?.();
    });

    // Recursively search for the item in openedItems and their children
    function findItem(
        id: string,
        parentId: string,
        items: FileSystemItem[]
    ): FileSystemItem | undefined {
        for (const item of items) {
            if (item.id === id && item.parentId === parentId) return item;
            if (item.children) {
                const found = findItem(id, parentId, item.children);
                if (found) return found;
            }
        }
        return undefined;
    }

    async function closeItem(id: string) {
        // Check if the current note is the one being closed
        if ($currentNote?.parentId === id && $currentNote?.unsaved) {
            // Create a Yes/No dialog
            const answer = await ask(
                "This item is currently open in the editor. Do you want to close it? Unsaved changes will be lost.",
                {
                    title: "Unsaved Changes",
                    kind: "warning",
                }
            );

            if (answer === false) {
                // User chose not to proceed
                return;
            }
        }

        // Close the item
        try {
            // On the back end this will emit an "item-closed" event
            // which will be listened to in the Sidebar component to remove the item
            // and on the NoteEditor component to reset the editor
            await invoke("close_item", { id });
        } catch (error) {
            throwCustomError(
                "Failed to close item " + error,
                "An error occurred while trying to close the item."
            );
        }
    }

    async function openNote(id: string, parentId: string) {
        try {
            if ($currentNote?.unsaved) {
                const answer = await ask(
                    "You have unsaved changes in the current note. Do you want to proceed? Unsaved changes will be lost.",
                    {
                        title: "Unsaved Changes",
                        kind: "warning",
                    }
                );

                if (answer === false) {
                    // User chose not to proceed
                    return;
                }
            }

            await invoke("open_note_from_id", { id, parentId });
        } catch (error) {
            throwCustomError(
                "Failed to open note " + error,
                "An error occurred while trying to open the note."
            );
        }
    }
</script>

<div class="sidebar" class:collapsed={$appearanceConfig.sidebarCollapsed}>
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

        background-color: var(--background-dark-light);
        border-right: 1px solid var(--border-color-dark);

        overflow: hidden;

        user-select: none;

        transition: var(--transition);
    }

    .sidebar.collapsed {
        border: none;
    }

    .sidebar-header {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        height: var(--top-height);
        padding: 0.5em;
        border-bottom: 1px solid var(--border-color);
        font-weight: bold;
        font-size: fit-content;
    }

    .sidebar-content {
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .empty-state {
        color: var(--text-muted);
    }
</style>

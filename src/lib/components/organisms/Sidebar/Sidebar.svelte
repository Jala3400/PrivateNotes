<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import type { FileSystemItem } from "$lib/types";
    import Folder from "$lib/components/molecules/Folder.svelte";
    import { throwCustomError } from "$lib/error";
    import { currentNotePath } from "$lib/stores/currentNotePath";

    let openedItems: FileSystemItem[] = [];
    let unlistenFolderOpened: UnlistenFn;
    let unlistenFolderClosed: UnlistenFn;

    onMount(async () => {
        // Load initial opened folders
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
                "Failed to load opened folders" + String(error),
                "An error occurred while trying to load the opened folders."
            );
        }

        // Listen for folder events
        unlistenFolderOpened = await listen("item-opened", (event) => {
            const item = event.payload as FileSystemItem;

            if (item.is_note) {
                $currentNotePath = item.path; // Update the current note path store
            }

            // Remove existing folder with same path and add new one
            openedItems = openedItems.filter((f) => f.path !== item.path);
            openedItems.push(item);

            // Sort items: directories first, then files, both sorted alphabetically
            openedItems.sort((a, b) => {
                if (a.is_directory && !b.is_directory) return -1;
                if (!a.is_directory && b.is_directory) return 1;
                return a.name.localeCompare(b.name);
            });
        });

        unlistenFolderClosed = await listen("folder-closed", (event) => {
            const folderPath = event.payload;
            openedItems = openedItems.filter((f) => f.path !== folderPath);
        });
    });

    onDestroy(() => {
        if (unlistenFolderOpened) unlistenFolderOpened();
        if (unlistenFolderClosed) unlistenFolderClosed();
    });

    async function closeFolder(folderPath: string) {
        try {
            await invoke("close_folder", { folderPath });
        } catch (error) {
            throwCustomError(
                "Failed to close folder" + String(error),
                "An error occurred while trying to close the folder."
            );
        }
    }

    async function openNote(notePath: string) {
        try {
            await invoke("open_note_from_folder", { notePath });
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
        <h2>Opened Folders</h2>
    </div>

    <div class="sidebar-content">
        {#if openedItems.length === 0}
            <div class="empty-state">
                <p>No folders opened</p>
                <small>Drop a folder with a .lockd directory to open it</small>
            </div>
        {:else}
            {#each openedItems as folder}
                <Folder item={folder} {closeFolder} {openNote} />
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

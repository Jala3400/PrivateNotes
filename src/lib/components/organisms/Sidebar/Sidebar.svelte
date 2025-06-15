<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import type { OpenedFolder } from "$lib/types";
    import Folder from "$lib/components/molecules/Folder.svelte";

    let openedFolders: OpenedFolder[] = [];
    let unlistenFolderOpened: UnlistenFn;
    let unlistenFolderClosed: UnlistenFn;

    onMount(async () => {
        // Load initial opened folders
        try {
            openedFolders = await invoke("get_opened_folders");
        } catch (error) {
            console.error("Failed to load opened folders:", error);
        }

        // Listen for folder events
        unlistenFolderOpened = await listen("folder-opened", (event) => {
            const folder = event.payload as OpenedFolder;
            // Remove existing folder with same path and add new one
            openedFolders = openedFolders.filter((f) => f.path !== folder.path);
            openedFolders.push(folder);
            openedFolders.sort((a, b) => a.name.localeCompare(b.name));
        });

        unlistenFolderClosed = await listen("folder-closed", (event) => {
            const folderPath = event.payload;
            openedFolders = openedFolders.filter((f) => f.path !== folderPath);
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
            console.error("Failed to close folder:", error);
        }
    }

    async function openNote(notePath: string) {
        try {
            await invoke("open_note_from_folder", { notePath });
        } catch (error) {
            console.error("Failed to open note:", error);
        }
    }
</script>

<div class="sidebar">
    <div class="sidebar-header">
        <h2>Opened Folders</h2>
    </div>

    <div class="sidebar-content">
        {#if openedFolders.length === 0}
            <div class="empty-state">
                <p>No folders opened</p>
                <small>Drop a folder with a .lockd directory to open it</small>
            </div>
        {:else}
            {#each openedFolders as folder}
                <Folder {folder} {closeFolder} {openNote} />
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

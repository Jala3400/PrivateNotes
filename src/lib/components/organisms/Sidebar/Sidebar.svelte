<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen, type UnlistenFn } from "@tauri-apps/api/event";
    import type { OpenedFolder } from "$lib/types";

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
                <div class="folder-item">
                    <div class="folder-header">
                        <div class="folder-info">
                            <span class="folder-icon">></span>
                            <span class="folder-name">{folder.name}</span>
                        </div>
                        <button
                            class="close-btn"
                            on:click={() => closeFolder(folder.path)}
                            title="Close folder"
                        >
                            ✕
                        </button>
                    </div>

                    <div class="notes-list">
                        {#if folder.notes.length === 0}
                            <div class="no-notes">---</div>
                        {:else}
                            {#each folder.notes as note}
                                <button
                                    class="note-item"
                                    on:click={() => openNote(note.path)}
                                    title="Open note: {note.name}"
                                >
                                    <span class="note-name">{note.name}</span>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
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
    }

    .folder-item {
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        padding: 0.5em;
        border-radius: var(--border-radius-medium);
        background-color: var(--background-dark);
    }

    .sidebar-content {
        display: flex;
        flex-direction: column;
        gap: 0.8em;
    }

    .empty-state {
        color: var(--text-secondary);
    }

    .folder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .folder-info {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .folder-name {
        font-weight: 500;
        color: var(--text-primary);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.2em;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }

    .notes-list {
        display: flex;
        flex-direction: column;
        gap: 0.2em;
        margin-top: 0.5em;
    }

    .note-item {
        text-align: left;
        background: none;
        border: none;
        padding: 0.4em 0.6em;
        border-radius: var(--border-radius-small);
        cursor: pointer;
        color: var(--text-secondary);
    }

    .note-item:hover {
        background-color: var(--background-dark-lighter);
        color: var(--text-primary);
    }

    .no-notes {
        text-align: center;
        color: var(--text-secondary);
    }
</style>

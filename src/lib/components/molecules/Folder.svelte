<script lang="ts">
    import type { OpenedFolder } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        folder: OpenedFolder;
        closeFolder: (path: string) => void;
        openNote: (path: string) => void;
    }

    let { folder, closeFolder, openNote }: Props = $props();
</script>

<div class="folder-item">
    <div class="folder-header">
        <div class="folder-info">
            <span class="folder-name">{folder.name}</span>
        </div>
        <button
            class="close-btn"
            onclick={() => closeFolder(folder.path)}
            title="Close folder"
        >
            ✕
        </button>
    </div>
    <div class="file-tree">
        {#if folder.file_structure.length === 0}
            <div class="no-items">No files</div>
        {:else}
            <DirContents items={folder.file_structure} {openNote} />
        {/if}
    </div>
</div>

<style>
    .folder-item {
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        padding: 0.5em;
        border-radius: var(--border-radius-medium);
        background-color: var(--background-dark);
    }

    .file-tree {
        display: flex;
        flex-direction: column;
        gap: 0.1em;
    }

    .no-items {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.85em;
        padding: 0.5em;
        font-style: italic;
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
</style>

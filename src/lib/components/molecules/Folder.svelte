<script lang="ts">
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        folder: FileSystemItem;
        closeFolder: (path: string) => void;
        openNote: (path: string) => void;
    }

    let { folder, closeFolder, openNote }: Props = $props();
    let collapsed = $state(false);
</script>

<div class="folder-item" class:collapsed>
    <div class="folder-header">
        <button class="folder-title" onclick={() => (collapsed = !collapsed)}>
            <span class="folder-name">{folder.name}</span>
        </button>
        <button
            class="close-btn"
            onclick={(e) => {
                e.stopPropagation();
                closeFolder(folder.path);
            }}
            title="Close folder"
        >
            ✕
        </button>
    </div>

    {#if !collapsed}
        <div class="file-tree">
            {#if !folder.children || folder.children.length === 0}
                <div class="no-items">No files</div>
            {:else}
                <DirContents items={folder.children} {openNote} />
            {/if}
        </div>
    {/if}
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
        cursor: pointer;
    }

    .folder-title {
        display: flex;
        align-items: center;
        gap: 0.5em;
        background: none;
        border: none;
        color: var(--text-primary);
        padding: var(--file-item-padding);
        border-radius: var(--border-radius-small);
        font-size: 1em;
    }

    .folder-name {
        font-weight: 500;
        color: var(--text-primary);
    }

    .close-btn {
        display: none;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.2em;
    }

    .folder-item:hover .close-btn {
        display: block;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }
</style>

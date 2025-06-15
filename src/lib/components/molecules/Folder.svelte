<script lang="ts">
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        folder: FileSystemItem;
        closeFolder: (path: string) => void;
        openNote: (path: string) => void;
    }

    let { folder, closeFolder, openNote }: Props = $props();

    let children = $derived(
        folder.children?.filter((child) => {
            return !(child.is_directory && child.path.endsWith(".lockd"));
        }) || []
    );

    // It only gives the initial value once
    // svelte-ignore state_referenced_locally
    let collapsed = $state(children.length == 0);
</script>

{#if folder.is_note}
    <div class="folder-item note-file">
        <div class="folder-header">
            <button
                class="folder-title"
                onclick={() => openNote(folder.path)}
                title="Open note"
            >
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
    </div>
{:else}
    <div class="folder-item" class:collapsed>
        <div class="folder-header">
            <button
                class="folder-title"
                onclick={() => (collapsed = !collapsed)}
            >
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

        {#if !collapsed && !folder.is_note}
            <div class="file-tree">
                {#if !children || children.length === 0}
                    <div class="no-items">No files</div>
                {:else}
                    <DirContents items={children} {openNote} />
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .folder-item {
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        padding: 0.5em;
        border-radius: var(--border-radius-medium);
        background-color: var(--background-dark);
    }

    .folder-item.note-file .folder-name {
        color: var(--main-color);
    }

    .folder-item.note-file:hover .folder-name {
        color: var(--main-color-light);
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
        flex: 1;
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

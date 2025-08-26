<script lang="ts">
    import { currentNote } from "$lib/stores/currentNote";
    import type { FileSystemItem } from "$lib/types";
    import Directory from "./Directory.svelte";

    interface Props {
        items: FileSystemItem[];
        openNote: (id: string, parentId: string) => void;
    }
    let { items, openNote }: Props = $props();
</script>

{#each items || [] as item}
    <div class="tree-item">
        {#if item.isDirectory}
            <!-- Key is necessary to keep the subfolders collapsed -->
            {#key item.id}
                <Directory {item} {openNote} />
            {/key}
        {:else}
            <button
                class="file-item"
                class:note-file={item.isNote}
                class:current-note={$currentNote?.id === item.id}
                onclick={() =>
                    item.isNote ? openNote(item.id, item.parentId) : null}
                disabled={!item.isNote}
                title={item.name}
            >
                <span class="item-name">
                    {item.name}
                </span>

                {#if $currentNote?.id === item.id && $currentNote?.unsaved}
                    <span class="save-indicator"> ●️ </span>
                {/if}
            </button>
        {/if}
    </div>
{/each}

<style>
    .tree-item {
        display: flex;
        flex-direction: column;
    }

    .file-item {
        display: flex;
        align-items: center;
        gap: 0.3em;
        padding: var(--file-item-padding);
        border-radius: var(--border-radius-small);
        font-size: 0.85em;
        width: 100%;
        padding-left: var(--folder-indicator-width);
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
    }

    .file-item:hover {
        background-color: var(--background-dark-lighter);
    }

    .file-item:disabled {
        cursor: default;
    }

    .file-item:disabled:hover {
        background-color: transparent;
    }

    /* Notes should be styles different from normal files */
    .file-item.note-file {
        cursor: pointer;
    }

    .file-item.note-file:hover {
        background-color: var(--background-dark-lighter);
    }

    .current-note {
        background-color: var(--background-dark-lighter);
    }

    .item-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-muted);
    }

    .file-item:hover .item-name {
        color: var(--text-primary);
    }

    .file-item:disabled:hover .item-name {
        color: var(--text-muted);
    }

    .note-file .item-name {
        color: var(--main-color);
    }

    .note-file:hover .item-name {
        color: var(--main-color-light);
    }

    .save-indicator {
        color: var(--text-muted);
    }

    .file-item:hover .save-indicator {
        color: var(--text-primary);
    }

    .current-note .item-name {
        color: var(--main-color-light);
    }
</style>

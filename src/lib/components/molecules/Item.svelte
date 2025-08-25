<script lang="ts">
    import { currentNote } from "$lib/stores/currentNote";
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        item: FileSystemItem;
        closeItem: (id: string, parentId: string) => void;
        openNote: (id: string, parentId: string) => void;
        unsaved?: boolean;
    }

    let { item, closeItem, openNote, unsaved }: Props = $props();
    let children = $derived(
        item.children?.filter((child) => {
            return !(child.isDirectory && child.name == ".lockd");
        }) || []
    );

    // It should be collapsed if there are no children
    // For some reason the derived store doesn't work correctly and
    // it allows to change the collapsed value
    let collapsed = $derived(children.length == 0);
</script>

{#if item.isNote}
    <div
        class="item note-file"
        class:current-note={$currentNote?.id === item.id}
    >
        <div class="item-header">
            <button
                class="item-title"
                onclick={() => openNote(item.id, item.parentId || "")}
                title={item.name}
            >
                <span class="item-name">
                    {item.name}
                </span>

                {#if unsaved}
                    <span class="save-indicator"> ●️ </span>
                {/if}
            </button>
            <button
                class="close-btn"
                onclick={(e) => {
                    e.stopPropagation();
                    closeItem(item.id, item.parentId);
                }}
                title="Close '{item.name}'"
            >
                ✕
            </button>
        </div>
    </div>
{:else}
    <div class="item" class:collapsed>
        <div class="item-header">
            <button class="item-title" onclick={() => (collapsed = !collapsed)}>
                <span class="item-name">{item.name}</span>
            </button>
            <button
                class="close-btn"
                onclick={(e) => {
                    e.stopPropagation();
                    closeItem(item.id, item.parentId);
                }}
                title="Close '{item.name}'"
            >
                ✕
            </button>
        </div>

        {#if !collapsed && !item.isNote}
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
    .item {
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        padding: 0.5em;
        border-radius: var(--border-radius-medium);
        background-color: var(--background-dark);
    }

    .current-note {
        background-color: var(--background-dark-lighter);
    }

    .item.note-file .item-name {
        text-align: left;
        color: var(--main-color);
    }

    .item.note-file:hover .item-name {
        color: var(--main-color-light);
    }

    .file-tree {
        display: flex;
        flex-direction: column;
        gap: 0.1em;
    }

    .no-items {
        text-align: center;
        color: var(--text-muted);
        font-size: 0.85em;
        padding: 0.5em;
        font-style: italic;
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }

    .item-title {
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
        overflow: hidden;
    }

    .item-name {
        font-weight: 500;
        color: var(--text-primary);
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    .save-indicator {
        color: var(--text-muted);
    }

    .item:hover .save-indicator {
        color: var(--text-primary);
    }

    .close-btn {
        display: none;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.2em;
    }

    .item:hover .close-btn {
        display: block;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }
</style>

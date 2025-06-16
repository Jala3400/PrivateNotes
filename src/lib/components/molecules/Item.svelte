<script lang="ts">
    import { currentNoteId } from "$lib/stores/currentNoteId";
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        item: FileSystemItem;
        closeItem: (id: string) => void;
        openNote: (id: string) => void;
    }

    let { item, closeItem, openNote }: Props = $props();
    let children = $derived(
        item.children?.filter((child) => {
            return !(child.is_directory && child.name == ".lockd");
        }) || []
    );

    // It should be collapsed if there are no children
    // For some reason the derived store doesn't work correctly and
    // it allows to change the collapsed value
    let collapsed = $derived(children.length == 0);
</script>

{#if item.is_note}
    <div class="item note-file" class:current-note={$currentNoteId === item.id}>
        <div class="item-header">
            <button
                class="item-title"
                onclick={() => openNote(item.id)}
                title="Open note"
            >
                <span class="item-name">{item.name}</span>
            </button>
            <button
                class="close-btn"
                onclick={(e) => {
                    e.stopPropagation();
                    closeItem(item.id);
                }}
                title="Close item"
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
                    closeItem(item.id);
                }}
                title="Close item"
            >
                ✕
            </button>
        </div>

        {#if !collapsed && !item.is_note}
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
        color: var(--text-secondary);
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
    }

    .item-name {
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

    .item:hover .close-btn {
        display: block;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }
</style>

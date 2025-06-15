<script lang="ts">
    import Directory from "./Directory.svelte";
    import type { FileSystemItem } from "$lib/types";

    interface Props {
        items: FileSystemItem[];
        openNote: (path: string) => void;
    }
    let { items, openNote }: Props = $props();
</script>

{#each items || [] as child}
    {#if !(child.is_directory && child.name.startsWith("."))}
        <div class="tree-item">
            {#if child.is_directory}
                <Directory item={child} {openNote} />
            {:else}
                <button
                    class="file-item"
                    class:note-file={child.is_note}
                    onclick={() =>
                        child.is_note ? openNote(child.path) : null}
                    disabled={!child.is_note}
                >
                    <span class="item-name">{child.name}</span>
                </button>
            {/if}
        </div>
    {/if}
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
        color: var(--text-secondary);
        width: 100%;
        padding-left: var(--folder-indicator-width);
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
    }

    .file-item:hover {
        background-color: var(--background-dark-lighter);
        color: var(--text-primary);
    }

    .file-item:disabled {
        cursor: default;
        opacity: 0.7;
    }

    .file-item:disabled:hover {
        background-color: transparent;
        color: var(--text-secondary);
    }

    .file-item.note-file {
        color: var(--main-color);
        cursor: pointer;
    }

    .file-item.note-file:hover {
        color: var(--main-color-light);
        background-color: var(--background-dark-lighter);
    }

    .item-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

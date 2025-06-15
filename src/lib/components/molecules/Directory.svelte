<script lang="ts">
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";

    interface Props {
        item: FileSystemItem;
        openNote: (path: string) => void;
    }

    let { item, openNote }: Props = $props();

    let isOpen = $state(false);
</script>

<div class="directory">
    <button class="directory-toggle" onclick={() => (isOpen = !isOpen)}>
        <span class="expand-icon">
            {isOpen ? "▼" : "▶"}
        </span>
        <span class="item-name">{item.name}</span>
    </button>
    {#if isOpen}
        <div class="dir-contents">
            <DirContents items={item.children || []} {openNote} />
        </div>
    {/if}
</div>

<style>
    .expand-icon {
        font-size: 0.7em;
        width: 12px;
        text-align: center;
    }

    .directory-toggle {
        display: flex;
        align-items: center;
        gap: 0.3em;
        background: none;
        border: none;
        padding: 0.2em 0.3em;
        border-radius: var(--border-radius-small);
        color: var(--text-primary);
        width: 100%;
    }

    .directory-toggle:hover {
        background-color: var(--background-dark-lighter);
        color: var(--text-primary);
    }

    .dir-contents {
        padding-left: 0.5em;
        margin-left: 0.5em;
        border-left: 1px solid var(--background-dark-lighter);
    }
</style>

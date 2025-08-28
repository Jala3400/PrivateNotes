<script lang="ts">
    import type { FileSystemItem } from "$lib/types";
    import DirContents from "./DirContents.svelte";
    import ExpandedIcon from "$lib/components/atoms/ExpandedIcon.svelte";

    interface Props {
        item: FileSystemItem;
        openNote: (id: string, parentId: string) => void;
    }

    let { item, openNote }: Props = $props();

    let collapsed = $state(item.collapsed);
</script>

<div class="directory">
    <button
        class="directory-toggle"
        onclick={() => {
            collapsed = !collapsed;
            item.collapsed = collapsed;
        }}
        title={item.name}
    >
        <ExpandedIcon expanded={!collapsed} />
        <span class="item-name">{item.name}</span>
    </button>
    {#if !collapsed}
        <div class="dir-contents">
            <DirContents items={item.children || []} {openNote} />
        </div>
    {/if}
</div>

<style>
    .item-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        font-size: 1em;
    }

    .directory-toggle:hover {
        background-color: var(--background-dark-lighter);
        color: var(--text-primary);
    }

    .dir-contents {
        margin-left: 0.5em;
    }
</style>

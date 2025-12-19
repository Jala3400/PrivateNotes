<script lang="ts">
    import { onMount } from "svelte";
    import { contextMenuStore, type ContextMenuItem } from "./contextMenuStore";

    let menuElement = $state<HTMLDivElement>();
    let adjustedX = $state(0);
    let adjustedY = $state(0);

    /**
     * Calculate menu position to ensure it stays within viewport bounds
     */
    function calculatePosition(x: number, y: number) {
        if (!menuElement) return;

        const menuRect = menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate initial position
        let finalX = x;
        let finalY = y;

        // Check if menu goes beyond right edge
        if (x + menuRect.width > viewportWidth) {
            finalX = viewportWidth - menuRect.width - 10; // 10px padding
        }

        // Check if menu goes beyond bottom edge
        if (y + menuRect.height > viewportHeight) {
            finalY = viewportHeight - menuRect.height - 10; // 10px padding
        }

        // Ensure menu doesn't go beyond left edge
        if (finalX < 10) {
            finalX = 10;
        }

        // Ensure menu doesn't go beyond top edge
        if (finalY < 10) {
            finalY = 10;
        }

        adjustedX = finalX;
        adjustedY = finalY;
    }

    function handleItemClick(item: ContextMenuItem) {
        if (item.type !== "separator" && item.action) {
            item.action();
            contextMenuStore.hide();
        }
    }

    function handleClickOutside(event: MouseEvent) {
        if (
            $contextMenuStore.show &&
            menuElement &&
            !menuElement.contains(event.target as Node)
        ) {
            contextMenuStore.hide();
        }
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape" && $contextMenuStore.show) {
            contextMenuStore.hide();
        }
    }

    // Update position when show state changes or position changes
    $effect(() => {
        if ($contextMenuStore.show) {
            // Need to wait for next tick to get accurate dimensions
            calculatePosition($contextMenuStore.x, $contextMenuStore.y);
        }
    });

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    });
</script>

{#if $contextMenuStore.show}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
        class="context-menu"
        bind:this={menuElement}
        style="left: {adjustedX}px; top: {adjustedY}px; z-index: 9999;"
        role="menu"
        onmousedown={(e) => e.preventDefault()}
    >
        {#each $contextMenuStore.items as item, index (index)}
            {#if item.type === "separator"}
                <div class="context-menu-separator"></div>
            {:else}
                <button
                    class="context-menu-item"
                    onclick={() => handleItemClick(item)}
                    role="menuitem"
                >
                    <span class="context-menu-text">{item.text}</span>
                </button>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .context-menu {
        position: fixed;
        display: flex;
        flex-direction: column;
        padding: 0.25em;
        background-color: var(--background-dark-light);
        border: 1px solid var(--border-color-dark);
        border-radius: var(--border-radius-medium);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 160px;
        overflow: hidden;
        font-family: inherit;

        /* Modern CSS viewport constraints */
        max-inline-size: calc(100vi - 2rem);
        max-block-size: calc(100vb - 2rem);
        inset-inline-start: clamp(
            1rem,
            var(--menu-x),
            calc(100vi - 160px - 1rem)
        );
        inset-block-start: clamp(
            1rem,
            var(--menu-y),
            calc(100vb - 330px - 1rem)
        );
    }

    .context-menu-item {
        padding: 0.5em 0.66em;
        cursor: pointer;
        font-size: 14px;
        color: var(--text-primary);
        background-color: var(--background-dark-light);
        border: none;
        text-align: left;
    }

    .context-menu-item,
    .context-menu-separator {
        width: 100%;
    }

    .context-menu-item {
        border-radius: var(--border-radius-small);
    }

    .context-menu-item:hover {
        background-color: var(--background-dark-lighter);
    }

    .context-menu-item:active {
        background-color: var(--main-color);
        color: var(--background-dark);
    }

    .context-menu-separator {
        height: 1px;
        background-color: var(--border-color-dark);
        margin: 0.3em 0;
    }
</style>

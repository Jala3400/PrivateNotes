<script lang="ts">
    import { onMount } from "svelte";
    import type { ContextMenuItem } from "./contextMenuManager";

    interface Props {
        show: boolean;
        x: number;
        y: number;
        items: ContextMenuItem[];
        onItemClick: (itemId: string) => void;
        onClose: () => void;
    }

    let { show = false, x = 0, y = 0, items = [], onItemClick, onClose }: Props = $props();

    let menuElement = $state<HTMLDivElement>();
    let adjustedX = $state(0);
    let adjustedY = $state(0);

    /**
     * Calculate menu position to ensure it stays within viewport bounds
     */
    function calculatePosition() {
        if (!menuElement || !show) return;

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
            onItemClick(item.id);
        }
    }

    function handleClickOutside(event: MouseEvent) {
        if (show && menuElement && !menuElement.contains(event.target as Node)) {
            onClose();
        }
    }

    function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape" && show) {
            onClose();
        }
    }

    // Update position when show state changes or position changes
    $effect(() => {
        if (show) {
            // Need to wait for next tick to get accurate dimensions
            requestAnimationFrame(() => {
                calculatePosition();
            });
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

{#if show}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
        class="context-menu"
        bind:this={menuElement}
        style="left: {adjustedX}px; top: {adjustedY}px;"
        role="menu"
        onmousedown={(e) => e.preventDefault()}
    >
        {#each items as item (item.id)}
            {#if item.type === "separator" || item.text === "---"}
                <div class="context-menu-separator"></div>
            {:else}
                <button
                    class="context-menu-item"
                    onclick={() => handleItemClick(item)}
                    role="menuitem"
                >
                    {item.text}
                </button>
            {/if}
        {/each}
    </div>
{/if}


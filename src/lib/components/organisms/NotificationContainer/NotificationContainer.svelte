<script lang="ts">
    import {
        notifications,
        removeNotification,
    } from "$lib/stores/notifications";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
</script>

<div class="notification-container">
    {#each $notifications as notification (notification.id)}
        <div
            role="presentation"
            class="notification notification-{notification.type}"
            onclick={() => removeNotification(notification.id)}
            in:fly={{ x: 300, duration: 150, easing: quintOut }}
            out:fly={{ x: 300, duration: 150, easing: quintOut }}
        >
            {notification.message}
        </div>
    {/each}
</div>

<style>
    .notification-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        bottom: 1em;
        right: 1em;
        z-index: 1000;
        user-select: none;
    }

    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5em 0.7em;
        border-radius: var(--border-radius-medium);
        background-color: var(--background-dark);
        cursor: pointer;
        max-width: 25em;
        min-width: 25em;
    }

    .notification-success {
        border: 1px solid var(--main-color);
    }

    .notification-error {
        border: 1px solid var(--danger-color);
    }

    .notification-info {
        border: 1px solid var(--border-color);
    }
</style>

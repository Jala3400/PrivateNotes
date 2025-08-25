<script lang="ts">
    import { throwCustomError } from "$lib/error";
    import { runCommandScript } from "$lib/stores/commandList";
    import { loadConfigFile } from "$lib/stores/configGroups";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";
    import { NotificationType } from "$lib/types";
    import {
        addNotification,
        notifications,
        removeNotification,
    } from "$lib/stores/notifications";

    let { children } = $props();

    let unlistenCustomError: (() => void) | undefined;
    let unlistenRcOpen: (() => void) | undefined;
    let unlistenConfigOpen: (() => void) | undefined;

    $effect(() => {
        if ($appearanceConfig) {
            document.documentElement.style.setProperty(
                "--font-size",
                `${$appearanceConfig.fontSize}px`
            );
            document.documentElement.style.setProperty(
                "--font-family",
                $appearanceConfig.fontFamily
            );
        }
    });

    onMount(async () => {
        unlistenCustomError = await listen("error", async (event) => {
            throwCustomError(event.payload as string);
        });

        unlistenRcOpen = await listen("rc-opened", async (event) => {
            runCommandScript(event.payload as string);
            addNotification(
                "Command script executed",
                NotificationType.SUCCESS
            );
        });

        unlistenConfigOpen = await listen("config-opened", async (event) => {
            loadConfigFile(
                JSON.parse(event.payload as string) as Record<
                    string,
                    Record<string, any>
                >
            );
            addNotification("Configuration loaded", NotificationType.SUCCESS);
        });
    });

    onDestroy(() => {
        unlistenCustomError?.();
        unlistenRcOpen?.();
        unlistenConfigOpen?.();
    });
</script>

<!-- CustomNotifications container -->
<div class="notification-container">
    {#each $notifications as notification (notification.id)}
        <div
            role="presentation"
            class="notification notification-{notification.type}"
            onclick={() => removeNotification(notification.id)}
        >
            {notification.message}
        </div>
    {/each}
</div>

{@render children()}

<style>
    .notification-container {
        position: fixed;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        bottom: 1em;
        right: 1em;
        z-index: 1000;
    }

    .notification {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5em 0.7em;
        border-radius: var(--border-radius-medium);
        cursor: pointer;
        max-width: 15em;
        min-width: 15em;
    }

    .notification-success {
        border: 2px solid var(--main-color);
    }

    .notification-error {
        border: 2px solid var(--danger-color);
    }

    .notification-info {
        border: 2px solid var(--border-color);
    }
</style>

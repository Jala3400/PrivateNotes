<script lang="ts">
    import { throwCustomError } from "$lib/error";
    import { runCommandScript } from "$lib/stores/commandList";
    import { loadConfigFile } from "$lib/stores/configGroups";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";
    import { NotificationType } from "$lib/types";
    import { addNotification } from "$lib/stores/notifications";
    import NotificationContainer from "$lib/components/organisms/NotificationContainer/NotificationContainer.svelte";
    import { GlobalContextMenu } from "$lib/components/organisms/GlobalContextMenu";

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

<NotificationContainer />
<GlobalContextMenu />

{@render children()}

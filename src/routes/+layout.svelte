<script lang="ts">
    import { throwCustomError } from "$lib/error";
    import { runCommandScript } from "$lib/stores/commandList";
    import { loadConfigFile } from "$lib/stores/configGroups";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";

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
            // Handle error events
            throwCustomError(event.payload as string);
        });

        unlistenRcOpen = await listen("rc-opened", async (event) => {
            // Handle rc-opened events
            runCommandScript(event.payload as string);
        });

        unlistenConfigOpen = await listen("config-opened", async (event) => {
            // Handle config-opened events
            loadConfigFile(
                JSON.parse(event.payload as string) as Record<
                    string,
                    Record<string, any>
                >
            );
        });
    });

    onDestroy(() => {
        unlistenCustomError?.();
        unlistenRcOpen?.();
        unlistenConfigOpen?.();
    });
</script>

{@render children()}

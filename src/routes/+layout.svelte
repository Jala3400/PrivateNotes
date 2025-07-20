<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import { throwCustomError } from "$lib/error";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { runCommandScript } from "$lib/stores/commandList";
    import { loadConfigFile } from "$lib/stores/configGroups";
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

        // Load initial configuration
        try {
            const initialConfig: string = await invoke("get_default_config");

            if (initialConfig) {
                loadConfigFile(
                    JSON.parse(initialConfig) as Record<
                        string,
                        Record<string, any>
                    >
                );
            }
        } catch (error) {
            throwCustomError(
                "Failed to load initial configuration: " + error,
                "An error occurred while loading the initial configuration."
            );
        }
    });

    onDestroy(() => {
        unlistenCustomError?.();
        unlistenRcOpen?.();
        unlistenConfigOpen?.();
    });
</script>

{@render children()}

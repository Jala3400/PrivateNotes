<script lang="ts">
    import { listen } from "@tauri-apps/api/event";
    import { throwCustomError } from "$lib/error";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { runCommandList as runCommandScript } from "$lib/stores/commandList";

    let { children } = $props();

    let unlistenCustomError: (() => void) | undefined;
    let unlistenRcOpen: (() => void) | undefined;

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
    });

    onDestroy(() => {
        unlistenCustomError?.();
        unlistenRcOpen?.();
    });
</script>

{@render children()}

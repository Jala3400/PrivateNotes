<script lang="ts">
    import { listen } from "@tauri-apps/api/event";
    import { throwCustomError } from "$lib/error";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";

    let { children } = $props();

    let unlisten: (() => void) | undefined;

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
        unlisten = await listen("error", async (event) => {
            // Handle error events
            throwCustomError(event.payload as string);
        });
    });

    onDestroy(() => {
        if (unlisten) {
            unlisten();
        }
    });
</script>

{@render children()}

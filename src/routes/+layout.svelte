<script lang="ts">
    import { listen } from "@tauri-apps/api/event";
    import { throwCustomError } from "$lib/error";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";

    let unlisten: (() => void) | undefined;

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

<slot />

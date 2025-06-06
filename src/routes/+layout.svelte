<script lang="ts">
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";

    let unlisten: (() => void) | undefined;

    onMount(async () => {
        unlisten = await listen("error", async (event) => {
            // Handle error events
            alert(event.payload);
            console.error("Error event received:", event.payload);
        });
    });

    onDestroy(() => {
        if (unlisten) {
            unlisten();
        }
    });
</script>

<slot />

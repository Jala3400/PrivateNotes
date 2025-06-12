<script lang="ts">
    import { listen } from "@tauri-apps/api/event";
    import { message } from "@tauri-apps/plugin-dialog";
    import { onDestroy, onMount } from "svelte";
    import "../app.css";

    let unlisten: (() => void) | undefined;

    onMount(async () => {
        unlisten = await listen("error", async (event) => {
            // Handle error events
            console.error("Error event received:", event.payload);
            await message(String(event.payload), { kind: "error" });
        });
    });

    onDestroy(() => {
        if (unlisten) {
            unlisten();
        }
    });
</script>

<slot />

<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import ToolButton from "$lib/components/atoms/ToolButton.svelte";
    import { throwCustomError } from "$lib/error";

    let tools = [
        {
            name: "Reset the app",
            icon: "R",
            action: async () => {
                try {
                    await invoke("reset_app");
                    // Navigate to login page after resetting the state
                    window.location.replace("/");
                } catch (error) {
                    throwCustomError(
                        "Failed to reset the app" + String(error),
                        "An error occurred while trying to reset the app. Please try again."
                    );
                }
            },
        },
    ];
</script>

<div class="toolsbar">
    {#each tools as tool}
        <ToolButton name={tool.name} icon={tool.icon} onClick={tool.action} />
    {/each}
</div>

<style>
    .toolsbar {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 0.5em;

        padding: 0.5em;

        background-color: var(--background-dark-light);
        border-right: 1px solid var(--background-dark-lighter);
    }
</style>

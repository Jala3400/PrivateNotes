<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import ToolButton from "$lib/components/atoms/ToolButton.svelte";
    import { throwCustomError } from "$lib/error";

    interface Props {
        sidebar_collapsed?: boolean;
    }

    let { sidebar_collapsed = $bindable(false) }: Props = $props();

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
    <div class="top-toolsbar">
        <ToolButton
            name="Toggle Sidebar"
            icon={sidebar_collapsed ? ">" : "<"}
            onClick={() => (sidebar_collapsed = !sidebar_collapsed)}
        />
    </div>
    <div class="main-toolsbar">
        {#each tools as tool}
            <ToolButton
                name={tool.name}
                icon={tool.icon}
                onClick={tool.action}
            />
        {/each}
    </div>
</div>

<style>
    .toolsbar {
        display: flex;
        flex-direction: column;
        align-items: center;

        width: 3em;
        height: 100%;

        background-color: var(--background-dark-light);
        border-right: 1px solid var(--background-dark-lighter);
    }

    .top-toolsbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;

        width: 100%;
        border-bottom: 1px solid var(--background-dark-lighter);
        padding: 0.5em;
    }

    .main-toolsbar {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5em;

        width: 100%;
        padding: 0.5em;
    }
</style>

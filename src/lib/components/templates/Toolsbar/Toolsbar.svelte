<script lang="ts">
    import ToolButton from "$lib/components/atoms/ToolButton.svelte";
    import { throwCustomError } from "$lib/error";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";
    import { invoke } from "@tauri-apps/api/core";
 // Import your store

    interface Props {
        openConfigModal: boolean;
    }

    let { openConfigModal = $bindable() }: Props = $props();

    let tools = [
        {
            name: "Reset the app",
            icon: "R",
            action: async () => {
                try {
                    await invoke("reset_app");
                    window.location.replace("/");
                } catch (error) {
                    throwCustomError(
                        "Failed to reset the app " + error,
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
            icon={$appearanceConfig.sidebarCollapsed ? ">" : "<"}
            onClick={() =>
                ($appearanceConfig.sidebarCollapsed =
                    !$appearanceConfig.sidebarCollapsed)}
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

    <div class="bottom-toolsbar">
        <ToolButton
            name="Settings"
            icon="⚙️"
            onClick={() => (openConfigModal = true)}
        />
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
        border-right: 1px solid var(--border-color-dark);
    }

    .top-toolsbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;

        width: 100%;
        border-bottom: 1px solid var(--border-color-dark);
        padding: 0.5em;
    }

    .main-toolsbar {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5em;
        flex: 1;

        width: 100%;
        padding: 0.5em;
    }

    .bottom-toolsbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5em;

        width: 100%;
        border-top: 1px solid var(--border-color-dark);
        padding: 0.5em;
    }
</style>

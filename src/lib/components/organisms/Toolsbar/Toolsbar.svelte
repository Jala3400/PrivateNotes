<script lang="ts">
    import ToolButton from "$lib/components/atoms/ToolButton.svelte";

    let tools = [
        {
            name: "Reset the app",
            icon: "R",
            action: () => {
                console.log("Reset the app");
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

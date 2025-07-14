<script lang="ts">
    import ConfigSection from "$lib/components/molecules/ConfigSection.svelte";
    import { type ConfigGroup, type ConfigOptions } from "$lib/types";

    interface Props {
        title: string;
        optionsDescription: ConfigGroup;
        configOptions: ConfigOptions;
    }

    let {
        title,
        optionsDescription,
        configOptions = $bindable(),
    }: Props = $props();
</script>

<div class="config-group">
    <h1>{title}</h1>
    <div class="config-sections">
        {#each optionsDescription as [title, section]}
            <ConfigSection
                {title}
                optionsDescription={section}
                bind:configOptions
            />
        {/each}
    </div>
</div>

<style>
    .config-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75em;
    }

    .config-sections {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
    }
</style>

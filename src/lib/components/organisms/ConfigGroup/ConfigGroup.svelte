<script lang="ts">
    import ConfigSection from "$lib/components/molecules/ConfigSection.svelte";
    import {
        type ConfigurationSection,
        type Options,
    } from "$lib/types";

    interface Props {
        title: string;
        sections: ConfigurationSection[];
        configOptions: Options;
        onChange: (newConfig: Options) => void;
    }

    let {
        title,
        sections,
        configOptions = $bindable(),
        onChange,
    }: Props = $props();
</script>

<div class="config-group">
    <h1 class="group-title">{title}</h1>
    <hr class="separator" />
    <div class="config-sections">
        {#each sections as section}
            <ConfigSection
                section={section}
                bind:configOptions={configOptions}
                {onChange}
            />
        {/each}
    </div>
</div>

<style>
    .config-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .separator {
        width: 100%;
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 0.5em 0 1em 0;
        opacity: 1;
    }

    .config-sections {
        display: flex;
        flex-direction: column;
        gap: 0.8em;
        width: 100%;
    }
</style>

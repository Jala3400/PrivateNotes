<script lang="ts">
    import CheckboxOption from "$lib/components/atoms/CheckboxOption.svelte";
    import NumberOption from "$lib/components/atoms/NumberOption.svelte";
    import SelectOption from "../atoms/SelectOption.svelte";
    import {
        OptionType,
        type ConfigOptions,
        type ConfigSection,
    } from "$lib/types";

    interface Props {
        title: string;
        optionsDescription: ConfigSection;
        configOptions: ConfigOptions;
        onChange: (newConfig: ConfigOptions) => void;
    }

    let {
        title,
        optionsDescription,
        configOptions = $bindable(),
        onChange,
    }: Props = $props();
</script>

<div class="config-section">
    <h2>{title}</h2>
    <div class="config-options">
        {#each optionsDescription as [key, option, type]}
            {#if type === OptionType.BOOLEAN}
                <CheckboxOption
                    label={option.label}
                    bind:checked={configOptions[key]}
                    oninput={() => onChange(configOptions)}
                />
            {:else if type === OptionType.NUMBER}
                <NumberOption
                    label={option.label}
                    bind:value={configOptions[key]}
                    min={option.min}
                    max={option.max}
                    oninput={() => onChange(configOptions)}
                />
            {:else if type === OptionType.SELECT}
                <SelectOption
                    label={option.label}
                    bind:value={configOptions[key]}
                    options={option.options ?? []}
                    oninput={() => onChange(configOptions)}
                />
            {/if}
        {/each}
    </div>
</div>

<style>
    .config-section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5em;
    }

    .config-options {
        display: flex;
        flex-direction: column;
        gap: 0.3em;
        width: 100%;
    }
</style>

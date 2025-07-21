<script lang="ts">
    import CheckboxOption from "$lib/components/atoms/CheckboxOption.svelte";
    import NumberOption from "$lib/components/atoms/NumberOption.svelte";
    import SelectOption from "../atoms/SelectOption.svelte";
    import {
        OptionType,
        type Options,
        type ConfigurationSection,
        type ConfigOption,
    } from "$lib/types";

    interface Props {
        section: ConfigurationSection;
        configOptions: Options;
        onChange: (newConfig: Options) => void;
    }

    let { section, configOptions = $bindable(), onChange }: Props = $props();

    function resetOption(option: ConfigOption) {
        configOptions[option.key] = option.defaultValue;
        onChange(configOptions);
    }
</script>

<div class="config-section">
    <h2>{section.name}</h2>
    <div class="config-options">
        {#each section.options as option}
            <div class="option-row">
                <div class="option-label">
                    {#if option.type === OptionType.BOOLEAN}
                        <CheckboxOption
                            label={option.name}
                            bind:checked={configOptions[option.key]}
                            onchange={() => onChange(configOptions)}
                        />
                    {:else if option.type === OptionType.NUMBER}
                        <NumberOption
                            label={option.name}
                            bind:value={configOptions[option.key]}
                            min={option.min}
                            max={option.max}
                            onchange={() => onChange(configOptions)}
                        />
                    {:else if option.type === OptionType.SELECT}
                        <SelectOption
                            label={option.name}
                            bind:value={configOptions[option.key]}
                            options={option.options ?? []}
                            onchange={() => onChange(configOptions)}
                        />
                    {/if}
                </div>
                <button
                    type="button"
                    class="reset-btn"
                    onclick={() => resetOption(option)}
                >
                    Reset
                </button>
            </div>
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

    .option-row {
        display: flex;
        width: 100%;
    }

    .option-row:hover .option-label {
        text-decoration: underline;
    }

    .option-label {
        width: 100%;
    }

    .reset-btn {
        background-color: transparent;
        border: none;
        color: var(--text-muted);
    }

    .reset-btn:hover {
        color: var(--text-primary);
    }
</style>

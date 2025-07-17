<script lang="ts">
    interface Props {
        label: string;
        value: string;
        options: string[];
        [key: string]: any;
    }

    let { label, value = $bindable(), options, ...restProps }: Props = $props();
</script>

<label>
    {label}
    <select bind:value {...restProps}>
        {#each options as option}
            <option value={option}>{option}</option>
        {/each}
    </select>
</label>

<style>
    label {
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
    }

    label:hover {
        text-decoration: underline;
    }

    select {
        cursor: pointer;
        background-color: var(--background-dark-light);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-color: var(--main-color);
        border-radius: var(--border-radius-small);
        padding: 0.25em;
        outline: none;
    }

    select:hover,
    select:focus {
        border-color: var(--main-color-light);
    }

    option {
        background-color: var(--background-dark-light);
        color: var(--text-primary);
    }

    option:hover {
        background-color: var(--background-dark-lighter) !important;
        color: var(--main-color) !important;
    }

    option:checked {
        color: var(--main-color);
    }
</style>

<script lang="ts">
    interface Props {
        label: string;
        value: number;
        [key: string]: any;
    }

    let { label, value = $bindable(), ...restProps }: Props = $props();
</script>

<div class="number-input-container">
    <label>
        {label}:
        <input type="number" bind:value {...restProps} />
    </label>
</div>

<style>
    .number-input-container {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .number-input-container label {
        cursor: default;
    }

    input[type="number"] {
        width: 5em;
        padding: 0.25em;
        border: 1px solid var(--main-color);
        border-radius: var(--border-radius-small);
        background-color: var(--background-dark-lighter);
        color: var(--text-color);
    }
</style>

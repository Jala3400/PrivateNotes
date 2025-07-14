<script lang="ts">
    interface Props {
        label: string;
        value: number;
        [key: string]: any;
    }

    let { label, value = $bindable(), ...restProps }: Props = $props();
</script>

<label>
    {label}:
    <input type="number" bind:value {...restProps} />
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

    input[type="number"] {
        width: 5em;
        padding: 0.25em;
        border: 1px solid var(--main-color);
        border-radius: var(--border-radius-small);
        background-color: var(--background-dark-light);
        color: var(--text-color);
    }

    input[type="number"]:focus {
        background-color: var(--background-dark-lighter);
        outline: none;
    }
</style>

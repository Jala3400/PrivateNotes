<script lang="ts">
    interface Props {
        label: string;
        checked: boolean;
        [key: string]: any;
    }

    let { label, checked = $bindable(), ...restProps }: Props = $props();
</script>

<label>
    <input type="checkbox" bind:checked {...restProps} />
    {label}
</label>

<style>
    label {
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
    }

    input[type="checkbox"] {
        cursor: pointer;
    }
</style>

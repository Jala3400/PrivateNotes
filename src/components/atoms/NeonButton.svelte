<script lang="ts">
    let { text = "", ...restProps } = $props();
</script>

<button {...restProps}>{text}</button>

<style>
    button {
        padding: 12px;

        background-color: transparent;
        color: var(--main-color);

        border: 1px solid var(--main-color);
        border-radius: var(--border-radius-medium);
        box-shadow:
            var(--main-color) 0px 0px 8px,
            inset var(--main-color) 0px 0px 8px;
        font-weight: bold;

        transition: var(--transition);
        outline: none;
    }

    button:hover:enabled,
    button:focus-visible {
        color: var(--text-primary);
        background-color: var(--main-color);
        box-shadow: none;
        outline: none;
    }

    button:disabled {
        color: var(--danger-color);
        border: 1px solid var(--danger-color);
        box-shadow:
            var(--danger-color) 0px 0px 8px,
            inset var(--danger-color) 0px 0px 8px;
        opacity: 0.8;
    }
</style>

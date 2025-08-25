<script lang="ts">
    let { text = "", loading = false, ...restProps } = $props();
</script>

<button {...restProps}>
    {#if loading}
        <span class="spinner"></span>
    {:else}
        {text}
    {/if}
</button>

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

    .spinner {
        display: inline-block;
        height: 100%;
        aspect-ratio: 1;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>

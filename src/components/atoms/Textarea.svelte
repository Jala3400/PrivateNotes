<script lang="ts">
    let { value = $bindable(""), ...restProps } = $props();
</script>

<textarea bind:value {...restProps}></textarea>

<style>
    textarea {
        width: 100%;
        height: 100%;

        padding: 15px;

        background-color: var(--background-dark-lighter);
        color: var(--text-promary);

        border-radius: var(--border-radius-medium);
        border: none;
        font-size: 14px;

        resize: none;
        outline: none;
    }
</style>

<script lang="ts">
    interface Props {
        open: boolean;
        title: string;
        [key: string]: any;
    }

    let { open = $bindable(), title, ...restProps }: Props = $props();
</script>

<div class="config-group-tab" {...restProps} class:open {title}>
    <span class="config-group-title">
        {title}
    </span>
</div>

<style>
    .config-group-tab {
        display: flex;
        align-items: center;
        padding: 0.5em 0.7em;
        cursor: pointer;
        user-select: none;
        color: var(--text-color);
        overflow: hidden;
    }

    .config-group-tab.open {
        background-color: var(--background-dark-lighter);
    }

    .config-group-tab:hover {
        background-color: var(--background-dark-lighter);
    }

    .config-group-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>

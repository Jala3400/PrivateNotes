<script lang="ts">
    interface Props {
        expanded: boolean;
        size?: number;
        [key: string]: any;
    }

    let { expanded = false, size = 16, ...restProps }: Props = $props();
</script>

<svg
    class="expand-icon"
    class:expanded
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...restProps}
>
    <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
    />
</svg>

<style>
    .expand-icon {
        color: var(--text-secondary);
        transition: transform var(--transition);
        cursor: pointer;
        flex-shrink: 0;
    }

    .expand-icon.expanded {
        transform: rotate(90deg);
    }

    .expand-icon:hover {
        color: var(--text-primary);
    }
</style>

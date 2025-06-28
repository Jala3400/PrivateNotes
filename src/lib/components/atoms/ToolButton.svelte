<script lang="ts">
    interface Props {
        name: string;
        icon: string;
        onClick: () => void;
    }

    let { name, icon, onClick }: Props = $props();
</script>

<button class="tool-button" onclick={onClick} title={name}>
    <span class="icon">{icon}</span>
</button>

<style>
    .tool-button {
        aspect-ratio: 1;
        width: 100%;

        background-color: var(--background-dark-light);
        color: var(--text-color);

        border: 1px solid var(--main-color);
        border-radius: var(--border-radius-small);
    }

    .tool-button:hover {
        background-color: var(--background-dark-lighter);
    }
</style>

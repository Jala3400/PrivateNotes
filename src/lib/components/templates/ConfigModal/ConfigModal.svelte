<script lang="ts">
    import {
        editorConfig,
        editorConfigDescription,
    } from "$lib/stores/editorConfig";
    import ConfigGroup from "$lib/components/organisms/ConfigGroup/ConfigGroup.svelte";

    interface Props {
        open: boolean;
    }

    let { open = $bindable() }: Props = $props();

    let modalElement: HTMLDialogElement;

    $effect(() => {
        if (open) {
            modalElement.showModal();
        } else {
            modalElement.close();
        }
    });

    function closeModal() {
        open = false;
    }
</script>

<dialog
    bind:this={modalElement}
    onclick={closeModal}
    onclose={closeModal}
    class="dialog-container"
>
    <div
        id="config-content"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <ConfigGroup
            title="Editor Configuration"
            optionsDescription={editorConfigDescription}
            bind:configOptions={$editorConfig}
        />
    </div>
</dialog>

<style>
    .dialog-container {
        border-radius: var(--border-radius-medium);
        border: 1px solid var(--border-color);
        background-color: var(--background-dark);
        color: var(--text-color);
        width: clamp(20em, 80%, 40em);
        margin: auto;
    }

    .dialog-container::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }

    #config-content {
        padding: 1.3em;
        padding-top: 0.85em;
    }
</style>

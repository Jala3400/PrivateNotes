<script lang="ts">
    import { editorConfig } from "$lib/stores/editorConfig";

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

<dialog bind:this={modalElement} onclick={closeModal} class="dialog-container">
    <div
        id="config-content"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <div class="config-section">
            <h2>Editor Configuration</h2>
            <div class="config-options">
                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.vimMode}
                    />
                    Vim mode
                </label>
            </div>
        </div>
    </div>
</dialog>

<style>
    .dialog-container {
        border-radius: var(--border-radius-medium);
        border: 2px solid var(--main-color);
        background-color: var(--background-dark);
        color: var(--text-color);
        min-width: 300px;
        max-width: 90%;
        margin: auto;
    }

    .dialog-container::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }

    #config-content {
        padding: 1em;
        padding-top: 0.6em;
    }

    .config-section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5em;
    }

    label {
        user-select: none;
    }
</style>

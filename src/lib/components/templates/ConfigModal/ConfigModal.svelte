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

                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.lineNumbers}
                    />
                    Line numbers
                </label>

                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.foldGutter}
                    />
                    Code folding gutter
                </label>

                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.lineWrapping}
                    />
                    Line wrapping
                </label>

                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.autoCloseBrackets}
                    />
                    Auto-close brackets
                </label>

                <label>
                    <input
                        type="checkbox"
                        bind:checked={$editorConfig.highlightSelectionMatches}
                    />
                    Highlight selection matches
                </label>

                <div class="number-input-container">
                    <label for="tab-size">Tab size:</label>
                    <input
                        id="tab-size"
                        type="number"
                        min="0"
                        bind:value={$editorConfig.tabSize}
                    />
                </div>
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
        max-height: 90%;
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

    .config-options {
        display: flex;
        flex-direction: column;
        gap: 0.75em;
        width: 100%;
    }

    label {
        user-select: none;
        display: flex;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
    }

    .number-input-container {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .number-input-container label {
        cursor: default;
    }

    input[type="number"] {
        width: 5em;
        padding: 0.25em;
        border: 1px solid var(--main-color);
        border-radius: var(--border-radius-small);
        background-color: var(--background-dark-lighter);
        color: var(--text-color);
    }

    input[type="checkbox"] {
        cursor: pointer;
    }
</style>

<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);

    async function saveNote() {
        if (!title.trim() || !content.trim()) {
            alert("Please enter both title and content");
            return;
        }

        isSaving = true;
        try {
            await invoke("save_encrypted_note", {
                title: title.trim(),
                content: content.trim(),
            });
        } catch (error) {
            console.error("Failed to save note:", error);
        } finally {
            isSaving = false;
        }
    }

    function handlekeydown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault();
            saveNote();
        }
    }

</script>

<svelte:window onkeydown={handlekeydown} />

<div class="editor-container">
    <input
        id="note-title"
        class="editor-component"
        type="text"
        placeholder="Note Title"
        bind:value={title}
        disabled={isSaving}
    />

    <textarea
        id="note-content"
        class="editor-component"
        placeholder="Start typing..."
        bind:value={content}
        disabled={isSaving}
    >
    </textarea>
</div>

<style>
    .editor-container {
        display: flex;
        flex-direction: column;
        gap: 20px;

        max-width: 800px;
        height: 100%;
        margin: 0 auto;
        padding: 20px;
    }

    .editor-component {
        background: transparent;
        color: var(--text-primary);
    }

    #note-title {
        width: 100%;
        padding: 8px;

        font-size: 24px;

        border: none;
        outline: none;

        transition: var(--transition);
    }

    #note-content {
        width: 100%;
        height: 100%;

        padding: 15px;

        border: none;

        resize: none;
        outline: none;
    }
</style>

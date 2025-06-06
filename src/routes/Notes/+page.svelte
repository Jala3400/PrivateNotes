<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);

    async function saveNote() {
        // Validate title and content
        if (!title.trim() || !content.trim()) {
            alert("Please enter both title and content");
            return;
        }

        // Prevent multiple save operations
        if (isSaving) {
            console.warn("Save operation already in progress");
            return;
        }

        isSaving = true;

        // Call the Tauri command to save the note
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
        // Save note on Ctrl+S
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault();
            saveNote();
        }
    }

    // Listen for drag-and-drop events to open notes
    let unlisten: (() => void) | undefined;

    type NoteOpenedEvent = {
        payload: string[];
    };

    onMount(async () => {
        unlisten = await listen("note-opened", (event: NoteOpenedEvent) => {
            // Reset the editor when a note is opened
            const [noteTitle, noteContent] = event.payload;
            title = noteTitle || "";
            content = noteContent || "";
        });
    });

    onDestroy(() => {
        // Clean up the event listener when the component is destroyed
        if (unlisten) {
            unlisten();
        }
    });
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

        width: 100%;
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

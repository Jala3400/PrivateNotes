<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import Editor from "../../components/organisms/Editor/Editor.svelte";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);
    let editorKey = $state(Date.now());

    async function saveNote() {
        let tempTitle = title.trim();
        if (tempTitle.length === 0) {
            tempTitle = "Untitled Note";
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
                title: tempTitle,
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

            // Force editor component to restart by using key
            editorKey = Date.now();
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
        autocomplete="off"
    />

    <div id="note-contents">
        {#key editorKey}
            <Editor bind:content />
        {/key}
    </div>
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

    #note-contents {
        flex: 1;
        overflow: hidden;
    }
</style>

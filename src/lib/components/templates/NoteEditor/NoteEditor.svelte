<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import Editor from "$lib/components/organisms/Editor/Editor.svelte";
    import { throwCustomError } from "$lib/error";
    import { currentNote } from "$lib/stores/currentNote";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);
    let editorKey = $state(Date.now());
    let showNotification = $state(false);
    let editorRef = $state<Editor>();

    function showSaveNotification() {
        showNotification = true;
        setTimeout(() => {
            showNotification = false;
        }, 2000);
    }

    async function saveNote(noteContent: string) {
        let tempTitle = title;
        if (title.trim().length === 0) {
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
            await invoke("save_note", {
                id: $currentNote?.id,
                content: noteContent,
            });

            // It always saves the note unless an error occurs
            showSaveNotification();
        } catch (error) {
            throwCustomError(
                "Failed to save note: " + String(error),
                "An error occurred while trying to save the note."
            );
        } finally {
            isSaving = false;
        }
    }

    async function saveNoteCopy(noteContent: string) {
        let tempTitle = title;
        if (title.trim().length === 0) {
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
            if (
                await invoke("save_note_copy", {
                    id: $currentNote?.id,
                    title: tempTitle,
                    content: noteContent,
                })
            ) {
                // The user can cancel the save operation
                showSaveNotification();
            }
        } catch (error) {
            throwCustomError(
                "Failed to save note: " + String(error),
                "An error occurred while trying to save a copy of the note."
            );
        } finally {
            isSaving = false;
        }
    }

    async function saveNoteAs(noteContent: string) {
        let tempTitle = title;
        if (title.trim().length === 0) {
            tempTitle = "Untitled Note";
        }

        // Prevent multiple save operations
        if (isSaving) {
            console.warn("Save operation already in progress");
            return;
        }

        isSaving = true;

        // Call the Tauri command to save the note as a new file
        try {
            await invoke("save_note_as", {
                id: $currentNote?.id,
                title: tempTitle,
                content: noteContent,
            });

            showSaveNotification();
        } catch (error) {
            throwCustomError(
                "Failed to save note as: " + String(error),
                "An error occurred while trying to save the note as a new file."
            );
        } finally {
            isSaving = false;
        }
    }

    function handlekeydown(event: KeyboardEvent) {
        // Save note on Ctrl+S
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault();
            const currentContent = editorRef?.getContent() || "";
            if (!$currentNote?.id) {
                saveNoteAs(currentContent);
            } else {
                saveNote(currentContent);
            }
        } else if (event.ctrlKey && event.key === "g") {
            event.preventDefault();
            const currentContent = editorRef?.getContent() || "";
            saveNoteCopy(currentContent);
        }
    }

    // Listen for drag-and-drop events to open notes
    let unlistenNoteOpened: (() => void) | undefined;
    let unlistenItemClosed: (() => void) | undefined;

    type NoteOpenedEvent = {
        payload: string[];
    };

    onMount(async () => {
        unlistenNoteOpened = await listen(
            "note-opened",
            (event: NoteOpenedEvent) => {
                // Reset the editor when a note is opened
                const [noteTitle, noteContent, noteId, parentId] =
                    event.payload;
                title = noteTitle || "";
                content = noteContent || "";
                $currentNote = {
                    id: noteId,
                    parentId: parentId,
                };

                // Force editor component to restart by using key
                editorKey = Date.now();
            }
        );

        unlistenItemClosed = await listen("item-closed", (event) => {
            if (event.payload === $currentNote?.parentId) {
                // Reset the editor when the current note is closed
                title = "";
                content = "";
                $currentNote = null;
                editorKey = Date.now(); // Force re-render of the editor
            }
        });
    });

    onDestroy(() => {
        // Clean up the event listener when the component is destroyed
        if (unlistenNoteOpened) unlistenNoteOpened();
        if (unlistenItemClosed) unlistenItemClosed();
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
            <Editor bind:this={editorRef} {content} />
        {/key}
    </div>
</div>

{#if showNotification}
    <div class="notification">Note saved</div>
{/if}

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

    .notification {
        position: fixed;
        bottom: 0;
        right: 0;
        padding: 4px 8px;
        background: var(--background-dark-light);
        border-top-left-radius: var(--border-radius-small);
        z-index: 1000;
    }
</style>

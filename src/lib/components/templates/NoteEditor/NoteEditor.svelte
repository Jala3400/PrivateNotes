<script lang="ts">
    import Editor from "$lib/components/organisms/Editor/Editor.svelte";
    import { currentNote } from "$lib/stores/currentNote";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";
    import {
        renameNoteEvent,
        saveNoteAsEvent,
        saveNoteCopyEvent,
        saveNoteEvent,
    } from "./noteOperations";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);
    let editorKey = $state(Date.now());
    let showNotification = $state(false);
    let editorRef = $state<Editor>();

    // Save queue
    let saveQueue: (() => Promise<void>)[] = [];
    let processingQueue = false;

    async function processQueue() {
        if (processingQueue) return;
        processingQueue = true;
        while (saveQueue.length > 0) {
            await saveQueue.shift()!();
        }
        processingQueue = false;
    }

    function enqueueSave(fn: () => Promise<void>) {
        saveQueue.push(fn);
        processQueue();
    }

    function showSaveNotification() {
        showNotification = true;
        setTimeout(() => {
            showNotification = false;
        }, 2000);
    }

    function saveNote(noteId: string, noteContent: string) {
        enqueueSave(async () => {
            isSaving = true;

            const result = await saveNoteEvent(noteId, noteContent);
            if (result) showSaveNotification();

            isSaving = false;
        });
    }

    function saveNoteAs(noteId: string | undefined, noteContent: string) {
        enqueueSave(async () => {
            isSaving = true;

            let tempTitle = title;
            if (title.trim().length === 0) {
                tempTitle = "Untitled Note";
            }

            const result = await saveNoteAsEvent(
                noteId,
                tempTitle,
                noteContent
            );
            if (result) showSaveNotification();

            isSaving = false;
        });
    }

    function saveNoteCopy(noteId: string | undefined, noteContent: string) {
        enqueueSave(async () => {
            isSaving = true;

            let tempTitle = title;
            if (title.trim().length === 0) {
                tempTitle = "Untitled Note";
            }

            const result = await saveNoteCopyEvent(
                noteId,
                tempTitle,
                noteContent
            );
            if (result) showSaveNotification();

            isSaving = false;
        });
    }

    function renameCurrentNote() {
        enqueueSave(async () => {
            isSaving = true;

            const noteId = $currentNote?.id;
            const parentId = $currentNote?.parentId;
            if (!noteId || !parentId) {
                // If there's no current note, we can't rename it
                return;
            }

            let tempTitle = title;
            if (title.trim().length === 0) {
                tempTitle = "Untitled Note";
            }

            const result = await renameNoteEvent(noteId, parentId, tempTitle);
            if (result) showSaveNotification();

            isSaving = false;
        });
    }

    function handlekeydown(event: KeyboardEvent) {
        if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
            return;

        // Save note on Ctrl+S
        const noteId = $currentNote?.id;
        if (event.key === "s") {
            event.preventDefault();
            const currentContent = editorRef?.getContent() || "";
            if (noteId) {
                saveNote(noteId, currentContent);
            } else {
                saveNoteAs(noteId, currentContent);
            }
        } else if (event.key === "g") {
            event.preventDefault();
            const currentContent = editorRef?.getContent() || "";
            saveNoteCopy(noteId, currentContent);
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
        unlistenNoteOpened?.();
        unlistenItemClosed?.();
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
        onchange={renameCurrentNote}
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

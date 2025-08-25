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
    import { addNotification } from "$lib/stores/notifications";
    import { NotificationType } from "$lib/types";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);
    let editorKey = $state(Date.now());
    let editorRef = $state<Editor>();

    // Statistics
    let characterCount = $state(0);
    let wordCount = $state(0);
    let lineCount = $state(0);

    // Save queue
    let saveQueue: (() => Promise<void>)[] = [];
    let processingQueue = false;

    function calculateStats(text: string) {
        characterCount = text.length;
        wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        lineCount = text.split(/\r\n|\r|\n/).length;
    }

    function handleContentChange() {
        if (editorRef) {
            const currentContent = editorRef.getContent();
            calculateStats(currentContent);
        }
    }

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
        addNotification("Note saved", NotificationType.SUCCESS);
    }

    function showRenamedNotification() {
        addNotification("Note renamed", NotificationType.SUCCESS);
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
            if (result) showRenamedNotification();

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
                    unsaved: false,
                };

                // Calculate initial stats
                calculateStats(content);

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
                calculateStats(""); // Reset stats
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
            <Editor
                bind:this={editorRef}
                {content}
                onContentChange={handleContentChange}
            />
        {/key}
    </div>
</div>

<div id="info-panel">
    {#if isSaving}
        <span>Saving...</span>
    {:else if $currentNote?.unsaved}
        <span>Unsaved changes</span>
    {:else if $currentNote}
        <span>Saved</span>
    {:else}
        <span>No note opened</span>
    {/if}
    <span>-</span>
    <span>{characterCount} chars</span>
    <span>{wordCount} words</span>
    <span>{lineCount} lines</span>
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

    #info-panel {
        position: fixed;
        bottom: 0;
        right: 0;
        padding: 4px 8px;
        font-size: 0.9em;
        color: var(--text-secondary);
        background: var(--background-dark-light);
        border-top-left-radius: var(--border-radius-small);
        z-index: 1000;
        display: flex;
        gap: 6px;
    }
</style>

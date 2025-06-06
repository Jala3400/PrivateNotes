<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { onDestroy, onMount } from "svelte";

    let content = $state("");
    let title = $state("");
    let isSaving = $state(false);
    let isLoading = $state(false);

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

    async function openNote(filePath: string) {
        isLoading = true;
        try {
            const noteContents: string = await invoke("open_encrypted_note", {
                filePath: filePath,
            });

            content = noteContents || "";
            title = filePath.split("\\").pop()?.replace(".lockd", "") || "";
        } catch (error) {
            console.error("Failed to open note:", error);
            alert(
                "Failed to open note. Please check if the file is a valid encrypted note."
            );
        } finally {
            isLoading = false;
        }
    }

    function handlekeydown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === "s") {
            event.preventDefault();
            saveNote();
        }
    }

    // Listen for drag-and-drop events to open notes
    let unlisten: (() => void) | undefined;

    onMount(async () => {
        unlisten = await listen("tauri://drag-drop", async (event) => {
            // event.payload.paths is an array of file paths
            await openNote((event.payload as any).paths[0]);
        });
    });

    onDestroy(() => {
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
        disabled={isSaving || isLoading}
    />

    <textarea
        id="note-content"
        class="editor-component"
        placeholder="Start typing..."
        bind:value={content}
        disabled={isSaving || isLoading}
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

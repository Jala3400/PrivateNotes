import { invoke } from "@tauri-apps/api/core";
import { throwCustomError } from "$lib/error";

export async function saveNoteEvent(noteId: string, noteContent: string) {
    try {
        await invoke("save_note", {
            id: noteId,
            content: noteContent,
        });
        return true;
    } catch (error) {
        throwCustomError(
            "Failed to save note: " + error,
            "An error occurred while trying to save the note."
        );
        return false;
    }
}

export async function saveNoteAsEvent(
    noteId: string | undefined,
    title: string,
    noteContent: string
) {
    try {
        return await invoke("save_note_as", {
            id: noteId,
            title,
            content: noteContent,
        });
    } catch (error) {
        throwCustomError(
            "Failed to save note as: " + error,
            "An error occurred while trying to save the note as a new file."
        );
        return false;
    }
}

export async function saveNoteCopyEvent(
    noteId: string | undefined,
    title: string,
    noteContent: string
) {
    try {
        return await invoke("save_note_copy", {
            id: noteId,
            title,
            content: noteContent,
        });
    } catch (error) {
        throwCustomError(
            "Failed to save note: " + error,
            "An error occurred while trying to save a copy of the note."
        );
        return false;
    }
}

export async function renameNoteEvent(
    noteId: string,
    parentId: string,
    newTitle: string
) {
    try {
        await invoke("rename_note", {
            id: noteId,
            parentId: parentId,
            newTitle: newTitle,
        });
        return true;
    } catch (error) {
        throwCustomError(
            "Failed to rename note: " + error,
            "An error occurred while trying to rename the note."
        );
        return false;
    }
}

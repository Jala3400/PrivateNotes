<script lang="ts">
    import { editorConfig } from "$lib/stores/configs/editorConfig";
    import { onDestroy, onMount } from "svelte";
    import { CodeMirrorEditor } from "$lib/editor/EditorCore";
    import type { EditorConfig } from "$lib/editor/EditorCore";
    import { EditorContextMenuManager } from "./editorContextMenu";
    import { EditorView } from "@codemirror/view";
    import "$lib/editor/md_style.css";

    interface Props {
        content: string;
        onContentChange: () => void;
    }

    let editorContainer: HTMLDivElement;
    let editor: CodeMirrorEditor;
    let contextMenuManager: EditorContextMenuManager;

    let { content = "", onContentChange }: Props = $props();

    export function getContent(): string {
        return editor ? editor.getContent() : content;
    }

    onMount(() => {
        // Convert Svelte store to plain config object
        const config: EditorConfig = {
            renderMd: $editorConfig.renderMd,
            vimMode: $editorConfig.vimMode,
            lineNumbers: $editorConfig.lineNumbers,
            lineWrapping: $editorConfig.lineWrapping,
            autoCloseBrackets: $editorConfig.autoCloseBrackets,
            foldGutter: $editorConfig.foldGutter,
            tabSize: $editorConfig.tabSize,
        };

        // Initialize the editor core
        editor = new CodeMirrorEditor(config);

        // Initialize editor-specific context menu manager first
        contextMenuManager = new EditorContextMenuManager(editor);

        // Create extensions for content change handling
        const extensions = [
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    onContentChange();
                }
            }),
        ];

        const keymaps = [
            {
                key: "Ctrl-g",
                run: () => true, // true means "handled", so no further processing occurs
                // It is used in #NoteEditor.svelte to trigger saving
                // Overrides a search command in CodeMirror
            },
        ];

        editor.mount(editorContainer, content, keymaps, extensions);

        // Add context menu handler to the container to capture events from both
        // CodeMirror and table widget elements (through event bubbling)
        editorContainer.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            contextMenuManager.show(event.clientX, event.clientY);
        });

        // Watch for editorConfig changes and update editor
        $effect(() => {
            if (editor) {
                editor.updateConfig({
                    renderMd: $editorConfig.renderMd,
                    vimMode: $editorConfig.vimMode,
                    lineNumbers: $editorConfig.lineNumbers,
                    lineWrapping: $editorConfig.lineWrapping,
                    autoCloseBrackets: $editorConfig.autoCloseBrackets,
                    foldGutter: $editorConfig.foldGutter,
                    tabSize: $editorConfig.tabSize,
                });
            }
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });
</script>

<div class="editor-container" bind:this={editorContainer}></div>

<style>
    .editor-container {
        height: 100%;
        width: 100%;
        background: var(--background-dark);
        overflow-y: auto;
        border-radius: var(--border-radius-medium);
        border: 1px solid var(--background-dark-lighter);
    }
</style>

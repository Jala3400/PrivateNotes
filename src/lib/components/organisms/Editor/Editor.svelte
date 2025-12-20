<script lang="ts">
    import { editorConfig } from "$lib/stores/configs/editorConfig";
    import { onDestroy, onMount } from "svelte";
    import { CodeMirrorEditor } from "$lib/editor/EditorCore";
    import type { EditorConfig } from "$lib/editor/EditorCore";
    import { EditorContextMenuManager } from "./editorContextMenu";
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

    function handleContextMenu(event: MouseEvent) {
        contextMenuManager.show(event.clientX, event.clientY);
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
        editor = new CodeMirrorEditor(config, {
            onContentChange,
            onContextMenu: handleContextMenu,
        });

        const keymaps = [
            {
                key: "Ctrl-g",
                run: () => true,
                // It is used in #NoteEditor to trigger saving
                // Overrides a search command in CodeMirror
            },
        ];

        editor.mount(editorContainer, content, keymaps);

        // Initialize editor-specific context menu manager
        contextMenuManager = new EditorContextMenuManager(editor);

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

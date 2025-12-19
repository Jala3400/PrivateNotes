<script lang="ts">
    import { editorConfig } from "$lib/stores/configs/editorConfig";
    import { onDestroy, onMount } from "svelte";
    import { CodeMirrorEditor } from "./EditorCore";
    import type { EditorConfig } from "./EditorCore";
    import ContextMenu from "./ContextMenu.svelte";
    import { ContextMenuManager, type ContextMenuState } from "./contextMenuManager";
    import "./md_style.css";

    interface Props {
        content: string;
        onContentChange: () => void;
    }

    let editorContainer: HTMLDivElement;
    let editor: CodeMirrorEditor;
    let contextMenuManager: ContextMenuManager;

    let { content = "", onContentChange }: Props = $props();

    let contextMenuState = $state<ContextMenuState>({
        show: false,
        x: 0,
        y: 0,
        items: [],
    });

    export function getContent(): string {
        return editor ? editor.getContent() : content;
    }

    function handleContextMenu(event: MouseEvent) {
        contextMenuManager.show(event.clientX, event.clientY);
    }

    function handleMenuItemClick(itemId: string) {
        contextMenuManager.executeItem(itemId);
    }

    function handleMenuClose() {
        contextMenuManager.hide();
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

        editor.mount(editorContainer, content);

        // Initialize context menu manager
        contextMenuManager = new ContextMenuManager(editor);
        
        // Subscribe to context menu state changes
        const unsubscribe = contextMenuManager.subscribe((state) => {
            contextMenuState = state;
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

        return () => {
            unsubscribe();
        };
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });
</script>

<div class="editor-container" bind:this={editorContainer}></div>

<ContextMenu
    show={contextMenuState.show}
    x={contextMenuState.x}
    y={contextMenuState.y}
    items={contextMenuState.items}
    onItemClick={handleMenuItemClick}
    onClose={handleMenuClose}
/>

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

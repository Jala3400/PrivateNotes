<script lang="ts">
    import { editorConfig } from "$lib/stores/configs/editorConfig";
    import { onDestroy, onMount } from "svelte";
    import { CodeMirrorEditor } from "./EditorCore";
    import type { EditorConfig } from "./EditorCore";
    import "./md_style.css";

    interface Props {
        content: string;
        onContentChange: () => void;
    }

    interface ContextMenuItem {
        id: string;
        text: string;
        action: (() => void) | null;
        type?: "item" | "separator";
    }

    let editorContainer: HTMLDivElement;
    let editor: CodeMirrorEditor;

    let { content = "", onContentChange }: Props = $props();

    let contextMenu = $state<HTMLDivElement>();
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);

    // Define context menu items using editor methods
    const contextMenuItems: ContextMenuItem[] = [
        {
            id: "superscript",
            text: "Insert Superscript",
            action: () => editor.insertSuperscript(),
            type: "item",
        },
        {
            id: "subscript",
            text: "Insert Subscript",
            action: () => editor.insertSubscript(),
            type: "item",
        },
        {
            id: "separator-1",
            text: "---",
            action: null,
            type: "separator",
        },
        {
            id: "table",
            text: "Insert Table",
            action: () => editor.insertTable(),
            type: "item",
        },
        {
            id: "tasklist",
            text: "Insert Task List",
            action: () => editor.insertTaskList(),
            type: "item",
        },
    ];

    export function getContent(): string {
        return editor ? editor.getContent() : content;
    }

    function hideContextMenu() {
        showContextMenu = false;
    }

    function handleContextMenu(event: MouseEvent) {
        contextMenuX = event.clientX;
        contextMenuY = event.clientY;
        showContextMenu = true;
    }

    function handleMenuItemClick(item: ContextMenuItem) {
        item.action?.();
        hideContextMenu();
        editor.focus();
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

{#if showContextMenu}
    <div
        class="context-menu"
        bind:this={contextMenu}
        style="left: {contextMenuX}px; top: {contextMenuY}px;"
        role="menu"
        onmousedown={(e) => e.preventDefault()}
    >
        {#each contextMenuItems as item}
            {#if item.type === "separator" || item.text === "---"}
                <div class="context-menu-separator"></div>
            {:else}
                <button
                    class="context-menu-item"
                    onclick={() => handleMenuItemClick(item)}
                    role="menuitem"
                >
                    {item.text}
                </button>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .editor-container {
        height: 100%;
        width: 100%;
        background: var(--background-dark);
        overflow-y: auto;
        border-radius: var(--border-radius-medium);
        border: 1px solid var(--background-dark-lighter);
    }

    .context-menu-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
        display: none;
    }

    .context-menu-backdrop.visible {
        display: block;
    }
</style>

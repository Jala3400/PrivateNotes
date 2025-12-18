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

    let editorContainer: HTMLDivElement;
    let editor: CodeMirrorEditor;

    let { content = "", onContentChange } = $props();

    let contextMenu = $state<HTMLDivElement>();
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);

    export function getContent(): string {
        return editor ? editor.getContent() : content;
    }

    function insertTable() {
        const tableTemplate = `
| Header | Header |
|--------|--------|
| Cell   | Cell   |
`;

        editor.insertText(tableTemplate);
        hideContextMenu();
        editor.focus();
    }

    function insertTaskList() {
        const taskListTemplate = `- [ ] `;
        editor.insertAtLineStart(taskListTemplate);
        hideContextMenu();
        editor.focus();
    }

    function insertSuperscript() {
        editor.wrapSelection("^", "^");
        hideContextMenu();
        editor.focus();
    }

    function insertSubscript() {
        editor.wrapSelection("~", "~");
        hideContextMenu();
        editor.focus();
    }

    function hideContextMenu() {
        showContextMenu = false;
    }

    function handleContextMenu(event: MouseEvent) {
        contextMenuX = event.clientX;
        contextMenuY = event.clientY;
        showContextMenu = true;
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

        // Hide context menu when clicking elsewhere
        document.addEventListener("click", hideContextMenu);

        // Hide context menu when pressing Escape
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                hideContextMenu();
            }
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
        document.removeEventListener("click", hideContextMenu);
        document.removeEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                hideContextMenu();
            }
        });
    });

    const contextMenuItems = [
        { text: "Insert Superscript", action: insertSuperscript },
        { text: "Insert Subscript", action: insertSubscript },
        { text: "---", action: null },
        { text: "Insert Table", action: insertTable },
        { text: "Insert Task List", action: insertTaskList },
    ];
</script>

<div class="editor-container" bind:this={editorContainer}></div>

{#if showContextMenu}
    <div
        class="context-menu"
        bind:this={contextMenu}
        style="left: {contextMenuX}px; top: {contextMenuY}px;"
    >
        {#each contextMenuItems as item}
            {#if item.text === "---"}
                <div class="context-menu-separator"></div>
            {:else}
                <button class="context-menu-item" onclick={item.action}>
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
</style>

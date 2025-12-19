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
    let contextMenuItems = $state<ContextMenuItem[]>([]);

    $inspect("editorConfig", showContextMenu);

    export function getContent(): string {
        return editor ? editor.getContent() : content;
    }

    function hideContextMenu() {
        showContextMenu = false;
    }

    function handleContextMenu(event: MouseEvent) {
        contextMenuX = event.clientX;
        contextMenuY = event.clientY;

        // Check if we're in a table context
        const tableContext = editor.getTableContext();

        if (tableContext) {
            // Build merged menu with table operations
            const { widget, row, col } = tableContext;
            contextMenuItems = [
                {
                    id: "add-row-above",
                    text: "Add Row Above",
                    action: () => widget.addRow(row),
                    type: "item",
                },
                {
                    id: "add-row-below",
                    text: "Add Row Below",
                    action: () => widget.addRow(row + 1),
                    type: "item",
                },
                {
                    id: "add-col-left",
                    text: "Add Column Left",
                    action: () => widget.addColumn(col),
                    type: "item",
                },
                {
                    id: "add-col-right",
                    text: "Add Column Right",
                    action: () => widget.addColumn(col + 1),
                    type: "item",
                },
                {
                    id: "separator-1",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "move-row-up",
                    text: "Move Row Up",
                    action: () => widget.moveRowUp(row),
                    type: "item",
                },
                {
                    id: "move-row-down",
                    text: "Move Row Down",
                    action: () => widget.moveRowDown(row),
                    type: "item",
                },
                {
                    id: "move-col-left",
                    text: "Move Column Left",
                    action: () => widget.moveColumnLeft(col),
                    type: "item",
                },
                {
                    id: "move-col-right",
                    text: "Move Column Right",
                    action: () => widget.moveColumnRight(col),
                    type: "item",
                },
                {
                    id: "separator-2",
                    text: "---",
                    action: null,
                    type: "separator",
                },
                {
                    id: "delete-row",
                    text: "Delete Row",
                    action: () => widget.deleteRow(row),
                    type: "item",
                },
                {
                    id: "delete-col",
                    text: "Delete Column",
                    action: () => widget.deleteColumn(col),
                    type: "item",
                },
                {
                    id: "separator-3",
                    text: "---",
                    action: null,
                    type: "separator",
                },
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
            ];
        } else {
            // Standard editor menu
            contextMenuItems = [
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
        }

        showContextMenu = true;
    }

    function handleMenuItemClick(item: ContextMenuItem) {
        item.action?.();
        hideContextMenu();
        editor.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape" && showContextMenu) {
            hideContextMenu();
        }
    }

    function handleDocumentClick(event: MouseEvent) {
        if (
            showContextMenu &&
            contextMenu &&
            !contextMenu.contains(event.target as Node)
        ) {
            hideContextMenu();
        }
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

        // Add event listeners
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("click", handleDocumentClick);

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
        // Remove event listeners
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("click", handleDocumentClick);
    });
</script>

<div class="editor-container" bind:this={editorContainer}></div>

{#if showContextMenu}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
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
</style>

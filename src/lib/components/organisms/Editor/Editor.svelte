<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { EditorView, keymap } from "@codemirror/view";
    import { EditorState } from "@codemirror/state";
    import { markdown } from "@codemirror/lang-markdown";
    import { basicSetup } from "codemirror";
    import {
        syntaxHighlighting,
        HighlightStyle,
        indentUnit,
    } from "@codemirror/language";
    import { classHighlighter, tags } from "@lezer/highlight";
    import { selectedLinePlugin } from "./SelectedLinePlugin";
    import { indentWithTab } from "@codemirror/commands";
    import { tableRendererPlugin } from "./TableRendererPlugin";
    import { Table } from "@lezer/markdown";
    import "./md_style.css";

    let editorContainer: HTMLDivElement;
    let editorView: EditorView;
    let { content = "" } = $props();

    let contextMenu = $state<HTMLDivElement>();
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);

    export function getContent(): string {
        return editorView ? editorView.state.doc.toString() : content;
    }

    function insertTable() {
        const tableTemplate = `| Header | Header |
|--------|--------|
| Cell   | Cell   |
`;

        const pos = editorView.state.selection.main.head;
        editorView.dispatch({
            changes: { from: pos, insert: tableTemplate },
        });

        hideContextMenu();
        editorView.focus();
    }

    function hideContextMenu() {
        showContextMenu = false;
    }

    onMount(() => {
        // Create custom markdown highlighting style
        const markdownHighlighting = HighlightStyle.define([
            { tag: tags.heading1, class: "md-h1" },
            { tag: tags.heading2, class: "md-h2" },
            { tag: tags.heading3, class: "md-h3" },
            { tag: tags.heading4, class: "md-h4" },
            { tag: tags.heading5, class: "md-h5" },
            { tag: tags.heading6, class: "md-h6" },
            { tag: tags.monospace, class: "md-code-inline" },
            { tag: tags.quote, class: "md-quote" },
            { tag: tags.list, class: "md-list-item" },
        ]);

        const indentUnitExtension = indentUnit.of("    "); // 4 spaces

        const state = EditorState.create({
            doc: content,
            extensions: [
                markdown({ extensions: [Table] }),
                syntaxHighlighting(classHighlighter),
                syntaxHighlighting(markdownHighlighting),
                selectedLinePlugin(),
                tableRendererPlugin(),
                EditorView.lineWrapping,
                basicSetup,
                keymap.of([indentWithTab]),
                indentUnitExtension,
            ],
        });

        editorView = new EditorView({
            state,
            parent: editorContainer,
        });

        // Add context menu event listener
        editorView.dom.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            contextMenuX = event.clientX;
            contextMenuY = event.clientY;
            showContextMenu = true;
        });

        // Hide context menu when clicking elsewhere
        document.addEventListener("click", hideContextMenu);
    });

    onDestroy(() => {
        if (editorView) {
            editorView.destroy();
        }
        document.removeEventListener("click", hideContextMenu);
    });
</script>

<div class="editor-container" bind:this={editorContainer}></div>

{#if showContextMenu}
    <div
        class="context-menu"
        bind:this={contextMenu}
        style="left: {contextMenuX}px; top: {contextMenuY}px;"
    >
        <button class="context-menu-item" onclick={insertTable}>
            Insert Table
        </button>
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

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
    import { taskListPlugin } from "./TaskListPlugin";
    import { subAndSuperscriptPlugin } from "./SubAndSuperscriptPlugin";
    import { separatorLinePlugin } from "./SeparatorLinePlugin";
    import { blockquotePlugin } from "./BlockquotePlugin";
    import {
        Strikethrough,
        Subscript,
        Superscript,
        Table,
        TaskList,
    } from "@lezer/markdown";
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
        const tableTemplate = `
| Header | Header |
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

    function insertTaskList() {
        const taskListTemplate = `- [ ] `;
        const pos = editorView.state.selection.main.head;
        const line = editorView.state.doc.lineAt(pos);
        const lineStart = line.from;

        editorView.dispatch({
            changes: { from: lineStart, insert: taskListTemplate },
            selection: { anchor: lineStart + taskListTemplate.length },
        });

        hideContextMenu();
        editorView.focus();
    }

    function insertSuperscript() {
        const selection = editorView.state.selection.main;
        const selectedText = editorView.state.doc.sliceString(
            selection.from,
            selection.to
        );

        const superscriptText = selectedText ? `^${selectedText}^` : `^^`;

        hideContextMenu();

        editorView.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: superscriptText,
            },
            selection: selectedText
                ? {
                      anchor: selection.from,
                      head: selection.from + superscriptText.length,
                  }
                : { anchor: selection.from + 1, head: selection.from + 1 },
        });

        editorView.focus();
    }

    function insertSubscript() {
        const selection = editorView.state.selection.main;
        const selectedText = editorView.state.doc.sliceString(
            selection.from,
            selection.to
        );

        const subscriptText = selectedText ? `~${selectedText}~` : `~~`;

        hideContextMenu();

        editorView.dispatch({
            changes: {
                from: selection.from,
                to: selection.to,
                insert: subscriptText,
            },
            selection: selectedText
                ? {
                      anchor: selection.from,
                      head: selection.from + subscriptText.length,
                  }
                : { anchor: selection.from + 1, head: selection.from + 1 },
        });

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
            { tag: tags.strikethrough, class: "md-strikethrough" },
        ]);

        const indentUnitExtension = indentUnit.of("    "); // 4 spaces

        const state = EditorState.create({
            doc: content,
            extensions: [
                markdown({
                    extensions: [
                        Table,
                        Strikethrough,
                        TaskList,
                        Superscript,
                        Subscript,
                    ],
                }), // Don't use GFM because it hides the links
                syntaxHighlighting(classHighlighter),
                syntaxHighlighting(markdownHighlighting),
                selectedLinePlugin(),
                tableRendererPlugin(),
                taskListPlugin(),
                subAndSuperscriptPlugin(),
                separatorLinePlugin(),
                blockquotePlugin(),
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

        // Hide context menu when pressing Escape
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                hideContextMenu();
            }
        });
    });

    onDestroy(() => {
        if (editorView) {
            editorView.destroy();
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

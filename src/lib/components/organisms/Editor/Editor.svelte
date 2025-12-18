<script lang="ts">
    import { editorConfig } from "$lib/stores/configs/editorConfig";
    import {
        autocompletion,
        closeBrackets,
        closeBracketsKeymap,
        completionKeymap,
    } from "@codemirror/autocomplete";
    import {
        defaultKeymap,
        history,
        historyKeymap,
        indentWithTab,
    } from "@codemirror/commands";
    import { markdown } from "@codemirror/lang-markdown";
    import {
        bracketMatching,
        defaultHighlightStyle,
        foldGutter,
        foldKeymap,
        HighlightStyle,
        indentOnInput,
        indentUnit,
        syntaxHighlighting,
    } from "@codemirror/language";
    import {
        highlightSelectionMatches,
        searchKeymap,
    } from "@codemirror/search";
    import { EditorState, StateEffect } from "@codemirror/state";
    import {
        drawSelection,
        dropCursor,
        EditorView,
        highlightActiveLine,
        highlightActiveLineGutter,
        highlightSpecialChars,
        keymap,
        lineNumbers,
        rectangularSelection,
    } from "@codemirror/view";
    import { classHighlighter, tags } from "@lezer/highlight";
    import {
        Strikethrough,
        Subscript,
        Superscript,
        Table,
        TaskList,
    } from "@lezer/markdown";
    import { vim } from "@replit/codemirror-vim";
    import { onDestroy, onMount } from "svelte";
    import "./md_style.css";
    import { selectedLinePlugin } from "./SelectedLinePlugin";
    import { syntaxCorePlugin } from "./SyntaxCorePlugin";
    import { tableRendererPlugin } from "./TableRendererPlugin";
    import { spoilerExtension } from "./SpoilerParser";

    interface Props {
        content: string;
        onContentChange: () => void;
    }

    let editorContainer: HTMLDivElement;
    let editorView: EditorView;

    let { content = "", onContentChange } = $props();

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

        function createExtensions() {
            const extensions = [
                // Only render custom markdown plugins if renderMd is enabled
                ...($editorConfig.renderMd
                    ? [
                          markdown({
                              extensions: [
                                  Table,
                                  Strikethrough,
                                  TaskList,
                                  Superscript,
                                  Subscript,
                                  spoilerExtension,
                              ],
                          }),
                          syntaxHighlighting(classHighlighter),
                          syntaxHighlighting(markdownHighlighting),
                          tableRendererPlugin(),
                          syntaxCorePlugin(),
                      ]
                    : []),

                // Basic editor features
                selectedLinePlugin(),
                highlightSpecialChars(),
                history(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                bracketMatching(),
                rectangularSelection(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                highlightSelectionMatches(),

                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onContentChange();
                    }
                }),
            ];

            if ($editorConfig.vimMode) {
                extensions.unshift(vim());
            }

            if ($editorConfig.lineNumbers) {
                extensions.push(lineNumbers());
            }

            if ($editorConfig.lineWrapping) {
                extensions.push(EditorView.lineWrapping);
            }

            if ($editorConfig.autoCloseBrackets) {
                extensions.push(closeBrackets());
                extensions.push(autocompletion());
            }

            if ($editorConfig.foldGutter) {
                extensions.push(foldGutter());
            }

            // Create keymap array based on config
            const keymaps = [
                {
                    key: "Ctrl-g",
                    run: () => true,
                    // It is used in the front end to save a copy of the note
                },
                indentWithTab,
                ...defaultKeymap,
                ...historyKeymap,
                ...completionKeymap,
                ...searchKeymap,
            ];

            if ($editorConfig.autoCloseBrackets) {
                keymaps.push(...closeBracketsKeymap);
            }

            if ($editorConfig.foldGutter) {
                keymaps.push(...foldKeymap);
            }

            extensions.push(keymap.of(keymaps));

            // Set tab size/indent unit
            const tabSize = $editorConfig.tabSize || 4;
            extensions.push(indentUnit.of(" ".repeat(tabSize)));

            return extensions;
        }

        let state = EditorState.create({
            doc: content,
            extensions: createExtensions(),
        });

        // Watch for editorConfig changes and reconfigure extensions
        $effect(() => {
            if (editorView) {
                editorView.dispatch({
                    effects: [StateEffect.reconfigure.of(createExtensions())],
                });
            }
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

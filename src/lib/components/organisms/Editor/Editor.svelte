<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { EditorView } from "@codemirror/view";
    import { EditorState } from "@codemirror/state";
    import { markdown } from "@codemirror/lang-markdown";
    import { basicSetup } from "codemirror";
    import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
    import { classHighlighter, tags } from "@lezer/highlight";
    import { selectedLinePlugin } from "./SelectedLinePlugin";
    import "./md_style.css";
    import { tableRendererPlugin } from "./TableRendererPlugin";
    import { Table } from "@lezer/markdown";

    let editorContainer: HTMLDivElement;
    let editorView: EditorView;
    let { content = "" } = $props();

    export function getContent(): string {
        return editorView ? editorView.state.doc.toString() : content;
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
            ],
        });

        editorView = new EditorView({
            state,
            parent: editorContainer,
        });
    });

    onDestroy(() => {
        if (editorView) {
            editorView.destroy();
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

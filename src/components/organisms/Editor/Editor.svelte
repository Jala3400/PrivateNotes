<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { EditorView } from "@codemirror/view";
    import { EditorState } from "@codemirror/state";
    import { markdown } from "@codemirror/lang-markdown";
    import { basicSetup } from "codemirror";
    import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
    import { tags } from "@lezer/highlight";
    import "./md_style.css";

    let editorContainer: HTMLDivElement;
    let editorView: EditorView;
    let {
        content = $bindable(`# Hello World\n\nThis is a live preview demo.`),
    } = $props();
    onMount(() => {
        // Create custom markdown highlighting style
        const markdownHighlighting = HighlightStyle.define([
            { tag: tags.heading1, class: "md-header md-h1" },
            { tag: tags.heading2, class: "md-header md-h2" },
            { tag: tags.heading3, class: "md-header md-h3" },
            { tag: tags.heading4, class: "md-header md-h4" },
            { tag: tags.heading5, class: "md-header md-h5" },
            { tag: tags.heading6, class: "md-header md-h6" },
            { tag: tags.strong, class: "md-bold" },
            { tag: tags.emphasis, class: "md-italic" },
            { tag: tags.monospace, class: "md-code-inline" },
            { tag: tags.link, class: "md-link" },
            { tag: tags.url, class: "md-link-url" },
            { tag: tags.quote, class: "md-quote" },
            { tag: tags.list, class: "md-list-item" },
            { tag: tags.processingInstruction, class: "md-syntax" },
        ]);

        const state = EditorState.create({
            doc: content,
            extensions: [
                basicSetup,
                markdown(),
                syntaxHighlighting(markdownHighlighting),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        content = update.state.doc.toString();
                    }
                }),
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
        padding: 10px;
        border-radius: var(--border-radius-medium);
        overflow-y: auto;
        background: var(--background-darker);
        color: var(--text-primary);
        border: 1px solid var(--background-dark-lighter);
    }
</style>

<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { EditorView } from "@codemirror/view";
    import { EditorState } from "@codemirror/state";
    import { markdown } from "@codemirror/lang-markdown";
    import { basicSetup } from "codemirror";
    import { createMarkdownPreviewPlugin } from "./MarkdownPreviewPlugin";

    let editorContainer: HTMLDivElement;
    let editorView: EditorView;
    let {
        content = $bindable(`# Hello World\n\nThis is a live preview demo.`),
    } = $props();

    onMount(() => {
        const state = EditorState.create({
            doc: content,
            extensions: [
                basicSetup,
                markdown(),
                createMarkdownPreviewPlugin(),
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

    :global(.md-preview) {
        all: unset;
        display: inline;
        color: var(--text-primary);
        line-height: normal;
    }

    :global(.cm-widgetBuffer) {
        display: none !important;
        height: 0 !important;
        width: 0 !important;
    }

    :global(.cm-editor .cm-cursor) {
        border-left-color: var(--main-color);
    }
</style>

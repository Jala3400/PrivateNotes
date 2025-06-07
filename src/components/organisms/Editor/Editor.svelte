<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { EditorView } from "@codemirror/view";
    import { EditorState } from "@codemirror/state";
    import { markdown } from "@codemirror/lang-markdown";
    import MarkdownIt from "markdown-it";
    import { basicSetup } from "codemirror";

    let editorContainer: HTMLDivElement;
    let previewContainer: HTMLDivElement;
    let editorView: EditorView;

    let {
        content = $bindable(`# Hello World\n\nThis is a live preview demo.`),
    } = $props();

    let htmlPreview = $state("");
    const md = new MarkdownIt();

    function updatePreview(markdownText: string) {
        content = markdownText;
        htmlPreview = md.render(markdownText);
    }

    onMount(() => {
        const state = EditorState.create({
            doc: content,
            extensions: [
                basicSetup,
                markdown(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        updatePreview(update.state.doc.toString());
                    }
                }),
                EditorView.lineWrapping,
            ],
        });

        editorView = new EditorView({
            state,
            parent: editorContainer,
        });

        updatePreview(content);
    });

    onDestroy(() => {
        if (editorView) {
            editorView.destroy();
        }
    });
</script>

<div class="editor-wrapper">
    <div bind:this={editorContainer} class="editor-container"></div>
    <div bind:this={previewContainer} class="preview-container">
        {@html htmlPreview}
    </div>
</div>

<style>
    .editor-wrapper {
        display: flex;
        gap: 1rem;
        width: 100%;
        height: 100%;
    }

    .editor-container,
    .preview-container {
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

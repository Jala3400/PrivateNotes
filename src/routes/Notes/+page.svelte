<script>
    let content = $state("");
</script>

<div class="editor-container">
    <input
        id="note-title"
        class="editor-component"
        type="text"
        placeholder="Note Title"
    />

    <textarea
        id="note-content"
        class="editor-component"
        bind:value={content}
        placeholder="Start typing..."
        autofocus
    >
    </textarea>
</div>

<style>
    .editor-container {
        display: flex;
        flex-direction: column;
        gap: 20px;

        max-width: 800px;
        height: 100%;
        margin: 0 auto;
        padding: 20px;
    }

    .editor-component {
        background: transparent;
        color: var(--text-primary);
    }

    #note-title {
        width: 100%;
        padding: 8px;

        font-size: 24px;

        border: none;
        outline: none;

        transition: var(--transition);
    }

    #note-content {
        width: 100%;
        height: 100%;

        padding: 15px;

        border: none;

        resize: none;
        outline: none;
    }
</style>

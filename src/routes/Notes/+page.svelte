<script>
    import NoteEditor from "$lib/components/templates/NoteEditor/NoteEditor.svelte";
    import Sidebar from "$lib/components/organisms/Sidebar/Sidebar.svelte";
</script>

<div class="app-layout">
    <Sidebar />
    <div class="main-content">
        <NoteEditor />
    </div>
</div>

<style>
    .app-layout {
        display: grid;
        grid-template-columns: clamp(10em, 30%, 20em) auto;

        height: 100%;
        width: 100%;

        overflow: hidden;
    }

    .main-content {
        overflow: auto;
    }
</style>

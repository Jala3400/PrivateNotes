<script>
    import NoteEditor from "$lib/components/templates/NoteEditor/NoteEditor.svelte";
    import Sidebar from "$lib/components/templates/Sidebar/Sidebar.svelte";
    import Toolsbar from "$lib/components/templates/Toolsbar/Toolsbar.svelte";

    let sidebar_collapsed = $state(false);
</script>

<div
    class="app-layout"
    style="--sidebar-width: {sidebar_collapsed
        ? '0'
        : 'clamp(10em, 30%, 20em)'};"
>
    <Toolsbar bind:sidebar_collapsed />
    <Sidebar {sidebar_collapsed} />
    <div class="main-content">
        <NoteEditor />
    </div>
</div>

<style>
    .app-layout {
        display: grid;
        grid-template-columns: 3em var(--sidebar-width) auto;

        height: 100%;
        width: 100%;

        overflow: hidden;
    }

    .main-content {
        overflow: auto;
    }
</style>

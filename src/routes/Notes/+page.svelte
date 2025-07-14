<script>
    import ConfigModal from "$lib/components/templates/ConfigModal/ConfigModal.svelte";
    import NoteEditor from "$lib/components/templates/NoteEditor/NoteEditor.svelte";
    import Sidebar from "$lib/components/templates/Sidebar/Sidebar.svelte";
    import Toolsbar from "$lib/components/templates/Toolsbar/Toolsbar.svelte";

    let sidebarCollapsed = $state(false);
    let openConfigModal = $state(false);
</script>

<div
    class="app-layout"
    style="--sidebar-width: {sidebarCollapsed
        ? '0'
        : 'clamp(10em, 30%, 20em)'};"
>
    <Toolsbar bind:sidebarCollapsed bind:openConfigModal />
    <Sidebar {sidebarCollapsed} />
    <div class="main-content">
        <NoteEditor />
    </div>
</div>

<ConfigModal bind:open={openConfigModal} />

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

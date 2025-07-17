<script lang="ts">
    import ConfigModal from "$lib/components/templates/ConfigModal/ConfigModal.svelte";
    import NoteEditor from "$lib/components/templates/NoteEditor/NoteEditor.svelte";
    import Sidebar from "$lib/components/templates/Sidebar/Sidebar.svelte";
    import Toolsbar from "$lib/components/templates/Toolsbar/Toolsbar.svelte";
    import { appearanceConfig } from "$lib/stores/appearanceConfig";

    let openConfigModal = $state(false);
</script>

<div
    class="app-layout"
    style="--sidebar-width: {$appearanceConfig.sidebarCollapsed
        ? '0'
        : 'clamp(10em, 30%, 20em)'};"
>
    <Toolsbar bind:openConfigModal />
    <Sidebar />
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

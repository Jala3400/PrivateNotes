<script lang="ts">
    import CommandPalette from "$lib/components/organisms/CommandPalette/CommandPalette.svelte";
    import ConfigModal from "$lib/components/templates/ConfigModal/ConfigModal.svelte";
    import NoteEditor from "$lib/components/templates/NoteEditor/NoteEditor.svelte";
    import Sidebar from "$lib/components/templates/Sidebar/Sidebar.svelte";
    import Toolsbar from "$lib/components/templates/Toolsbar/Toolsbar.svelte";
    import { appearanceConfig } from "$lib/stores/configs/appearanceConfig";

    let openConfigModal = $state(false);
    let openCommandPalette = $state(false);

    // Open command palette with Ctrl+P or Cmd+P
    if (typeof window !== "undefined") {
        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
                e.preventDefault();
                openCommandPalette = true;
            }
        });
    }
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
<CommandPalette bind:open={openCommandPalette} />

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

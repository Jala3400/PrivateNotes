<script lang="ts">
    import {
        editorConfig,
        editorConfigDescription,
        setEditorConfig,
    } from "$lib/stores/configs/editorConfig";
    import ConfigGroup from "$lib/components/organisms/ConfigGroup/ConfigGroup.svelte";
    import {
        appearanceConfig,
        appearanceConfigDescription,
        setAppearanceConfig,
    } from "$lib/stores/configs/appearanceConfig";
    import ConfigGroupTab from "$lib/components/atoms/ConfigGroupTab.svelte";

    interface Props {
        open: boolean;
    }

    let { open = $bindable() }: Props = $props();

    let modalElement: HTMLDialogElement;

    $effect(() => {
        if (open) {
            modalElement.showModal();
        } else {
            modalElement.close();
        }
    });

    function closeModal() {
        open = false;
    }

    const configs = $derived([
        {
            name: "Appearance",
            config: $appearanceConfig,
            description: appearanceConfigDescription,
            setConfig: setAppearanceConfig,
        },
        {
            name: "Editor",
            config: $editorConfig,
            description: editorConfigDescription,
            setConfig: setEditorConfig,
        },
    ]);

    let currentOpen = $state(0);
</script>

<dialog
    bind:this={modalElement}
    onclick={closeModal}
    onclose={closeModal}
    class="dialog-container"
>
    <div
        id="config-content"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <div id="config-group-list">
            {#each configs as config, index}
                <ConfigGroupTab
                    open={index === currentOpen}
                    onclick={() => (currentOpen = index)}
                    title={config.name}
                />
            {/each}
        </div>

        <div class="config-group-container">
            <ConfigGroup
                title={configs[currentOpen].name + " Configuration"}
                optionsDescription={configs[currentOpen].description}
                bind:configOptions={configs[currentOpen].config}
                onChange={configs[currentOpen].setConfig}
            />
        </div>
    </div>
</dialog>

<style>
    .dialog-container {
        border-radius: var(--border-radius-medium);
        border: 1px solid var(--border-color);
        background-color: var(--background-dark);
        color: var(--text-color);
        width: clamp(20em, 80%, 40em);
        height: clamp(20em, 80%, 30em);
        margin: auto;
    }

    .dialog-container::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }

    #config-content {
        display: grid;
        grid-template-columns: clamp(10em, 20%, 15em) auto;
        height: 100%;
    }

    #config-group-list {
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--border-color);
        background-color: var(--background-dark-light);
    }

    .config-group-container {
        padding: 1.3em;
        padding-top: 0.85em;
    }
</style>

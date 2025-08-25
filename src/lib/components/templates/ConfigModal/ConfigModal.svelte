<script lang="ts">
    import ConfigGroupTab from "$lib/components/atoms/ConfigGroupTab.svelte";
    import ConfigGroup from "$lib/components/organisms/ConfigGroup/ConfigGroup.svelte";
    import { configGroupList } from "$lib/stores/configGroups";
    import { get } from "svelte/store";

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

    let currentOpen = $state(0);
    let currentStore = $derived(configGroupList[currentOpen].store);
    let currentSetter = $derived(configGroupList[currentOpen].setter);
    let unListener: () => void;

    // svelte-ignore state_referenced_locally
    let currentConfig = $state(get(currentStore));

    $effect(() => {
        unListener?.();

        // When you a subscription is started the callback is executed immediately
        // so currentConfig is set to the current value of the store
        unListener = currentStore.subscribe((value) => {
            currentConfig = value;
        });
    });
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
            {#each configGroupList as config, index}
                <ConfigGroupTab
                    open={index === currentOpen}
                    onclick={() => (currentOpen = index)}
                    title={config.name}
                />
            {/each}
        </div>

        <div class="config-group-container">
            <ConfigGroup
                title={configGroupList[currentOpen].name + " Configuration"}
                sections={configGroupList[currentOpen].sections}
                bind:configOptions={currentConfig}
                onChange={currentSetter}
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
        width: 80%;
        max-width: 50em;
        height: 80%;
        max-height: 40em;
        margin: auto;
    }

    .dialog-container::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
    }

    #config-content {
        display: grid;
        grid-template-columns: clamp(7em, 20%, 15em) auto;
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
        user-select: none;
    }
</style>

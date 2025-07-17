<script lang="ts">
    import { throwCustomError } from "$lib/error";
    import { commandList } from "$lib/stores/commandList";
    import type { Command } from "$lib/types";

    let { open = $bindable() } = $props();
    let modalElement: HTMLDialogElement;
    let inputValue = $state("");
    let selected = $state(0);

    const filtered = $derived(() =>
        inputValue
            ? $commandList.filter(
                  (cmd) =>
                      cmd.name
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()) ||
                      cmd.pattern.test(inputValue)
              )
            : $commandList
    );

    $effect(() => {
        if (open) {
            modalElement.showModal();
        } else if (modalElement?.open) {
            modalElement.close();
        }
    });

    $effect(() => {
        if (selected >= filtered().length) selected = 0;
    });

    function closeModal() {
        open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        const len = filtered().length;
        if (!len) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                selected = (selected + 1) % len;
                break;
            case "ArrowUp":
                e.preventDefault();
                selected = (selected - 1 + len) % len;
                break;
            case "Enter":
                e.preventDefault();
                const cmd = filtered()[selected];
                if (inputValue.match(cmd.pattern) || !cmd.requireArgs) {
                    runCommand(filtered()[selected]);
                } else {
                    inputValue = filtered()[selected]?.name ?? inputValue;
                }
                break;
            case "Escape":
                open = false;
                break;
            case "Tab":
                e.preventDefault();
                const currentName = filtered()[selected]?.name ?? "";
                const inputWords = inputValue.split(" ");
                const nameWords = currentName.split(" ");

                if (inputWords.length < nameWords.length) {
                    const prefix = inputWords.slice(0, -1);
                    const nextWord = nameWords[inputWords.length - 1];
                    inputValue = [...prefix, nextWord].join(" ");
                } else {
                    inputValue = nameWords.join(" ");
                }

                break;
        }
    }

    function runCommand(cmd: Command) {
        const match = inputValue.match(cmd.pattern);
        const args = match ? match.slice(1) : [];

        if (cmd.requireArgs && !args.length) {
            throwCustomError(
                "Not enough arguments for command " + cmd.name,
                "Missing arguments for command " + cmd.name
            );
        }

        cmd.execute(args);
        open = false;
        inputValue = "";
    }
</script>

<dialog
    bind:this={modalElement}
    onclick={closeModal}
    onclose={closeModal}
    class="palette-container"
>
    <div
        id="command-palette"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <!-- svelte-ignore a11y_autofocus -->
        <input
            class="palette-input"
            bind:value={inputValue}
            placeholder="Type a command..."
            onkeydown={handleKeydown}
            autocomplete="off"
            autofocus={true}
        />
        <div class="palette-list">
            {#each filtered() as cmd, i}
                <button
                    class:selected={i === selected}
                    onclick={() => runCommand(cmd as Command)}
                    class="palette-list-item"
                >
                    {cmd.name}
                </button>
            {/each}
            {#if !filtered().length}
                <p class="no-match">No matching commands</p>
            {/if}
        </div>
    </div>
</dialog>

<style>
    .palette-container {
        position: absolute;
        inset: 0;
        margin: 10vh auto;
        background: var(--background-dark);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-medium);
        min-width: 28em;
        max-width: 90vw;
        padding: 1em;
        padding-top: 0.5em;
        color: var(--text-primary);
        overflow: hidden;
    }

    #command-palette {
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5em;
    }

    .palette-input {
        width: 100%;
        padding: 0.5em;
        background-color: transparent;
        outline: none;
        border: none;
        color: var(--text-primary);
        font-size: 1em;
        font-weight: 500;
    }

    .palette-list {
        width: 100%;
    }

    .palette-list {
        width: 100%;
        padding: 0;
        list-style: none;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.25em;
    }

    .palette-list-item {
        width: 100%;
        padding: 0.4em 0.6em;
        border-radius: var(--border-radius-small);
        background: transparent;
        border: none;
        color: var(--text-primary);
        text-align: left;
        font-size: 1em;
        outline: none;
        user-select: none;
    }

    .palette-list-item.selected,
    .palette-list-item:hover {
        background: var(--background-dark-light);
        color: var(--main-color);
    }

    .no-match {
        color: var(--text-muted);
        font-size: 1.2em;
        text-align: center;
        padding: 0.7em 0;
        user-select: none;
    }
</style>

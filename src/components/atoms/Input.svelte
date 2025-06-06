<script lang="ts">
    let {
        value = $bindable(""),
        isValid = $bindable(true),
        oninput = () => {},
        ...restProps
    } = $props();

    let inputElement: HTMLInputElement;

    function checkValidity() {
        if (inputElement) {
            isValid = inputElement.checkValidity();
        }
    }
</script>

<input
    bind:this={inputElement}
    bind:value
    class="input"
    oninput={() => {
        checkValidity();
        oninput();
    }}
    {...restProps}
/>

<style>
    input {
        width: 100%;
        padding: 8px;

        background-color: var(--background-dark-lighter);
        color: var(--text-color);

        border: none;
        border-radius: var(--border-radius-medium);

        transition: var(--transition);
    }

    input:focus:valid {
        outline: solid 1px var(--main-color);
    }

    input:focus:invalid {
        outline: solid 1px var(--danger-color);
        caret-color: var(--danger-color);
    }
</style>

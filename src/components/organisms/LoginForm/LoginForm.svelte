<script lang="ts">
    import Input from "../../atoms/Input.svelte";
    import NeonButton from "../../atoms/NeonButton.svelte";

    let passValid = $state(false);
</script>

<div id="login-container">
    <div id="photo-container">
        <img src="/hacker.png" alt="hacker" />
    </div>

    <h1>Login</h1>

    <div class="input-group">
        <label for="username">Username </label>
        <Input type="text" placeholder="Enter username" id="username" />
    </div>

    <div class="input-group">
        <label for="password">Password </label>
        <Input
            type="password"
            placeholder="Enter password (8 characters minimum)"
            id="password"
            minlength="8"
            required
            oninput={() => {
                console.log("Password input changed");
            }}
            bind:isValid={passValid}
        />
    </div>

    <NeonButton
        type="submit"
        id="loginbtn"
        class="greatbtn"
        disabled={!passValid}
        text="Login"
    />
</div>

<style>
    /* Container */
    #login-container {
        display: flex;
        flex-direction: column;
        gap: 16px;

        width: clamp(20rem, 61.8%, 42rem);
        height: clamp(28rem, 80%, 42rem);

        padding: 1.5rem;
        padding-bottom: 1.2rem;

        border: 3px solid var(--main-color);
        border-radius: var(--border-radius-big);

        background-color: var(--background-dark);
        overflow: auto;
    }

    #photo-container {
        overflow: hidden;
        display: flex;
        justify-content: center;
        min-width: none;
        min-height: none;
    }

    img {
        height: 100%;
        border-radius: 50%;
        object-fit: contain;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    label {
        user-select: none;
    }

    @media (max-height: 28rem) {
        #login-container {
            height: auto;
        }

        #photo-container {
            display: none;
        }
    }
</style>

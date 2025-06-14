<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import Input from "$lib/components/atoms/Input.svelte";
    import NeonButton from "$lib/components/atoms/NeonButton.svelte";

    let username = $state("");
    let passValid = $state(false);
    let password = $state("");
    let confirmPassword = $state("");

    async function login(event: Event) {
        event.preventDefault();

        // Validate inputs
        if (!password || !confirmPassword) {
            alert("Please fill in the password fields!");
            return;
        }

        // Check password length
        if (password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Attempt to derive the encryption key
        try {
            await invoke("derive_encryption_key", { username, password });
            // Navigate to /Notes after successful login
            window.location.replace("/Notes");
        } catch (error) {
            console.error("Error during login:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    }
</script>

<form id="login-container" onsubmit={login}>
    <div id="photo-container">
        <img src="/hacker.png" alt="hacker" />
    </div>

    <h1>Login</h1>

    <div class="input-group">
        <label for="username">Username </label>
        <Input
            bind:value={username}
            type="text"
            placeholder="Enter username"
            id="username"
            autocomplete="off"
        />
    </div>

    <div class="dual-input-group">
        <div class="input-group">
            <label for="password">Password </label>
            <Input
                type="password"
                placeholder="Enter password (8 characters minimum)"
                id="password"
                minlength="8"
                required
                bind:value={password}
                bind:isValid={passValid}
            />
        </div>

        <div class="input-group">
            <label for="confirm-password">Confirm password </label>
            <Input
                type="password"
                placeholder="Confirm password"
                id="confirm-password"
                minlength="8"
                required
                bind:value={confirmPassword}
            />
        </div>
    </div>

    <NeonButton
        type="submit"
        id="loginbtn"
        class="greatbtn"
        disabled={!(passValid && password === confirmPassword)}
        text="Login"
    />
</form>

<style>
    /* Container */
    #login-container {
        display: flex;
        flex-direction: column;
        gap: 16px;

        width: 100%;
        height: 100%;

        padding: 1.5rem;
        padding-bottom: 1.2rem;

        border: 3px solid var(--main-color);
        border-radius: var(--border-radius-big);

        background-color: var(--background-dark);
        overflow: auto;
    }

    #photo-container {
        display: flex;
        justify-content: center;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
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
        width: 100%;
    }

    .dual-input-group {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }

    .dual-input-group .input-group {
        flex: 1 1 130px; /* grow, shrink, min-width basis */
        min-width: 130px;
    }

    label {
        user-select: none;
    }

    @media (max-height: 30rem) {
        #login-container {
            height: auto;
        }

        #photo-container {
            display: none;
        }
    }
</style>

<script>
    import LoginForm from "$lib/components/templates/LoginForm/LoginForm.svelte";
</script>

<div id="container">
    <LoginForm />
</div>

<style>
    #container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: clamp(30rem, 80vh, 35rem);
        width: clamp(20rem, 60vw, 30rem);
    }
</style>

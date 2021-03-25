<script lang="ts">
    export let username = "guest"
    export let text = ""
</script>

<div>
    <strong>{username}</strong>
    <p>{text} </p>
</div>

<style>
    p, strong {
        margin: 0;
        word-wrap: break-word;
    }
    div {
        margin: 8px 0;
        background: rgb(30, 30, 40);
    }
</style>
<script>
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head><title>Haunted Repo</title></svelte:head>
{@render children()}

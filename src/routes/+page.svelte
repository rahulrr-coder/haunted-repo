<script>
	import { g, onPointer, runDemo } from '$lib/game.svelte.js';
	import World from '$lib/components/World.svelte';
	import Overlays from '$lib/components/Overlays.svelte';
	import Hud from '$lib/components/Hud.svelte';
	import Intro from '$lib/components/Intro.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Win from '$lib/components/Win.svelte';

	$effect(() => {
		document.body.classList.toggle('win', g.win);
		document.body.classList.toggle('playing', g.playing);
	});
</script>

<svelte:window onpointermove={onPointer} />

<World />
<Overlays />
<Hud />
<Intro />
<Panel />
<Win />

{#if g.cap}
	<div class="pointer-events-none fixed inset-x-0 bottom-16 z-[15] px-6 text-center">
		<span class="inline-block max-w-[90vw] rounded bg-black/70 px-5 py-2 font-type text-[clamp(1.1rem,2.4vw,1.9rem)] tracking-wide text-bone [text-shadow:0_0_14px_#b3121b]">{g.cap}</span>
	</div>
{/if}

{#if g.demoSplash}
	<div class="fixed inset-0 z-40 grid place-items-center bg-black/90">
		<button class="cursor-pointer rounded bg-blood px-9 py-4 text-2xl tracking-wider text-bone uppercase" onclick={runDemo}>▶ Start take</button>
	</div>
{/if}

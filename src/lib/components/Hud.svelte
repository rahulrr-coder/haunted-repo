<script>
	import { g, toggleSound } from '../game.svelte.js';

	const n = $derived(g.D?.rooms.length ?? 0);
	const k = $derived(g.S.healed.length);
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-[12] flex items-center justify-between px-[22px] py-3 font-osd text-[22px] text-white [text-shadow:0_0_6px_#000]">
	<span><b class="rec text-[#ff3040]">●</b> REC {g.tc}</span>
	<span class="absolute left-1/2 -translate-x-1/2 text-lg tracking-[0.3em] text-white/70 max-sm:hidden">HAUNTED REPO</span>
	<span class="whitespace-nowrap">
		<span class="max-sm:hidden">10/31 11:58 PM</span>
		<button class="pointer-events-auto ml-2.5 cursor-pointer rounded-md border border-white/30 bg-black/50 px-2.5 font-osd text-xl" onclick={toggleSound} aria-label="Toggle sound">{g.sndOn ? 'SND ON' : 'SND OFF'}</button>
	</span>
</div>

{#if g.playing && g.D}
	<div class="pointer-events-none fixed bottom-5 left-[22px] z-[12] w-[min(300px,46vw)] font-osd text-[22px] text-white [text-shadow:0_0_6px_#000] portrait:top-12 portrait:bottom-auto">
		{k === n ? 'AT PEACE' : `${n - k} ROOM${n - k > 1 ? 'S' : ''} POSSESSED`}
		<div class="bar"><i style="width:{(100 * k) / n}%"></i></div>
	</div>
{/if}

<script>
	import { g, enter } from '../game.svelte.js';

	const EXAMPLES = ['expressjs/express', 'pallets/click', 'sindresorhus/got'];
	const go = (u) => enter(/^https?:\/\//.test(u) ? u : 'https://' + u);
</script>

<div
	inert={g.playing}
	class={['fixed inset-0 z-[6] grid place-content-center p-6 text-center transition-opacity duration-[2400ms]', g.playing && 'pointer-events-none opacity-0']}
	style="background:radial-gradient(ellipse at center,#0004,#0009)"
>
	<h1 class="title font-display text-[clamp(2rem,7.5vw,6.2rem)] leading-[1.05] text-blood">Haunted Repo</h1>
	<p class="mt-4 mb-8 text-[15px] tracking-[0.3em] text-[#c9bfae] uppercase">Read the code. Wake the dead.</p>
	<form class="mx-auto flex w-[min(640px,92vw)] gap-2" onsubmit={(e) => { e.preventDefault(); go(g.url); }}>
		<input
			class="min-w-0 flex-1 rounded-[3px] border border-[#5a2a33] bg-black/80 px-4 py-[15px] font-code text-base text-bone caret-blood placeholder:text-[#6d5a5a]"
			placeholder="github.com/owner/repo" aria-label="GitHub repo URL" autocomplete="off" required bind:value={g.url}
		/>
		<button class="cursor-pointer rounded-[3px] bg-blood px-5 py-3 text-sm tracking-[0.08em] text-bone uppercase hover:brightness-125 disabled:opacity-60" disabled={g.busy}>{g.busy ? '…' : 'Enter'}</button>
	</form>
	<div class="mt-4 flex flex-wrap justify-center gap-2">
		{#each EXAMPLES as x}
			<button type="button" class="cursor-pointer rounded-[3px] border border-dashed border-[#5a2a33] px-2.5 py-1 font-code text-xs text-mute hover:brightness-125" onclick={() => { g.url = 'github.com/' + x; go(g.url); }}>{x}</button>
		{/each}
	</div>
	<div class="mt-2.5 min-h-[1.4em] text-sm text-[#ff6b6b]" role="alert">{g.err}</div>
	<p class="mt-6 font-osd text-[19px] tracking-[0.12em] text-[#8a7f78]">HEADPHONES ON · CONTAINS SUDDEN SCARES AND LOUD SOUNDS</p>
</div>

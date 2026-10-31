<script>
	import { g, pick, answer, askHint } from '../game.svelte.js';

	const room = $derived(g.D?.rooms[g.S.active]);
	const qs = $derived(room?.questions ?? []);
	const k = (qi) => `${room.id}.${qi}`;
	const next = $derived(room ? qs.findIndex((_, qi) => !g.S.solved.includes(k(qi))) : -1);
	const qi = $derived(g.holding && g.holding.room === room?.id ? g.holding.qi : next); // keep a solved rite on screen while its proof is read
	const q = $derived(qi >= 0 ? qs[qi] : null);
	const solved = $derived(q ? g.S.solved.includes(k(qi)) : false);
	const base = (f) => f.split('/').pop();
	const gh = (f) => `https://github.com/${g.D.owner}/${g.D.repo}/blob/${g.D.branch}/${f}`;
	const parts = (t) => t.split('`'); // odd indexes are code

	const card = 'pointer-events-auto rounded border border-line bg-[#07040b]/85 p-4 shadow-[0_14px_50px_#000c] backdrop-blur-[3px]';
</script>

{#if g.playing && g.D && room}
	<aside id="panel" class="pointer-events-none fixed top-16 right-6 bottom-6 z-[6] flex w-[min(400px,92vw)] flex-col gap-3.5 overflow-auto portrait:inset-x-0 portrait:top-auto portrait:bottom-0 portrait:w-auto portrait:max-h-[46vh] portrait:px-2.5 portrait:pb-2.5">
		<div class={card}>
			<div class="font-osd text-[22px] tracking-[0.14em] text-blood uppercase">Start here</div>
			<a class="my-1 block border-b border-dashed border-gold/35 font-code text-[15px] font-semibold break-all text-gold no-underline" href={gh(g.D.path[0].file)} target="_blank" rel="noopener">{g.D.path[0].file}</a>
			<small class="font-code text-xs text-mute">
				then
				{#each g.D.path.slice(1, 4) as p, i}{i ? ' → ' : ' '}<a class="underline" href={gh(p.file)} target="_blank" rel="noopener">{base(p.file)}</a>{/each}
			</small>
		</div>

		<div class={card}>
			<div class="mb-2.5 flex flex-wrap gap-1.5">
				{#each g.D.rooms as r, i}
					<button
						class={['cursor-pointer border px-2.5 py-0.5 font-osd text-xl tracking-[0.04em]', i === g.S.active ? 'border-blood text-bone' : 'border-line text-mute', g.S.healed.includes(r.id) && 'border-[#6b5320]! text-gold!']}
						onclick={() => pick(i)}>{r.name.split('/').pop()}</button>
				{/each}
			</div>
			<div class="mb-1.5 flex items-center">
				<span class="font-osd text-[22px] tracking-[0.14em] text-blood uppercase">{room.id === 0 ? 'The door · ' : ''}Rites</span>
				<div class="ml-auto flex items-center gap-1.5" aria-label="Rites completed">
					{#each qs as _, i}<span class={['pip', g.S.solved.includes(k(i)) && 'on']}></span>{/each}
				</div>
			</div>
			<p class="whisper">{g.line.room}</p>

			{#if q}
				<div>
					<p class="mb-1.5">{#each parts(q.text) as t, i}{#if i % 2}<code class="font-code text-[13px] text-gold">{t}</code>{:else}{t}{/if}{/each}</p>
					{#each q.options as o, oi}
						{@const bad = g.wrong[`${k(qi)}.${oi}`]}
						{@const good = solved && oi === q.answer}
						<button
							class={['my-1.5 block w-full cursor-pointer rounded-[3px] border px-3 py-2.5 text-left font-code text-[13px] break-all', good ? 'border-gold bg-gold/15 text-gold' : bad ? 'border-blood bg-blood/20 text-[#ff8a8a] line-through' : 'border-line bg-black/60 text-bone hover:border-blood hover:bg-[#1a0609]']}
							disabled={bad || solved || !!g.holding}
							onclick={() => answer(room, qi, oi)}>{o}</button>
					{/each}
					{#if solved}
						<div class="mt-2 text-[13px] text-mute">Proof: {#each parts(q.evidence) as t, i}{#if i % 2}<code class="font-code text-gold">{t}</code>{:else}{t}{/if}{/each}</div>
					{:else}
						<button class="mt-1 cursor-pointer rounded-[3px] border border-line px-2.5 py-0.5 font-osd text-xl text-mute" onclick={() => askHint(room, q)}>🕯 hint</button>
						{#if g.hintFor === q.text}<p class="whisper mt-2">{g.line.hint}</p>{/if}
					{/if}
				</div>
			{:else}
				<p class="mt-1.5 text-gold">The windows glow again.</p>
			{/if}
		</div>
	</aside>
{/if}

<script>
	import { g, pick } from '../game.svelte.js';
	import { SLOTS, HX, arch, FIG, monster, worldTop, worldBottom } from '../art.js';

	let w = $state(1600), h = $state(900);
	const portrait = $derived(w <= h);
	const top = worldTop(), bottom = worldBottom();

	$effect(() => {
		const el = document.getElementById('lawn');
		if (el) el.style.transform = `translate(${g.lawn * 70}px,${g.lawn * 6}px) scale(${0.5 + g.lawn * 0.12})`;
	});
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div class={['fixed inset-0 z-0 origin-[62%_62%] overflow-hidden bg-[#07040c] transition-transform duration-[3000ms] ease-out', !g.playing && 'scale-[1.28]']}>
	<svg
		class="absolute inset-x-0 block w-full"
		style={portrait && g.playing ? 'top:46px;height:calc(100% - 46px - 46vh)' : 'top:0;height:100%'}
		viewBox={portrait ? '330 120 800 780' : '0 0 1600 900'}
		preserveAspectRatio={portrait ? 'xMidYMax meet' : 'xMidYMid slice'}
		aria-label="A haunted house. Each window is a room of the repository."
	>
		{@html top}
		<g transform="translate({HX} 0)">
			{#each SLOTS as p, i (i)}
				{@const room = g.D?.rooms[i]}
				{#if room && !g.S.healed.includes(room.id)}
					<polygon class="shaft" points="{p.x},{p.y + p.h} {p.x + p.w},{p.y + p.h} {p.x + p.w + 70},{p.y + p.h + 190} {p.x - 70},{p.y + p.h + 190}" fill="url(#shaftg)" style="animation-delay:-{i * 1.1}s" />
				{/if}
			{/each}
			{#each SLOTS as p, i (i)}
				{@const room = g.D?.rooms[i]}
				{@const landing = !g.D}
				{@const done = !!room && g.S.healed.includes(room.id)}
				{@const live = landing || (!!room && !done)}
				<g
					class={['slot', live && 'haunted', done && 'healed', !landing && !room && 'boarded', !landing && room && g.S.active === i && 'active']}
					data-i={i}
					role={room ? 'button' : undefined}
					tabindex={room ? 0 : undefined}
					aria-label={room ? `Room ${room.name}, ${done ? 'healed' : 'haunted'}` : undefined}
					onclick={() => room && pick(i)}
					onkeydown={(e) => room && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(i))}
				>
					<path class="pane" d={arch(p)} style="animation-delay:-{(i * 1.3).toFixed(1)}s" />
					<g clip-path="url(#c{i})">
						{#if room && !done}
							<g class={['figure', g.shown[i] && 'show']} data-fig={i} transform="translate({p.x} {p.y}) scale({p.w / 96} {p.h / 140})">{@html monster(FIG[i])}</g>
						{/if}
						{#if live}
							<path class="curt" d="M{p.x} {p.y + 4}h{p.w * 0.26}l-{p.w * 0.06} {p.h * 0.62}H{p.x}z" fill="#1a0e1a" opacity=".9" />
							<path class="curt" d="M{p.x + p.w} {p.y + 4}h-{p.w * 0.26}l{p.w * 0.06} {p.h * 0.62}h{p.w * 0.2}z" fill="#1a0e1a" opacity=".9" />
						{/if}
						{#if room && !done}
							<path d="M{p.x + p.w * 0.3} {p.y + 14}l{p.w * 0.15} {p.h * 0.22}l-{p.w * 0.08} {p.h * 0.18}l{p.w * 0.2} {p.h * 0.24}M{p.x + p.w * 0.65} {p.y + 26}l-{p.w * 0.12} {p.h * 0.32}" stroke="#fff" stroke-opacity=".22" fill="none" stroke-width="1.5" />
						{/if}
						{#if !landing && !room}
							<path d="M{p.x - 10} {p.y + p.h * 0.2}l{p.w + 20} 14M{p.x - 10} {p.y + p.h * 0.55}l{p.w + 20} -10M{p.x - 10} {p.y + p.h * 0.85}l{p.w + 20} 8" stroke="#2a1a14" stroke-width="11" />
						{/if}
					</g>
					<path class="frame" d={arch(p)} fill="none" stroke="#2a2030" stroke-width="6" />
					<path d="M{p.x + p.w / 2} {p.y - 6}V{p.y + p.h}M{p.x} {p.y + p.h * 0.5}H{p.x + p.w}" stroke="#17101c" stroke-width="3" opacity=".9" />
					{#if room}
						<text x={p.x + p.w / 2} y={p.y + p.h + 28} text-anchor="middle">{room.name.split('/').pop().slice(0, 12)}</text>
					{/if}
				</g>
			{/each}
		</g>
		{@html bottom}
	</svg>
</div>

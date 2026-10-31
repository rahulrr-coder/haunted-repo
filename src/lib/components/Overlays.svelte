<script>
	import { onMount } from 'svelte';
	import { g } from '../game.svelte.js';
	import { FACES } from '../art.js';

	let bats = $state([]);
	onMount(() => {
		bats = Array.from({ length: 6 }, () => ({ top: 6 + Math.random() * 28, w: 22 + Math.random() * 24, dur: 14 + Math.random() * 14, delay: -Math.random() * 20 }));
	});
</script>

<div class="fx dawn z-0"></div>
{#each bats as b}
	<svg class="bat" viewBox="0 0 50 20" style="top:{b.top}vh;width:{b.w}px;animation-duration:{b.dur}s;animation-delay:{b.delay}s"><path d="M0 10Q10-5 20 8Q25 0 30 8Q40-5 50 10Q35 6 25 18Q15 6 0 10Z" /></svg>
{/each}
<div class="fx fog z-[3]"><i></i><i></i><i></i></div>
<div class="fx dark z-[4]"></div>
<div class="fx vig z-[7]"></div>
<div class="fx scan z-[9]"></div>
<div class="fx grain z-[9]"></div>
<div class="track"></div>
{#key g.flash}
	{#if g.flash}<div class="fx flashbolt z-10"></div>{/if}
{/key}
{#if g.scare.on}
	{#key g.scare.tick}
		<div class={['fx scarewrap z-20', g.scare.face === 1 && 'v1']}>{@html FACES[g.scare.face]}</div>
	{/key}
{/if}
{#if g.vd.on}
	<div class={['void', g.vd.red && 'red']}>
		{#if g.vd.stage !== 'gone'}<div class="vface {g.vd.stage}">{@html FACES[0]}</div>{/if}
	</div>
{/if}

<script>
	import { g } from '../game.svelte.js';
	let copied = $state('');

	async function share() {
		const t = `I healed the haunted house of ${g.D.owner}/${g.D.repo} by reading its code. #devchallenge #hf26challenge`;
		try { await navigator.clipboard.writeText(t); copied = 'Copied'; } catch { copied = t; }
	}
</script>

{#if g.winOpen}
	<div class="fixed inset-0 z-30 grid place-items-center bg-black/70 p-6">
		<div class="max-w-[440px] rounded border border-line bg-[#07040b]/90 p-6 text-center shadow-[0_14px_50px_#000c]">
			<h2 class="my-1 mb-4 font-display text-[2rem] text-gold [text-shadow:0_0_20px_#ffc76688]">Healed</h2>
			<p class="whisper text-left">{g.line.win}</p>
			<button class="cursor-pointer rounded-[3px] bg-blood px-5 py-3 text-sm tracking-[0.08em] text-bone uppercase" onclick={share}>{copied || 'Copy my victory'}</button>
			<button class="ml-2 cursor-pointer rounded-[3px] border border-line px-5 py-3 text-sm tracking-[0.08em] text-mute uppercase" onclick={() => (g.winOpen = false)}>Stay</button>
		</div>
	</div>
{/if}

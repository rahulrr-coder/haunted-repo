<script>
	import { onMount } from 'svelte';
	let { opacity = 0.3 } = $props();
	let canvas;

	// low-res TV static, redrawn ~15 times a second so it reads as a damaged signal rather than a strobe
	onMount(() => {
		const ctx = canvas.getContext('2d'), w = (canvas.width = 192), h = (canvas.height = 108), img = ctx.createImageData(w, h);
		const draw = () => {
			const d = img.data;
			for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = Math.random() * 255; d[i + 3] = 255; }
			ctx.putImageData(img, 0, 0);
		};
		draw();
		const id = setInterval(draw, 66);
		return () => clearInterval(id);
	});
</script>

<canvas bind:this={canvas} class="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen [image-rendering:pixelated]" style="opacity:{opacity}"></canvas>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Motion } from 'svelte-motion';

	export let delay = 0;
	export let y = 24;
	export let duration = 0.6;
	export let className = '';

	let prefersReducedMotion = false;

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => {
			prefersReducedMotion = media.matches;
		};
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});
</script>

<Motion
	let:motion
	initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y }}
	animate={{ opacity: 1, y: 0 }}
	transition={prefersReducedMotion ? { duration: 0 } : { duration, delay, ease: [0.22, 1, 0.36, 1] }}
>
	<div use:motion class={className}>
		<slot />
	</div>
</Motion>

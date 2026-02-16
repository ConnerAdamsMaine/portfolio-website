<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = 'Modal';
	export let description = '';
	export let maxWidthClass = 'max-w-4xl';

	const dispatch = createEventDispatcher<{ close: void }>();

	const close = () => {
		dispatch('close');
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (open && event.key === 'Escape') {
			close();
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/80 px-4 py-8 backdrop-blur-sm sm:py-12"
		role="presentation"
		on:click={close}
	>
		<div
			class={`glass w-full ${maxWidthClass} border border-ink-200/40 p-6 sm:p-8`}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			on:click|stopPropagation
			on:keydown|stopPropagation={() => {}}
		>
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-1">
					<h2 class="text-2xl font-semibold text-white">{title}</h2>
					{#if description}
						<p class="text-sm text-ink-200">{description}</p>
					{/if}
				</div>
				<button class="nav-pill" type="button" on:click={close}>Close</button>
			</div>
			<div class="mt-6">
				<slot />
			</div>
		</div>
	</div>
{/if}

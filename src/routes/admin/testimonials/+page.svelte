<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import MotionReveal from '$lib/components/MotionReveal.svelte';
	import AdminNav from '$lib/components/AdminNav.svelte';
	import { formatTitle } from '$lib/utils/seo';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData | undefined;

	type FormFeedback = {
		action?: string;
		message?: string;
		success?: boolean;
		itemId?: number;
	};

	const feedback = form as FormFeedback | undefined;
	const isAction = (action: string) => feedback?.action === action;

	let pending: PageData['testimonials'] = [];
	let approved: PageData['testimonials'] = [];

	$: pending = data.testimonials.filter((item) => item.approved === 0);
	$: approved = data.testimonials.filter((item) => item.approved === 1);

	const confirmDelete = (event: Event) => {
		if (!confirm('Delete this testimonial?')) event.preventDefault();
	};
</script>

<SeoHead title={formatTitle('Admin | Testimonials')} description="Approve and manage testimonials." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Testimonials</h1>
		<p class="max-w-2xl text-lg text-ink-200">Review and approve testimonials before they go live.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold text-white">
			Pending <span class="text-sm font-normal text-ink-200">({pending.length})</span>
		</h2>
		{#if pending.length}
			<div class="grid gap-4">
				{#each pending as item}
					{@const attribution = [item.role, item.company].filter(Boolean).join(' · ')}
					<MotionReveal className="card space-y-3">
						{#if isAction('approve') && feedback?.itemId === item.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<blockquote class="text-lg text-white">{item.quote}</blockquote>
						<div class="text-sm text-ink-200">
							<p class="font-semibold text-white">{item.name}</p>
							{#if attribution}
								<p>{attribution}</p>
							{/if}
							{#if item.email}
								<p>Email: {item.email}</p>
							{/if}
							{#if item.project}
								<p>Project: {item.project}</p>
							{/if}
							{#if item.result}
								<p>Result: {item.result}</p>
							{/if}
						</div>
						<div class="flex flex-wrap gap-3">
							<form method="POST" action="?/approve">
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={item.id} />
								<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
									Approve
								</button>
							</form>
							<form method="POST" action="?/delete" on:submit={confirmDelete}>
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={item.id} />
								<button class="nav-pill" type="submit">Delete</button>
							</form>
						</div>
					</MotionReveal>
				{/each}
			</div>
		{:else}
			<div class="glass p-6 text-sm text-ink-200">No pending testimonials.</div>
		{/if}
	</div>
</section>

<section class="section-pad">
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold text-white">
			Approved <span class="text-sm font-normal text-ink-200">({approved.length})</span>
		</h2>
		{#if approved.length}
			<div class="grid gap-4">
				{#each approved as item}
					{@const attribution = [item.role, item.company].filter(Boolean).join(' · ')}
					<MotionReveal className="card space-y-3">
						{#if isAction('unapprove') && feedback?.itemId === item.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<blockquote class="text-lg text-white">{item.quote}</blockquote>
						<div class="text-sm text-ink-200">
							<p class="font-semibold text-white">{item.name}</p>
							{#if attribution}
								<p>{attribution}</p>
							{/if}
							{#if item.project}
								<p>Project: {item.project}</p>
							{/if}
							{#if item.result}
								<p>Result: {item.result}</p>
							{/if}
						</div>
						<div class="flex flex-wrap gap-3">
							<form method="POST" action="?/unapprove">
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={item.id} />
								<button class="nav-pill" type="submit">Move to pending</button>
							</form>
							<form method="POST" action="?/delete" on:submit={confirmDelete}>
								<input type="hidden" name="csrfToken" value={data.csrfToken} />
								<input type="hidden" name="id" value={item.id} />
								<button class="nav-pill" type="submit">Delete</button>
							</form>
						</div>
					</MotionReveal>
				{/each}
			</div>
		{:else}
			<div class="glass p-6 text-sm text-ink-200">No approved testimonials yet.</div>
		{/if}
	</div>
</section>

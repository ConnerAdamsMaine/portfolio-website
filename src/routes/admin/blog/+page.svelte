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
		fieldErrors?: Record<string, string>;
		itemId?: number;
	};

	const feedback = form as FormFeedback | undefined;
	const isAction = (action: string) => feedback?.action === action;
	const fieldError = (action: string, field: string, itemId?: number) =>
		feedback?.action === action && (itemId === undefined || feedback?.itemId === itemId)
			? feedback?.fieldErrors?.[field]
			: undefined;
</script>

<SeoHead title={formatTitle('Admin | Blog')} description="Manage blog posts and intro copy." />

<section class="section-pad">
	<div class="space-y-4">
		<p class="badge">Admin</p>
		<h1 class="text-4xl font-semibold text-white sm:text-5xl">Blog</h1>
		<p class="max-w-2xl text-lg text-ink-200">Update blog intro and manage posts.</p>
		<AdminNav />
	</div>
</section>

<section class="section-pad">
	<MotionReveal className="glass p-8">
		<h2 class="text-2xl font-semibold text-white">Blog section</h2>
		{#if isAction('updateBlogSection') && feedback?.message}
			<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
				{feedback?.message}
			</p>
		{/if}
		<form class="mt-6 grid gap-4" method="POST" action="?/updateBlogSection">
			<input type="hidden" name="csrfToken" value={data.csrfToken} />
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="blogTitle">
					Title
				</label>
				<input
					id="blogTitle"
					name="blogTitle"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.blogTitle}
				/>
			</div>
			<div>
				<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="blogIntro">
					Intro
				</label>
				<input
					id="blogIntro"
					name="blogIntro"
					class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					value={data.siteSettings.blogIntro}
				/>
			</div>
			<div class="flex justify-end">
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">
					Save section
				</button>
			</div>
		</form>
	</MotionReveal>
</section>

<section class="section-pad">
	<div class="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
		<MotionReveal className="glass p-8">
			<h2 class="text-2xl font-semibold text-white">Add blog post</h2>
			{#if isAction('createPost') && feedback?.message}
				<p class={`mt-3 text-sm ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
					{feedback?.message}
				</p>
			{/if}
			<form class="mt-4 space-y-4" method="POST" action="?/createPost">
				<input type="hidden" name="csrfToken" value={data.csrfToken} />
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postTitle">
						Title
					</label>
					<input
						id="postTitle"
						name="title"
						required
						maxlength="120"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createPost', 'title'))}
					/>
					{#if fieldError('createPost', 'title')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createPost', 'title')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postSlug">
						Slug
					</label>
					<input
						id="postSlug"
						name="slug"
						maxlength="120"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createPost', 'slug'))}
					/>
					{#if fieldError('createPost', 'slug')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createPost', 'slug')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postExcerpt">
						Excerpt
					</label>
					<textarea
						id="postExcerpt"
						name="excerpt"
						maxlength="300"
						rows="2"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createPost', 'excerpt'))}
					></textarea>
					{#if fieldError('createPost', 'excerpt')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createPost', 'excerpt')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postContent">
						Content
					</label>
					<textarea
						id="postContent"
						name="content"
						maxlength="20000"
						rows="4"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createPost', 'content'))}
					></textarea>
					{#if fieldError('createPost', 'content')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createPost', 'content')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postTags">
						Tags
					</label>
					<input
						id="postTags"
						name="tags"
						maxlength="200"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
						aria-invalid={Boolean(fieldError('createPost', 'tags'))}
					/>
					{#if fieldError('createPost', 'tags')}
						<p class="mt-2 text-xs text-red-200">{fieldError('createPost', 'tags')}</p>
					{/if}
				</div>
				<div>
					<label class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-200" for="postPublished">
						Published date
					</label>
					<input
						id="postPublished"
						name="publishedAt"
						type="date"
						class="mt-2 w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-3 text-sm text-white"
					/>
				</div>
				<div class="flex items-center gap-3 text-sm text-ink-200">
					<input type="hidden" name="draft" value="0" />
					<input id="postDraft" name="draft" type="checkbox" value="1" class="h-4 w-4" />
					<label for="postDraft">Draft</label>
				</div>
				<div class="flex items-center gap-3 text-sm text-ink-200">
					<input type="hidden" name="featured" value="0" />
					<input id="postFeatured" name="featured" type="checkbox" value="1" class="h-4 w-4" />
					<label for="postFeatured">Featured</label>
				</div>
				<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Add post</button>
			</form>
		</MotionReveal>
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold text-white">
				Blog posts <span class="text-sm font-normal text-ink-200">({data.posts.length})</span>
			</h2>
			{#if data.posts.length}
				{#each data.posts as post}
					<form class="card grid gap-3" method="POST" action="?/updatePost">
						<input type="hidden" name="csrfToken" value={data.csrfToken} />
						<input type="hidden" name="id" value={post.id} />
						{#if isAction('updatePost') && feedback?.itemId === post.id && feedback?.message}
							<p class={`text-xs ${feedback?.success ? 'text-aurora-200' : 'text-ink-200'}`}>
								{feedback?.message}
							</p>
						{/if}
						<div class="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-300">
							<span>Post</span>
							{#if post.draft === 1}
								<span class="badge">Draft</span>
							{:else}
								<a class="link-underline" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer noopener">Open</a>
							{/if}
						</div>
						<input
							name="title"
							value={post.title}
							required
							maxlength="120"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updatePost', 'title', post.id))}
						/>
						{#if fieldError('updatePost', 'title', post.id)}
							<p class="text-xs text-red-200">{fieldError('updatePost', 'title', post.id)}</p>
						{/if}
						<input
							name="slug"
							value={post.slug}
							maxlength="120"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updatePost', 'slug', post.id))}
						/>
						{#if fieldError('updatePost', 'slug', post.id)}
							<p class="text-xs text-red-200">{fieldError('updatePost', 'slug', post.id)}</p>
						{/if}
						<textarea
							name="excerpt"
							maxlength="300"
							rows="2"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updatePost', 'excerpt', post.id))}
						>{post.excerpt ?? ''}</textarea>
						{#if fieldError('updatePost', 'excerpt', post.id)}
							<p class="text-xs text-red-200">{fieldError('updatePost', 'excerpt', post.id)}</p>
						{/if}
						<textarea
							name="content"
							maxlength="20000"
							rows="4"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updatePost', 'content', post.id))}
						>{post.content ?? ''}</textarea>
						{#if fieldError('updatePost', 'content', post.id)}
							<p class="text-xs text-red-200">{fieldError('updatePost', 'content', post.id)}</p>
						{/if}
						<input
							name="tags"
							value={post.tags ?? ''}
							maxlength="200"
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
							aria-invalid={Boolean(fieldError('updatePost', 'tags', post.id))}
						/>
						{#if fieldError('updatePost', 'tags', post.id)}
							<p class="text-xs text-red-200">{fieldError('updatePost', 'tags', post.id)}</p>
						{/if}
						<input
							name="publishedAt"
							type="date"
							value={post.publishedAt ?? ''}
							class="w-full rounded-2xl border border-ink-200/40 bg-white/5 px-4 py-2 text-sm text-white"
						/>
						<div class="flex items-center gap-3 text-sm text-ink-200">
							<input type="hidden" name="draft" value="0" />
							<input
								id={`post-draft-${post.id}`}
								name="draft"
								type="checkbox"
								value="1"
								class="h-4 w-4"
								checked={post.draft === 1}
							/>
							<label for={`post-draft-${post.id}`}>Draft</label>
						</div>
						<div class="flex items-center gap-3 text-sm text-ink-200">
							<input type="hidden" name="featured" value="0" />
							<input
								id={`post-featured-${post.id}`}
								name="featured"
								type="checkbox"
								value="1"
								class="h-4 w-4"
								checked={post.featured === 1}
							/>
							<label for={`post-featured-${post.id}`}>Featured</label>
						</div>
						<div class="flex flex-wrap gap-3">
							<button class="nav-pill border-ink-100 bg-ink-900 text-white" type="submit">Update</button>
							<button
								class="nav-pill"
								type="submit"
								formaction="?/deletePost"
								on:click={(event) => {
									if (!confirm('Delete this post?')) event.preventDefault();
								}}
							>
								Delete
							</button>
						</div>
					</form>
				{/each}
			{:else}
				<div class="card text-sm text-ink-200">No posts yet.</div>
			{/if}
		</div>
	</div>
</section>

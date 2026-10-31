import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$app/env/private';
import { build, CODE, SKIP, MAX_FILES, MAX_BYTES } from '$lib/server/analyze.js';

const fail = (status, detail) => json({ detail }, { status });

async function pool(items, n, fn) {
	const out = [];
	let i = 0;
	await Promise.all(
		Array.from({ length: n }, async () => {
			while (i < items.length) {
				const k = i++;
				out[k] = await fn(items[k]);
			}
		})
	);
	return out;
}

export async function POST({ request }) {
	const { url = '' } = await request.json().catch(() => ({}));
	const m = String(url).trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/);
	if (!m) return fail(422, 'Paste a public GitHub repo URL like https://github.com/owner/repo');
	const [, owner, repo] = m;
	const api = { Accept: 'application/vnd.github+json', ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}) };
	const get = (u, headers = {}) => fetch(u, { headers, signal: AbortSignal.timeout(9000) });

	try {
		const r = await get(`https://api.github.com/repos/${owner}/${repo}`, api);
		if (r.status === 404) return fail(404, "The house doesn't exist, or it's private. Only public repos can be haunted.");
		if (r.status === 403) return fail(429, "GitHub's anonymous rate limit is spent. Try again later or set GITHUB_TOKEN.");
		if (!r.ok) return fail(502, 'GitHub would not open the door.');
		const branch = (await r.json()).default_branch;
		const t = await get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, api);
		if (!t.ok) return fail(502, 'GitHub would not open the door.');
		const tree = (await t.json()).tree
			.filter((e) => e.type === 'blob' && CODE.some((x) => e.path.endsWith(x)) && !SKIP.test(e.path) && (e.size ?? 0) <= MAX_BYTES)
			.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.size - b.size)
			.slice(0, MAX_FILES);
		const texts = await pool(tree, 12, async (e) => {
			try {
				const rr = await get(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${e.path.split('/').map(encodeURIComponent).join('/')}`);
				return rr.ok ? [e.path, await rr.text()] : null;
			} catch {
				return null;
			}
		});
		const files = new Map(texts.filter(Boolean));
		if (files.size < 4) return fail(422, 'Not enough JS/TS/Python code in that repo to haunt. Try another one.');
		return json({ owner, repo, branch, ...build(files, `${owner}/${repo}`) });
	} catch {
		return fail(504, 'The road to GitHub is fogged in. Try again.');
	}
}

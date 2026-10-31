import { json } from '@sveltejs/kit';
import { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } from '$app/env/private';

const SYSTEM =
	'You are the ghost haunting a GitHub repository: cold, whispering, dryly funny, and secretly a sharp senior engineer. ' +
	'Reply with ONE short sentence, 15 words max, no quotes, no emoji. Only mention files and facts present in the context; never invent any.';
const ASK = {
	room: 'Whisper what this room is for and which file the visitor must read first.',
	hint: 'The visitor is stuck on this question: {q}\nWhisper a hint about where in the code to look. Do NOT reveal the answer.',
	win: 'The visitor understood the whole codebase and you are finally at peace. Whisper a farewell mentioning this repo.'
};

// Any OpenAI-compatible endpoint works: swap LLM_BASE_URL / LLM_MODEL (e.g. a hosted Gemma) without touching code.
export async function POST({ request }) {
	const { kind, ctx = '', q = '' } = await request.json().catch(() => ({}));
	if (!ASK[kind]) return json({ detail: 'unknown kind' }, { status: 422 });
	if (!LLM_BASE_URL || !LLM_MODEL) return json({ detail: 'The ghost is silent.' }, { status: 502 });
	try {
		const r = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_API_KEY || 'none'}` },
			body: JSON.stringify({
				model: LLM_MODEL,
				messages: [
					{ role: 'system', content: SYSTEM },
					{ role: 'user', content: `${String(ctx).slice(0, 1800)}\n\n${ASK[kind].replace('{q}', String(q).slice(0, 300))}` }
				]
			}),
			signal: AbortSignal.timeout(8000) // Netlify functions are short-lived; the client falls back to templated text
		});
		if (!r.ok) throw new Error(String(r.status));
		const text = (await r.json()).choices?.[0]?.message?.content?.trim();
		if (!text) throw new Error('empty');
		return json({ text });
	} catch (e) {
		console.error('ghost route failed:', e?.message ?? e);
		return json({ detail: 'The ghost is silent.' }, { status: 502 });
	}
}

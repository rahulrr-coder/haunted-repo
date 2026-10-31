import { defineEnvVars } from '@sveltejs/kit/env';

// All optional: without LLM_* the ghost falls back to templated lines; without GITHUB_TOKEN the anonymous API limit applies.
const optional = (value) => value || undefined;

export const variables = defineEnvVars({
	LLM_BASE_URL: { schema: optional, description: 'OpenAI-compatible base URL, e.g. a hosted Gemma' },
	LLM_API_KEY: { schema: optional },
	LLM_MODEL: { schema: optional },
	GITHUB_TOKEN: { schema: optional, description: 'raises the GitHub API limit from 60/h' }
});

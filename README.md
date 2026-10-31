# Haunted Repo

Paste a public GitHub repo. Read the code. Heal the haunted house.

Developers read far more code than they write, and almost nobody practises it. Haunted Repo makes reading the game: it maps a repo's import graph, tells you which file to open first, and turns the codebase into a haunted house. Every window is a part of the code. Heal a room by passing its **rites**, questions about the real code, and when every room is healed the house is at peace.

Built for the [Hacktoberfest Open-Source AI Challenge, Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26).

**Live:** https://haunted-repo.netlify.app (headphones on: sudden scares and loud sounds)

## How it works

- **The graph does the grading, not the model.** The server fetches up to 150 JS/TS/Python files from a public repo, resolves every import, ranks files with PageRank (the "start here" path), and groups folders into rooms (flat repos are split by import distance from the entry point). Each rite is generated from that graph and graded in code; a correct answer shows the real import line as proof.
- **The model is the ghost's voice.** One short whisper per room, hints that point you at where to look without giving the answer, and a farewell. It only ever sees file names and the first 30 lines of one file. If the model is unreachable the game falls back to templated lines.
- **Open model, swappable.** The ghost calls any OpenAI-compatible chat endpoint. Point three environment variables at a hosted open-weight model such as Gemma and nothing else changes.
- **All the sound is synthesized live** with WebAudio (drone, wind, heartbeat, an arpeggio that speeds up with possession, a crying voice and a scream), behind a compressor so loud moments cannot clip. There are no audio files.
- **Safety:** honours `prefers-reduced-motion` (no flashes, shakes or screamer face), nothing strobes, there is a sound toggle and a content notice on the landing screen.

## Stack

SvelteKit 3, Svelte 5 runes, Tailwind CSS v4, deployed on Netlify (the API routes run as Netlify functions). No database.

## Run it

```bash
npm install
cp .env.example .env   # optional: fill in the LLM_* variables
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `LLM_BASE_URL` | OpenAI-compatible base URL, e.g. `https://host/v1` |
| `LLM_API_KEY` | key for that endpoint |
| `LLM_MODEL` | model name |
| `GITHUB_TOKEN` | optional, raises the anonymous GitHub API limit from 60 requests/hour |

Without the `LLM_*` variables everything works; the ghost just uses templated lines.

```bash
npm test        # graph + rite generation
npm run build   # Netlify build (adapter-netlify)
```

## Recording a demo

`/?demo=1` shows a "Start take" button that plays a scripted ~55 second run with captions. `scripts/record-demo.py` records it headlessly with sound (needs Playwright and ffmpeg):

```bash
URL='https://haunted-repo.netlify.app/?demo=1' python3 scripts/record-demo.py
```

## Limits

Public repos only, JS/TS/Python only, first 150 files.

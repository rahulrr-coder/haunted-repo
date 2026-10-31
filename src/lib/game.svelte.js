// Game state (Svelte 5 runes) and every side effect: scares, the screamer, apparitions, the scripted demo take.
import { Snd, rnd, sleep } from './sound.js';

export const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DEMO = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');

export const g = $state({
	url: '', err: '', busy: false, D: null, S: { healed: [], solved: [], active: 0 },
	playing: false, win: false, winOpen: false, sndOn: true, tc: '00:00:00', demoSplash: DEMO, cap: '',
	line: { room: '', hint: '', win: '' }, hintFor: '', holding: null, wrong: {},
	shown: {}, lawn: 0, flash: 0, scare: { on: false, face: 0, tick: 0 }, vd: { on: false, stage: '', red: false }
});

let ghostCache = {}, screamed = false, lastFace = -1, atmosOn = false;
const typers = {};
try { screamed = !DEMO && sessionStorage.getItem('hr:screamed') === '1'; } catch { /* storage blocked */ }

const key = (room, qi) => `${room.id}.${qi}`;
const save = () => { try { localStorage.setItem(`hr:${g.D.owner}/${g.D.repo}`, JSON.stringify(g.S)); } catch { /* ignore */ } };
const load = () => { try { return JSON.parse(localStorage.getItem(`hr:${g.D.owner}/${g.D.repo}`)); } catch { return null; } };
const base = (f) => f.split('/').pop();

async function ghost(kind, ctx, q = '') {
	try {
		const r = await fetch('/api/ghost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, ctx, q }) });
		if (!r.ok) throw 0;
		return (await r.json()).text;
	} catch { return null; }
}

function whisper(k, text) {
	clearInterval(typers[k]);
	if (RM) { g.line[k] = text; return; }
	g.line[k] = ''; let i = 0;
	typers[k] = setInterval(() => { if (++i > text.length) return clearInterval(typers[k]); g.line[k] = text.slice(0, i); }, 28);
}

// possession level drives darkness, heartbeat speed and the arpeggio
function possession() {
	const n = g.D.rooms.length, k = g.S.healed.length, left = (n - k) / n, done = k === n;
	const st = document.body.style;
	st.setProperty('--dark', done ? 0 : (DEMO ? 0.2 + 0.5 * left : 0.4 + 0.6 * left).toFixed(2));
	Snd.bpm = done ? 50 : 55 + 60 * left; Snd.heart = done ? 0 : 0.3 + 0.7 * left; Snd.left = done ? 0 : 0.25 + 0.75 * left;
	st.setProperty('--beat', (60 / Snd.bpm).toFixed(2) + 's');
}

export function toggleSound() { g.sndOn = Snd.toggle(); }

export async function enter(url) {
	Snd.start(); g.sndOn = Snd.on; g.err = ''; g.busy = true;
	try {
		const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
		const j = await r.json();
		if (!r.ok) throw new Error(j.detail || 'The house refused you.');
		ghostCache = {}; g.D = j;
		g.S = load() || { healed: [], solved: [], active: 0 };
		g.win = g.S.healed.length === j.rooms.length;
		g.playing = true; startAtmos(); possession();
		pick(Math.min(g.S.active, j.rooms.length - 1));
	} catch (e) { g.err = e.message; }
	g.busy = false;
}

export async function pick(i) {
	g.S.active = i; save();
	const room = g.D.rooms[i];
	if (ghostCache[i]) return whisper('room', ghostCache[i]);
	g.line.room = '…';
	ghostCache[i] = (await ghost('room', room.ctx)) || `Start with ${base(room.heart)}. Everything here leans on it.`;
	if (g.S.active === i) whisper('room', ghostCache[i]);
}

export async function askHint(room, q) {
	g.hintFor = q.text; g.line.hint = '…';
	whisper('hint', (await ghost('hint', room.ctx, q.text)) || `Read the top of ${base(room.heart)}. Imports are a map.`);
}

export function answer(room, qi, oi) {
	const k = key(room, qi), q = room.questions[qi];
	if (g.S.solved.includes(k) || g.holding) return;
	if (oi !== q.answer) { g.wrong[`${k}.${oi}`] = true; scare(); return; }
	g.S.solved.push(k); save(); Snd.right(); g.holding = { room: room.id, qi };
	if (!DEMO && !screamed) setTimeout(screamer, rnd(8000, 20000)); // the page looks calm for a while first
	setTimeout(() => afterSolve(room), DEMO ? 1400 : 2000);
}

function afterSolve(room) {
	g.holding = null;
	if (room.questions.every((_, qi) => g.S.solved.includes(key(room, qi))) && !g.S.healed.includes(room.id)) {
		g.S.healed.push(room.id); save(); Snd.heal();
		g.lawn = Math.max(0, g.lawn - 2); // relief: the thing on the lawn backs off
		possession();
		if (g.S.healed.length === g.D.rooms.length) win();
	}
}

async function win() {
	g.win = true; Snd.win();
	setTimeout(async () => {
		g.winOpen = true; g.line.win = '…';
		const t = await ghost('win', g.D.rooms.map((r) => r.ctx.split('\n').slice(0, 3).join(' | ')).join('\n'));
		whisper('win', t || `You read every room of ${g.D.owner}/${g.D.repo}. I can finally rest.`);
	}, 3000);
}

/* ---------- atmosphere ---------- */
function startAtmos() {
	if (atmosOn) return; atmosOn = true;
	const t0 = Date.now();
	setInterval(() => { const t = Math.floor((Date.now() - t0) / 1000); g.tc = [t / 3600, (t / 60) % 60, t % 60].map((n) => String(Math.floor(n)).padStart(2, '0')).join(':'); }, 1000);
	if (RM || DEMO) return;
	const bolt = () => { if (!g.win) lightning(); setTimeout(bolt, rnd(16000, 32000)); };
	setTimeout(bolt, 9000);
	const peek = () => { apparition(); lawnCreep(); setTimeout(peek, rnd(3000, 7000)); };
	setTimeout(peek, 3500);
}

export function lightning() { g.flash++; Snd.thunder(); }

export function apparition(i, ms) {
	const open = g.D.rooms.map((r, idx) => (g.S.healed.includes(r.id) ? -1 : idx)).filter((x) => x >= 0);
	const idx = i ?? open[Math.floor(Math.random() * open.length)];
	if (idx == null) return;
	g.shown[idx] = true; Snd.whisper();
	setTimeout(() => { g.shown[idx] = false; }, ms || rnd(500, 1100));
}

const cursor = () => { const cs = getComputedStyle(document.body); return [parseFloat(cs.getPropertyValue('--mx')) || innerWidth * 0.45, parseFloat(cs.getPropertyValue('--my')) || innerHeight * 0.52]; };

function lawnCreep() {
	const el = document.getElementById('lawn');
	if (!el || g.lawn >= 7) return;
	const r = el.getBoundingClientRect(), [mx, my] = cursor();
	if (Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2)) < 280) return; // only moves while you aren't looking at it
	g.lawn++;
}

// the flashlight follows the pointer, and makes visible apparitions vanish
export function onPointer(e) {
	document.body.style.setProperty('--mx', e.clientX + 'px'); document.body.style.setProperty('--my', e.clientY + 'px');
	for (const i of Object.keys(g.shown)) {
		if (!g.shown[i]) continue;
		const el = document.querySelector(`[data-fig="${i}"]`); if (!el) continue;
		const r = el.getBoundingClientRect();
		if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 120) g.shown[i] = false;
	}
}

export function scare() {
	let v; do { v = Math.floor(Math.random() * 3); } while (v === lastFace); lastFace = v;
	Snd.stinger(v);
	if (RM) return;
	const tick = g.scare.tick + 1; g.scare = { on: true, face: v, tick };
	setTimeout(() => { if (g.scare.tick === tick) g.scare.on = false; }, 650);
	const p = document.getElementById('panel'); p?.classList.remove('shake'); void p?.offsetWidth; p?.classList.add('shake');
}

// calm -> blackout -> crying -> face rises -> scream -> black -> back to normal. Once per visit, no strobing.
export async function screamer() {
	if (screamed || g.win) return; screamed = true;
	try { sessionStorage.setItem('hr:screamed', '1'); } catch { /* ignore */ }
	g.vd = { on: true, stage: '', red: false }; Snd.duck(0, 0.02);
	if (RM) { await sleep(1500); g.vd.on = false; Snd.duck(1, 0.4); return; }
	await sleep(1200); Snd.cry(3.8);
	await sleep(500); g.vd.stage = 'rise';
	await sleep(2400); g.vd.stage = 'snap'; g.vd.red = true; Snd.scream(1.15);
	await sleep(1150); g.vd.stage = 'gone'; g.vd.red = false;
	await sleep(1100); g.vd.on = false; Snd.duck(1, 0.6);
}

/* ---------- ?demo=1: scripted ~55s take for screen recording, with captions (LinkedIn autoplays muted) ---------- */
function solveNow(right = true) {
	const room = g.D.rooms[g.S.active], qi = room.questions.findIndex((_, i) => !g.S.solved.includes(key(room, i)));
	if (qi < 0) return false;
	const q = room.questions[qi];
	answer(room, qi, right ? q.answer : (q.answer + 1) % q.options.length);
	return true;
}
let drifting = false;
// a hand-held flashlight that never quite holds still
function drift() {
	drifting = true; const t0 = performance.now();
	const f = () => { if (!drifting) return; const t = (performance.now() - t0) / 1000; const st = document.body.style;
		st.setProperty('--mx', innerWidth * (0.36 + 0.2 * Math.sin(t * 0.9 + 1) + 0.05 * Math.sin(t * 3.1)) + 'px');
		st.setProperty('--my', innerHeight * (0.52 + 0.16 * Math.sin(t * 1.3) + 0.04 * Math.sin(t * 4.3)) + 'px');
		requestAnimationFrame(f); };
	f();
}
function say(text, ms) { g.cap = text; setTimeout(() => { if (g.cap === text) g.cap = ''; }, ms); }
export async function runDemo() {
	g.demoSplash = false; Snd.start(); screamed = false; drift();
	say('Every codebase is haunted.', 2000); await sleep(2200);
	say('Paste any public GitHub repo.', 2800);
	for (const ch of 'github.com/pallets/click') { g.url += ch; await sleep(45); }
	await sleep(300); await enter('https://github.com/pallets/click');
	say('It maps the code and tells you where to start.', 2800); await sleep(3000);
	apparition(3, 1200); say('Every window is a room. Something is watching.', 2400); await sleep(2500);
	say('Answer questions about the real code.', 2200);
	solveNow(false); await sleep(2000); // wrong answer: jump scare
	say('Every right answer shows its proof.', 2600);
	const r0 = g.D.rooms[0];
	while (!r0.questions.every((_, i) => g.S.solved.includes(key(r0, i)))) { solveNow(true); await sleep(1550); }
	say('Understand a room, and it heals.', 2200); await sleep(2400); // a calm moment, then the screamer
	await screamer(); await sleep(900);
	lightning(); await sleep(700);
	say('Read it all. Heal the house.', 2600);
	for (let i = 1; i < g.D.rooms.length; i++) { await pick(i); await sleep(700); while (solveNow(true)) await sleep(1550); }
	await sleep(3000);
	g.winOpen = false; g.cap = '';
	say('Haunted Repo · haunted-repo.netlify.app', 4500); await sleep(3600);
	drifting = false; window.__demoDone = true;
}

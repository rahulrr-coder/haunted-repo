// Turns a repo's source files into a haunted house: an import graph, rooms, a reading path and graph-derived rites.
import { posix } from 'node:path';

export const CODE = ['.py', '.js', '.jsx', '.ts', '.tsx', '.mjs'];
export const SKIP = /(^|\/)(node_modules|dist|build|vendor|venv|\.venv|__pycache__|tests?|__tests__|docs?|examples?|migrations)(\/|$)|\.(test|spec)\.|(^|\/)test_|\.d\.ts$|\.min\./;
export const MAX_FILES = 150;
export const MAX_BYTES = 60_000;
const ENTRY = /(^|\/)(main|index|app|cli|server|__main__|__init__|manage|run|cmd)\.\w+$/;
const JS_IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
const PY_IMPORT = /^[ \t]*(?:from[ \t]+(\.*[\w.]*)[ \t]+import[ \t]+([\w, ()*]+)|import[ \t]+([\w., ]+))/gm;
const JS_SUFFIX = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

const seeded = (str) => {
	let a = 0;
	for (const ch of str) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};
const shuffle = (arr, r) => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
};

const lineAt = (text, pos) => {
	const start = pos === 0 ? 0 : text.lastIndexOf('\n', pos - 1) + 1;
	let end = text.indexOf('\n', pos);
	if (end === -1) end = text.length;
	return text.slice(start, end).trim().slice(0, 120);
};

function resolveJs(src, spec, files) {
	let bases;
	if (spec.startsWith('.')) bases = [posix.normalize(posix.join(posix.dirname(src), spec))];
	else if (spec.startsWith('@/') || spec.startsWith('~/')) bases = ['src/' + spec.slice(2), spec.slice(2)];
	else return null;
	for (const b of bases) {
		const stems = [b, ...(b.endsWith('.js') ? [b.slice(0, -3) + '.ts', b.slice(0, -3) + '.tsx'] : [])];
		for (const stem of stems)
			for (const suf of JS_SUFFIX) {
				const c = stem + suf;
				if (files.has(c) && c !== src) return c;
			}
	}
	return null;
}

function resolvePy(src, mod, names, files) {
	const rel = mod.startsWith('.');
	let base;
	if (rel) {
		let d = posix.dirname(src);
		if (d === '.') d = '';
		const dots = mod.length - mod.replace(/^\.+/, '').length;
		for (let i = 0; i < dots - 1; i++) {
			d = posix.dirname(d);
			if (d === '.') d = '';
		}
		base = posix.join(d, mod.replace(/^\.+/, '').replaceAll('.', '/'));
	} else base = mod.replaceAll('.', '/');
	const cands = [base + '.py', posix.join(base, '__init__.py'), ...names.map((n) => posix.join(base, n + '.py'))];
	const out = [];
	for (const c of cands) {
		let hit = files.has(c) ? c : null;
		if (!hit && !rel) hit = [...files.keys()].find((f) => f.endsWith('/' + c)) ?? null;
		if (hit && hit !== src) out.push(hit);
	}
	return out;
}

function edgesOf(src, text, files) {
	const out = [];
	if (src.endsWith('.py')) {
		for (const m of text.matchAll(PY_IMPORT)) {
			const mods = m[3]
				? m[3].split(',').filter((x) => x.trim()).map((x) => [x.trim().split(/\s+/)[0], []])
				: [[m[1], m[2].split(/[,\s()]+/).filter((n) => n && n !== '*' && n !== 'as')]];
			for (const [mod, names] of mods)
				for (const dst of resolvePy(src, mod, names, files)) out.push([dst, lineAt(text, m.index)]);
		}
	} else {
		for (const m of text.matchAll(JS_IMPORT)) {
			const dst = resolveJs(src, m[1], files);
			if (dst) out.push([dst, lineAt(text, m.index)]);
		}
	}
	return out;
}

function pagerank(nodes, out) {
	const n = nodes.length;
	let pr = new Map(nodes.map((f) => [f, 1 / n]));
	for (let k = 0; k < 30; k++) {
		const next = new Map(nodes.map((f) => [f, 0.15 / n]));
		for (const f of nodes) {
			const targets = out.get(f);
			if (targets.size) for (const t of targets) next.set(t, next.get(t) + (0.85 * pr.get(f)) / targets.size);
			else for (const g of nodes) next.set(g, next.get(g) + (0.85 * pr.get(f)) / n);
		}
		pr = next;
	}
	return pr;
}

function groupRooms(files) {
	const key = (p, d) => p.split('/').slice(0, -1).slice(0, d).join('/') || '(root)';
	let rooms = new Map();
	const put = (k, f) => rooms.set(k, [...(rooms.get(k) ?? []), f]);
	for (const f of files) put(key(f, 1), f);
	const big = [...rooms.keys()].reduce((a, b) => (rooms.get(b).length > rooms.get(a).length ? b : a));
	if (big !== '(root)' && rooms.get(big).length > 0.6 * files.length) {
		const swallowed = rooms.get(big);
		rooms.delete(big);
		for (const f of swallowed) put(key(f, 2), f);
	}
	const ranked = [...rooms.entries()].sort((a, b) => b[1].length - a[1].length);
	const kept = ranked.slice(0, 5).filter(([, v]) => v.length >= 2);
	const keptKeys = new Set(kept.map(([k]) => k));
	const attic = ranked.filter(([k]) => !keptKeys.has(k)).flatMap(([, v]) => v);
	if (attic.length >= 2 || !kept.length) kept.push([kept.length ? 'the attic' : 'the whole house', attic]);
	else if (attic.length) kept.at(-1)[1].push(attic[0]);
	return kept;
}

// flat repos: split rooms by import distance from the entry point instead of by folder
function layerRooms(files, out, entry) {
	const dist = new Map([[entry, 0]]);
	const queue = [entry];
	for (const f of queue)
		for (const t of out.get(f))
			if (!dist.has(t)) {
				dist.set(t, dist.get(f) + 1);
				queue.push(t);
			}
	const layers = [['foyer', (d) => d <= 1], ['hallways', (d) => d === 2], ['cellar', (d) => d > 2]];
	const merged = [];
	for (const [name, ok] of layers) {
		const fs = files.filter((f) => ok(dist.get(f) ?? 99));
		if (fs.length < 2 && merged.length) merged.at(-1)[1].push(...fs);
		else if (fs.length) merged.push([name, fs]);
	}
	return merged;
}

function options(correct, pool, r, k = 3) {
	const rest = [...new Set(pool)].filter((p) => p !== correct).sort();
	if (!rest.length) return null;
	shuffle(rest, r);
	const opts = [...rest.slice(0, k), correct];
	shuffle(opts, r);
	return [opts, opts.indexOf(correct)];
}

export function build(filesObj, label = '') {
	const files = filesObj instanceof Map ? filesObj : new Map(Object.entries(filesObj));
	const names = [...files.keys()];
	const out = new Map(names.map((f) => [f, new Set()]));
	const inn = new Map(names.map((f) => [f, new Set()]));
	const edges = new Map();
	for (const [src, text] of files)
		for (const [dst, ev] of edgesOf(src, text, files)) {
			out.get(src).add(dst);
			inn.get(dst).add(src);
			if (!edges.has(src + '\0' + dst)) edges.set(src + '\0' + dst, ev);
		}
	const pr = pagerank(names, out);
	const r = seeded(label || 'x');
	const byRank = (a, b) => pr.get(b) - pr.get(a);
	const depth = (f) => f.split('/').length - 1;

	const cands = names.filter((f) => ENTRY.test(f));
	const entry = cands.length
		? cands.reduce((a, b) => (depth(b) < depth(a) || (depth(b) === depth(a) && out.get(b).size > out.get(a).size) ? b : a))
		: [...names].sort(byRank)[0];
	const seen = new Set([entry]);
	const path = [{ file: entry, why: 'The front door. Read how it starts, then follow what it calls.' }];
	for (const t of [...out.get(entry)].sort(byRank).slice(0, 3)) {
		seen.add(t);
		path.push({ file: t, why: 'Imported by the front door: one step inside.' });
	}
	for (const f of [...names].sort(byRank)) {
		if (path.length >= 6) break;
		if (!seen.has(f)) {
			seen.add(f);
			path.push({ file: f, why: 'Everything leans on this one: the heart of the house.' });
		}
	}

	let rooms = groupRooms(names);
	if (rooms.length < 3 && names.length >= 6) rooms = layerRooms(names, out, entry);
	rooms.sort((a, b) => Number(!a[1].includes(entry)) - Number(!b[1].includes(entry)) || b[1].length - a[1].length);
	const rankedAll = [...names].sort(byRank);
	const result = rooms.map(([name, rf0], i) => {
		const rf = [...rf0].sort(byRank);
		const heart = rf.reduce((a, b) => (inn.get(b).size > inn.get(a).size || (inn.get(b).size === inn.get(a).size && pr.get(b) > pr.get(a)) ? b : a));
		const qs = [];
		const add = (text, o, evidence) => o && qs.push({ text, options: o[0], answer: o[1], evidence });
		if (i === 0)
			add('Which file is the front door, where the program starts?', options(entry, rankedAll.slice(0, 12), r),
				`\`${entry}\` is the entry point and imports ${out.get(entry).size} other files.`);
		if (inn.get(heart).size)
			add('Which file in this room do the most other files import?', options(heart, rf.length >= 3 ? rf : names, r),
				`\`${heart}\` is imported by ${inn.get(heart).size} files, e.g. \`${[...inn.get(heart)].sort()[0]}\`.`);
		const src = rf.filter((f) => out.get(f).size).sort((a, b) => out.get(b).size - out.get(a).size)[0];
		if (src) {
			const dsts = [...out.get(src)].sort();
			const dst = dsts[Math.floor(r() * dsts.length)];
			add(`\`${src}\` imports exactly one of these files. Which?`, options(dst, names.filter((f) => !out.get(src).has(f) && f !== src), r),
				`\`${src}\`: \`${edges.get(src + '\0' + dst)}\``);
		}
		const tgt = rf.filter((f) => inn.get(f).size && f !== heart).sort((a, b) => inn.get(b).size - inn.get(a).size)[0];
		if (tgt) {
			const imps = [...inn.get(tgt)].sort();
			const imp = imps[Math.floor(r() * imps.length)];
			add(`Which of these files imports \`${tgt}\`?`, options(imp, names.filter((f) => !inn.get(tgt).has(f) && f !== tgt), r),
				`\`${imp}\`: \`${edges.get(imp + '\0' + tgt)}\``);
		}
		const head = files.get(heart).split('\n').slice(0, 30).join('\n');
		const ctx = `Repo: ${label}\nRoom: ${name}\nFiles in this room: ${rf.slice(0, 8).join(', ')}\nMost depended-upon file here: ${heart}\n--- first lines of ${heart} ---\n${head}`.slice(0, 1800);
		return { id: i, name, files: rf, heart, questions: qs.slice(0, i === 0 ? 4 : 3), ctx };
	});
	let links = 0;
	for (const v of out.values()) links += v.size;
	return { entry, path, rooms: result, stats: { files: names.length, links } };
}

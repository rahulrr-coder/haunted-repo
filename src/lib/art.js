// Scene art as SVG strings. Static art only (nothing repo-derived), so {@html} is safe here.
export const HX = -120; // the house group is shifted left to leave room for the case-file panel
export const SLOTS = [
	{ x: 735, y: 620, w: 130, h: 180 }, { x: 560, y: 450, w: 96, h: 140 }, { x: 752, y: 450, w: 96, h: 140 },
	{ x: 944, y: 450, w: 96, h: 140 }, { x: 560, y: 620, w: 96, h: 140 }, { x: 944, y: 620, w: 96, h: 140 }
];
export const arch = (p) =>
	`M${p.x} ${p.y + p.h}V${p.y + 36}Q${p.x} ${p.y - 6} ${p.x + p.w / 2} ${p.y - 6}Q${p.x + p.w} ${p.y - 6} ${p.x + p.w} ${p.y + 36}V${p.y + p.h}Z`;

const lcg = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
function branch(x, y, len, ang, d, r, out) {
	if (d === 0 || len < 7) return;
	const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
	out.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${(d * 1.9).toFixed(1)}"/>`);
	const n = 2 + (r() > 0.55 ? 1 : 0);
	for (let i = 0; i < n; i++) branch(x2, y2, len * (0.64 + r() * 0.14), ang + (r() - 0.5) * 1.5, d - 1, r, out);
}
const deadTree = (x, y, len, seed) => { const o = [], r = lcg(seed); branch(x, y, len, (r() - 0.5) * 0.25, 6, r, o); return o.join(''); };
const MOONLIT = '#c9a574';

// sky, moon, hills, dead trees, the house itself (everything behind the windows)
export function worldTop() {
	const r = lcg(7);
	const shingles = [...Array(60)].map(() => { const x = 560 + r() * 480, y = 230 + r() * 170; return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(8 + r() * 12).toFixed(0)}" height="6" fill="#050307"/>`; }).join('');
	const boards = [...Array(14)].map((_, i) => `<line x1="${520 + i * 44}" y1="400" x2="${520 + i * 44}" y2="800" stroke="#0a070e" stroke-width="2"/>`).join('');
	const stars = [...Array(40)].map(() => `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.3 + 0.3).toFixed(1)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`).join('');
	return `
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04020a"/><stop offset=".55" stop-color="#12091a"/><stop offset="1" stop-color="#3a1618"/></linearGradient>
		<radialGradient id="moon" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe0a0"/><stop offset=".6" stop-color="#ff9a3c"/><stop offset="1" stop-color="#b53c0a"/></radialGradient>
		<linearGradient id="sod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b3410"/><stop offset="1" stop-color="#2a0d06"/></linearGradient>
		<linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#ff9f43"/></linearGradient>
		<linearGradient id="shaftg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a3c" stop-opacity=".35"/><stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/></linearGradient>
		<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>
		<filter id="tex"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter>
		<filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
		<filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter>
		<filter id="glow"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
		<filter id="eye"><feGaussianBlur stdDeviation="2.2"/></filter>
		${SLOTS.map((p, i) => `<clipPath id="c${i}"><path d="${arch(p)}"/></clipPath>`).join('')}
	</defs>
	<rect width="1600" height="900" fill="url(#sky)"/>${stars}
	<circle cx="1230" cy="210" r="190" fill="#ff7a18" opacity=".18" filter="url(#blur40)"/><circle cx="1230" cy="210" r="92" fill="url(#moon)"/>
	<g class="cloud" fill="#0a0610" opacity=".7" filter="url(#blur8)"><ellipse cx="900" cy="170" rx="260" ry="26"/><ellipse cx="1350" cy="260" rx="300" ry="22"/><ellipse cx="300" cy="120" rx="240" ry="20"/></g>
	<path d="M0 640Q200 560 420 620T820 600T1220 610T1600 580V900H0Z" fill="#0a0610"/>
	<g stroke="#08050c" fill="none" stroke-linecap="round" opacity=".85">${deadTree(120, 760, 150, 3)}${deadTree(1500, 770, 170, 8)}${deadTree(330, 720, 110, 5)}${deadTree(1330, 720, 120, 11)}</g>
	<g transform="translate(${HX} 0)">
		<g filter="url(#rough)">
			<rect x="1100" y="330" width="150" height="470" fill="#0f0a14"/><polygon points="1080,334 1175,190 1270,334" fill="#07040a"/>
			<rect x="500" y="400" width="600" height="400" fill="#120d18"/>
			<polygon points="470,420 800,160 1130,420" fill="#08050b"/>
			<rect x="950" y="150" width="40" height="120" fill="#08050b" transform="rotate(7 970 270)"/>
			<polygon points="680,610 920,610 945,645 655,645" fill="#09060c"/>
		</g>
		<g stroke="${MOONLIT}" stroke-opacity=".25" fill="none" stroke-width="2"><path d="M470 420L800 160L1130 420"/><path d="M1080 334L1175 190L1270 334"/></g>
		${shingles}${boards}
		<rect x="500" y="400" width="600" height="400" filter="url(#tex)" opacity=".5"/>
		<g stroke="#060309" stroke-width="10"><path d="M705 645V800M895 645V800"/></g>
		<g fill="#0a070d"><rect x="700" y="800" width="200" height="10"/><rect x="690" y="810" width="220" height="10"/><rect x="680" y="820" width="240" height="10"/></g>
	</g>`;
}

// the lawn figure, the spirit, graveyard and fence in front of the house
export function worldBottom() {
	const r = lcg(21);
	const stones = [[190, 832, 38, 52], [300, 846, 30, 44], [420, 838, 34, 50], [1230, 836, 36, 52], [1360, 846, 30, 40], [1470, 834, 40, 56], [100, 850, 28, 38]]
		.map(([x, y, w, h]) => `<path d="M${x} ${y}v${-h + 14}q${w / 2} ${-26} ${w} 0v${h - 14}z" fill="#07050a" stroke="#1b1422"/>`).join('');
	const fence = [...Array(34)].map((_, i) => { const x = 20 + i * 48, hh = 70 + ((i * 37) % 28) - (i % 7 === 3 ? 38 : 0); return `<path d="M${x} 880V${880 - hh}l5 -10 5 10V880z" fill="#030205"/>`; }).join('');
	const grass = [...Array(90)].map(() => { const x = r() * 1600; return `M${x.toFixed(0)} 900q${(r() * 8 - 4).toFixed(0)} -${(18 + r() * 26).toFixed(0)} ${(r() * 14 - 7).toFixed(0)} -${(30 + r() * 24).toFixed(0)}`; }).join('');
	return `
	<g id="lawn" style="opacity:.55;transform:translate(0px,0px) scale(.5)"><ellipse cx="300" cy="700" rx="9" ry="11" fill="#cfc9b8"/><path d="M291 698q-6 40 -3 80M309 698q6 40 3 80M292 712q8 60 -4 120h24q-12 -60 -4 -120z" fill="#c9c3b2" opacity=".9"/><path d="M291 693q9 -10 18 0q-1 22 -3 30M291 693q-3 25 -2 42" stroke="#050305" stroke-width="3" fill="none"/></g>
	<g id="spirit" transform="translate(${HX} 0)"><path d="M770 70a34 34 0 0 1 68 0v54l-14-10-13 10-13-10-13 10-15-10z" fill="#cfd6e6" opacity=".5"/><ellipse cx="793" cy="72" rx="4.5" ry="8" fill="#000"/><ellipse cx="815" cy="72" rx="4.5" ry="8" fill="#000"/></g>
	<path d="M0 800Q400 780 800 800T1600 790V900H0Z" fill="#050308"/>
	<g>${stones}</g><g>${fence}</g>
	<path d="${grass}" stroke="#030205" stroke-width="3" fill="none"/>`;
}

// monsters in a 96x140 window-local box: dark and pale, restrained
const SK = '#cfc8b6';
const MON = {
	girl: `<path d="M30 96L66 96L76 140L20 140Z" fill="#b9b4a6" opacity=".7"/><ellipse cx="48" cy="52" rx="8" ry="12" fill="${SK}"/><path d="M28 38Q48 14 68 38L74 124Q62 134 58 100L52 128Q48 138 44 104L40 132Q28 126 24 118Z" fill="#040204"/><path d="M46 46q2 8 1 22" stroke="#040204" stroke-width="4" fill="none"/><circle cx="52" cy="50" r="2.2" fill="#000"/>`,
	bride: `<path d="M24 130Q22 70 30 40Q48 10 66 40Q74 70 72 130Z" fill="#d8d4c6" opacity=".45"/><ellipse cx="48" cy="52" rx="12" ry="16" fill="${SK}"/><ellipse cx="43" cy="50" rx="3.2" ry="5" fill="#000"/><ellipse cx="53" cy="50" rx="3.2" ry="5" fill="#000"/><path d="M43 55q-2 14 0 26" stroke="#5a0a10" stroke-width="1.5" fill="none"/><path d="M44 64h8" stroke="#2a0a0e" stroke-width="1.5"/><path d="M18 140L30 90Q48 80 66 90L80 140Z" fill="#c9c5b6" opacity=".35"/>`,
	vampire: `<path d="M8 140L20 88Q48 70 76 88L88 140Z" fill="#020103"/><path d="M30 90L40 68L46 92M66 90L56 68L50 92" fill="#07040a"/><ellipse cx="48" cy="50" rx="12" ry="17" fill="#d3d0c4"/><path d="M35 40Q48 24 61 40Q54 34 48 34Q42 34 35 40Z" fill="#030204"/><circle cx="43" cy="48" r="2.6" fill="#ff2a2a" filter="url(#eye)"/><circle cx="53" cy="48" r="2.6" fill="#ff2a2a" filter="url(#eye)"/><circle cx="43" cy="48" r="1.1" fill="#ffb0b0"/><circle cx="53" cy="48" r="1.1" fill="#ffb0b0"/><path d="M38 43l6 2M58 43l-6 2" stroke="#050305" stroke-width="1.6"/><path d="M42 62h12" stroke="#2a0a0e" stroke-width="1.6"/><path d="M44 62l1.6 6 1.6 -6M50.8 62l1.6 6 1.6 -6" fill="#fff"/><path d="M52 66q1 8 -1 14" stroke="#6a0a12" stroke-width="1.3" fill="none"/>`,
	hand: `<path d="M30 52L38 28M42 46L46 20M54 46L58 22M66 52L72 32M24 78L12 66" stroke="${SK}" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="48" cy="76" rx="22" ry="26" fill="${SK}"/><path d="M40 100q-4 20 -2 40" stroke="#4a0a10" stroke-width="2.4" fill="none" opacity=".8"/>`,
	shape: `<path d="M18 140L22 70Q48 50 74 70L78 140Z" fill="#010101"/><ellipse cx="48" cy="46" rx="14" ry="18" fill="#d8d4c8"/><ellipse cx="42" cy="44" rx="3" ry="4.5" fill="#000"/><ellipse cx="54" cy="44" rx="3" ry="4.5" fill="#000"/><path d="M48 50v8" stroke="#9d9988" stroke-width="1"/><path d="M34 34Q48 18 62 34Q56 26 48 26Q40 26 34 34Z" fill="#050305"/>`
};
export const FIG = ['shape', 'girl', 'bride', 'vampire', 'hand', 'girl'];
export const monster = (type) => MON[type];

// ---- scare art: dark, desaturated, grainy. Faces are hidden or blurred on purpose; a clean cartoon face reads as a toy. ----
const faceDefs = `<defs>
	<radialGradient id="skin" cx=".5" cy=".42"><stop offset="0" stop-color="#c9c5b8"/><stop offset=".7" stop-color="#6d6a62"/><stop offset="1" stop-color="#1c1c1a"/></radialGradient>
	<radialGradient id="sock" cx=".5" cy=".5"><stop offset="0" stop-color="#000" stop-opacity=".95"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
	<radialGradient id="vg" cx=".5" cy=".5" r=".7"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".95"/></radialGradient>
	<filter id="grainy"><feTurbulence baseFrequency=".9" numOctaves="2" seed="5" result="n"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .45 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
	<filter id="soft"><feGaussianBlur stdDeviation="1.1"/></filter>
	<filter id="soft3"><feGaussianBlur stdDeviation="3"/></filter>
	<filter id="blurglow"><feGaussianBlur stdDeviation="5"/></filter>
</defs>`;

// hundreds of individual wet strands, not a flat shape
function ringGhost() {
	const r = lcg(11);
	let hair = '';
	for (let i = 0; i < 280; i++) {
		let sx = 200 + (r() - 0.5) * 260; const side = sx < 200 ? -1 : 1;
		if (Math.abs(sx - 200) < 30) sx = 200 + side * (30 + r() * 24);
		const ex = sx + side * r() * 80 + (r() - 0.5) * 34;
		const c1 = sx + side * (30 + r() * 55), c2 = ex + side * (10 + r() * 40);
		hair += `<path d="M${sx.toFixed(1)} -12C${c1.toFixed(1)} ${(110 + r() * 70).toFixed(0)},${c2.toFixed(1)} ${(290 + r() * 90).toFixed(0)},${ex.toFixed(1)} 520" stroke="#040304" stroke-width="${(1.2 + r() * 3.6).toFixed(1)}" opacity="${(0.55 + r() * 0.45).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
	}
	let across = '';
	for (let i = 0; i < 16; i++) {
		const sx = 200 + (r() - 0.5) * 70, ex = 200 + (r() - 0.5) * 90;
		across += `<path d="M${sx.toFixed(1)} -12C${(sx + (r() - 0.5) * 70).toFixed(1)} 150,${(ex + (r() - 0.5) * 70).toFixed(1)} 250,${ex.toFixed(1)} ${(300 + r() * 120).toFixed(0)}" stroke="#040304" stroke-width="${(0.9 + r() * 1.8).toFixed(1)}" opacity=".88" fill="none" stroke-linecap="round"/>`;
	}
	return `<svg viewBox="0 0 400 500">${faceDefs}
	<defs><radialGradient id="back" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#8d8d96"/><stop offset=".55" stop-color="#47474f"/><stop offset="1" stop-color="#0e0e12"/></radialGradient></defs>
	<rect width="400" height="500" fill="url(#back)"/>
	<ellipse cx="200" cy="255" rx="94" ry="134" fill="url(#skin)"/><ellipse cx="200" cy="255" rx="94" ry="134" fill="#000" filter="url(#grainy)"/>
	<ellipse cx="206" cy="212" rx="46" ry="32" fill="url(#sock)"/>
	<g filter="url(#soft)">
		<ellipse cx="206" cy="212" rx="27" ry="17" fill="#e4dfce"/>
		<path d="M180 214q10 -9 26 -9M232 214q-10 9 -26 9M184 208l10 4M228 218l-12 -3M190 222l9 -5M226 208l-10 4" stroke="#8c1c1c" stroke-width="1.1" fill="none" opacity=".7"/>
		<circle cx="207" cy="212" r="10.5" fill="#15100e"/><circle cx="207" cy="212" r="4.2" fill="#000"/><circle cx="203" cy="208" r="1.6" fill="#fff" opacity=".8"/>
		<path d="M178 206Q206 188 236 207" stroke="#000" stroke-width="5" fill="none" opacity=".75"/>
	</g>
	<path d="M178 322Q200 328 224 318" stroke="#1c0b0b" stroke-width="2.2" fill="none"/><path d="M224 318q5 26 1 48" stroke="#4a0a10" stroke-width="2.4" fill="none" opacity=".75"/>
	${hair}${across}
	<rect width="400" height="500" fill="url(#vg)"/></svg>`;
}

// found-footage night vision: something very close, standing in the doorway
function nightVision() {
	return `<svg viewBox="0 0 400 500">${faceDefs}
	<defs><radialGradient id="nvg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#274d2b"/><stop offset="1" stop-color="#040a05"/></radialGradient></defs>
	<rect width="400" height="500" fill="url(#nvg)"/>
	<g transform="rotate(-5 200 260)">
		<g filter="url(#soft)" stroke="#6fbf74" stroke-width="3" opacity=".55"><path d="M10 500Q30 360 140 335L260 335Q370 360 390 500" fill="none"/><ellipse cx="200" cy="190" rx="72" ry="94" fill="none"/></g>
		<path d="M10 500Q30 360 140 335L260 335Q370 360 390 500Z" fill="#010201"/><rect x="160" y="270" width="80" height="80" fill="#010201"/><ellipse cx="200" cy="190" rx="72" ry="94" fill="#010201"/>
		<g filter="url(#blurglow)" fill="#f2fff2"><ellipse cx="170" cy="176" rx="11" ry="5"/><ellipse cx="230" cy="176" rx="11" ry="5"/></g>
		<ellipse cx="170" cy="176" rx="7" ry="2.6" fill="#fff"/><ellipse cx="230" cy="176" rx="7" ry="2.6" fill="#fff"/>
	</g>
	<rect width="400" height="500" fill="#000" filter="url(#grainy)" opacity=".5"/>
	<text x="22" y="44" font-family="VT323, monospace" font-size="28" fill="#a8f0ac" opacity=".9">&#9679; REC 03:07:44</text>
	<rect width="400" height="500" fill="url(#vg)"/></svg>`;
}

// pale shape pressed against dark glass, mostly out of focus
function glass() {
	return `<svg viewBox="0 0 400 500">${faceDefs}
	<rect width="400" height="500" fill="#040405"/>
	<g filter="url(#soft3)" transform="rotate(7 200 262)">
		<ellipse cx="200" cy="262" rx="108" ry="152" fill="url(#skin)"/>
		<ellipse cx="160" cy="222" rx="23" ry="36" fill="#000"/><ellipse cx="246" cy="236" rx="19" ry="29" fill="#000"/>
		<path d="M158 360Q202 348 248 362Q244 386 202 388Q162 386 158 360Z" fill="#000"/>
	</g>
	<path d="M96 120v380M150 90v410M260 100v400M312 130v370" stroke="#8aa" stroke-width="1" opacity=".12"/>
	<rect width="400" height="500" fill="#000" filter="url(#grainy)" opacity=".45"/>
	<rect width="400" height="500" fill="url(#vg)"/></svg>`;
}

// 0: hair-curtain ghost with one wide eye (also the screamer), 1: night-vision doorway, 2: face against glass
export const FACES = [ringGhost(), nightVision(), glass()];

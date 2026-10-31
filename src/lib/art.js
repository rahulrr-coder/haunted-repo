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

const defs = `<defs><radialGradient id="skin" cx=".5" cy=".42"><stop offset="0" stop-color="#e0dccd"/><stop offset="1" stop-color="#7d786c"/></radialGradient><radialGradient id="mouth" cx=".5" cy=".4"><stop offset="0" stop-color="#3a0408"/><stop offset="1" stop-color="#000"/></radialGradient><filter id="sk"><feTurbulence baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter><filter id="rg"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
const hair = `<path d="M200 6C80 6 40 130 48 310C52 410 34 470 22 500H150L160 300Z" fill="#030203"/><path d="M200 6C320 6 360 130 352 310C348 410 366 470 378 500H250L240 300Z" fill="#030203"/>`;
// jump-scare / screamer faces: wet-haired ghost girl (also the screamer), vampire, bride
export const FACES = [
	`<svg viewBox="0 0 400 500">${defs}${hair}<ellipse cx="200" cy="232" rx="84" ry="120" fill="url(#skin)"/><ellipse cx="200" cy="232" rx="84" ry="120" fill="#000" filter="url(#sk)"/><ellipse cx="162" cy="206" rx="25" ry="34" fill="#030203"/><ellipse cx="238" cy="206" rx="25" ry="34" fill="#030203"/><circle cx="163" cy="210" r="2.4" fill="#fff"/><circle cx="239" cy="210" r="2.4" fill="#fff"/><path d="M200 238q-7 25 0 40" stroke="#4a463d" stroke-width="3" fill="none" opacity=".5"/><path d="M154 306Q200 282 246 306Q258 392 200 414Q142 392 154 306Z" fill="url(#mouth)"/><path d="M160 316q-5 42 -3 76M242 316q5 42 3 76" stroke="#5a0a10" stroke-width="3" fill="none"/><path d="M168 120q-12 70 -4 140M232 118q12 70 6 138M200 112q2 60 -2 118" stroke="#030203" stroke-width="3.5" fill="none"/></svg>`,
	`<svg viewBox="0 0 400 500">${defs}<path d="M20 500L90 340Q200 300 310 340L380 500Z" fill="#020102"/><path d="M110 360L150 290L190 380M290 360L250 290L210 380" fill="#07040a"/><ellipse cx="200" cy="215" rx="78" ry="112" fill="#cfd2d4"/><ellipse cx="200" cy="215" rx="78" ry="112" fill="#000" filter="url(#sk)"/><path d="M120 150Q200 50 280 150Q240 112 200 108Q160 112 120 150Z" fill="#020102"/><ellipse cx="164" cy="196" rx="26" ry="20" fill="#05030a"/><ellipse cx="236" cy="196" rx="26" ry="20" fill="#05030a"/><circle cx="164" cy="196" r="12" fill="#ff2222" filter="url(#rg)"/><circle cx="236" cy="196" r="12" fill="#ff2222" filter="url(#rg)"/><circle cx="164" cy="196" r="6" fill="#ffd0d0"/><circle cx="236" cy="196" r="6" fill="#ffd0d0"/><path d="M130 168L188 186M270 168L212 186" stroke="#030203" stroke-width="7"/><path d="M160 290Q200 270 240 290Q250 340 200 350Q150 340 160 290Z" fill="url(#mouth)"/><path d="M172 290l9 52 9 -52zM210 290l9 52 9 -52z" fill="#f4f0e4"/><path d="M186 350q4 40 0 70M224 346q-4 40 2 66" stroke="#6a0a12" stroke-width="4" fill="none"/></svg>`,
	`<svg viewBox="0 0 400 500">${defs}<path d="M40 500Q30 230 100 110Q200 -20 300 110Q370 230 360 500Z" fill="#d8d4c6" opacity=".4"/><ellipse cx="200" cy="228" rx="80" ry="112" fill="url(#skin)"/><ellipse cx="200" cy="228" rx="80" ry="112" fill="#000" filter="url(#sk)"/><ellipse cx="164" cy="204" rx="22" ry="32" fill="#030203"/><ellipse cx="236" cy="204" rx="22" ry="32" fill="#030203"/><path d="M164 236q-8 60 -2 118M236 236q8 60 2 118" stroke="#5a0a10" stroke-width="4" fill="none"/><path d="M162 304Q200 290 238 304Q248 380 200 398Q152 380 162 304Z" fill="url(#mouth)"/><path d="M60 500L110 360Q200 330 290 360L340 500Z" fill="#c9c5b6" opacity=".45"/></svg>`
];

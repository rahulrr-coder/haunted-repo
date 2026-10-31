// All audio is synthesized with WebAudio: no asset files. Everything ambient routes through `bed` so the screamer can duck it.
export const rnd = (a, b) => a + Math.random() * (b - a);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const Snd = {
	ctx: null, on: true, bpm: 60, heart: 1, left: 1, arpI: 0,
	start() {
		if (this.ctx) {
			if (this.ctx.state === 'suspended') this.ctx.resume();
			return;
		}
		try {
			const c = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
			this.out = c.createGain();
			this.out.gain.value = this.on ? 1 : 0;
			this.comp = c.createDynamicsCompressor(); // limiter: loud scares are loud but never clip
			this.comp.threshold.value = -16; this.comp.ratio.value = 14; this.comp.attack.value = 0.003; this.comp.release.value = 0.25; this.comp.knee.value = 8;
			this.out.connect(this.comp); this.comp.connect(c.destination);
			this.bed = c.createGain(); this.bed.connect(this.out);
			// drone: detuned saws + sub, slow tremolo
			const dg = c.createGain(); dg.gain.value = 0.07;
			const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 150;
			[41.2, 41.8, 82.5].forEach((f) => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); });
			const sub = c.createOscillator(); sub.frequency.value = 27.5;
			const sg = c.createGain(); sg.gain.value = 0.25; sub.connect(sg).connect(dg); sub.start();
			lp.connect(dg).connect(this.bed);
			const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.03; lfo.connect(lg).connect(dg.gain); lfo.start();
			// wind: looping noise through a wandering bandpass
			const nb = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), nd = nb.getChannelData(0);
			for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
			const wn = c.createBufferSource(); wn.buffer = nb; wn.loop = true;
			const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 1.4;
			this.wg = c.createGain(); this.wg.gain.value = 0.06; wn.connect(wf).connect(this.wg).connect(this.bed); wn.start();
			const wl = c.createOscillator(), wlg = c.createGain(); wl.frequency.value = 0.11; wlg.gain.value = 260; wl.connect(wlg).connect(wf.frequency); wl.start();
			const wl2 = c.createOscillator(), wlg2 = c.createGain(); wl2.frequency.value = 0.05; wlg2.gain.value = 0.035; wl2.connect(wlg2).connect(this.wg.gain); wl2.start();
			this.beatLoop(); this.arpLoop();
			setTimeout(function creak() { Snd.creak(); setTimeout(creak, rnd(7000, 16000)); }, 5000);
			setTimeout(function whisp() { Snd.whisper(); setTimeout(whisp, rnd(6000, 14000)); }, 8000);
		} catch (e) {
			console.warn('audio unavailable', e);
		}
	},
	toggle() {
		this.on = !this.on;
		this.start();
		if (this.out) this.out.gain.setTargetAtTime(this.on ? 1 : 0, this.ctx.currentTime, 0.08);
		return this.on;
	},
	duck(v, t = 0.05) { if (this.bed) this.bed.gain.setTargetAtTime(v, this.ctx.currentTime, t); },
	tone(f, t, d, type = 'sine', v = 0.2, f2, dest) {
		if (!this.ctx) return;
		const c = this.ctx, o = c.createOscillator(), g = c.createGain();
		o.type = type; o.frequency.setValueAtTime(f, t);
		if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
		g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
		o.connect(g).connect(dest || this.out); o.start(t); o.stop(t + d + 0.05);
	},
	noise(t, d, v, freq, type = 'bandpass', q = 1, dest) {
		if (!this.ctx) return;
		const c = this.ctx, b = c.createBuffer(1, Math.max(1, c.sampleRate * d), c.sampleRate), x = b.getChannelData(0);
		for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
		const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
		n.buffer = b; f.type = type; f.frequency.value = freq; f.Q.value = q;
		g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
		n.connect(f).connect(g).connect(dest || this.out); n.start(t);
	},
	beatLoop() {
		const go = () => {
			if (!this.ctx) return;
			const t = this.ctx.currentTime, v = this.heart;
			if (v > 0.02) { this.tone(60, t, 0.2, 'sine', 0.7 * v, 38, this.bed); this.tone(52, t + 0.22, 0.18, 'sine', 0.45 * v, 34, this.bed); }
			setTimeout(go, 60000 / this.bpm);
		};
		go();
	},
	// slow minor-key synth arpeggio in 5/4 that speeds up and detunes as possession rises
	arpLoop() {
		const notes = [45, 52, 57, 52, 45, 52, 59, 52, 56, 52];
		const go = () => {
			if (!this.ctx) return;
			const c = this.ctx, v = this.left;
			if (v > 0.02) {
				const f = 440 * Math.pow(2, (notes[this.arpI++ % notes.length] - 69) / 12), t = c.currentTime;
				const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
				o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 40 * v;
				lp.type = 'lowpass'; lp.frequency.setValueAtTime(500 + 1100 * v, t); lp.frequency.exponentialRampToValueAtTime(220, t + 0.35);
				g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.05 + 0.06 * v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
				o.connect(lp).connect(g).connect(this.bed); o.start(t); o.stop(t + 0.45);
			}
			setTimeout(go, 60000 / (92 + 56 * v) / 2);
		};
		go();
	},
	creak() {
		if (!this.ctx) return;
		const t = this.ctx.currentTime;
		this.tone(rnd(110, 190), t, 1.1, 'sawtooth', 0.05, rnd(55, 80), this.bed);
		this.noise(t, 0.9, 0.035, 900, 'bandpass', 6, this.bed);
	},
	whisper() {
		if (!this.ctx) return;
		const c = this.ctx, t = c.currentTime;
		const b = c.createBuffer(1, c.sampleRate * 1.6, c.sampleRate), x = b.getChannelData(0);
		for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
		const n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner();
		n.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(1500, t); f.frequency.linearRampToValueAtTime(2600, t + 1.4); f.Q.value = 9;
		p.pan.value = Math.random() < 0.5 ? -0.8 : 0.8;
		g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.09 * (0.3 + this.left), t + 0.5); g.gain.linearRampToValueAtTime(0.001, t + 1.5);
		n.connect(f).connect(g).connect(p).connect(this.bed); n.start(t);
	},
	stinger(kind = 0) {
		if (!this.ctx) return;
		const t = this.ctx.currentTime;
		this.noise(t, 0.6, 0.8, 2000, 'bandpass', 0.8);
		if (kind === 0) { this.tone(1100, t, 0.55, 'sawtooth', 0.35, 110); this.tone(1650, t, 0.45, 'square', 0.14, 190); }
		else if (kind === 1) { [740, 784, 831, 880].forEach((f) => this.tone(f, t, 0.7, 'sawtooth', 0.16, f * 0.5)); this.tone(55, t, 0.9, 'sine', 0.8, 30); }
		else { this.tone(300, t, 0.6, 'sawtooth', 0.3, 2400); this.tone(60, t, 0.8, 'sine', 0.8, 35); }
	},
	right() { if (this.ctx) this.tone(392, this.ctx.currentTime, 0.5, 'triangle', 0.14); },
	heal() { if (!this.ctx) return; const t = this.ctx.currentTime; [523, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.12, 2, 'sine', 0.22 - i * 0.04)); },
	win() { if (!this.ctx) return; const t = this.ctx.currentTime; [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, t + i * 0.4, 1.5, 'triangle', 0.2)); },
	thunder() { if (this.ctx) this.noise(this.ctx.currentTime + 0.3, 2.8, 1, 110, 'lowpass', 0.7); },
	// crying voice: sawtooth through vowel formants, vibrato, falling pitch, sobbing amplitude
	cry(dur = 3.6) {
		if (!this.ctx) return;
		const c = this.ctx, t = c.currentTime;
		const o = c.createOscillator(), vib = c.createOscillator(), vg = c.createGain(), amp = c.createGain(), sob = c.createOscillator(), sg = c.createGain();
		o.type = 'sawtooth'; o.frequency.setValueAtTime(470, t); o.frequency.linearRampToValueAtTime(330, t + dur);
		vib.frequency.value = 5.6; vg.gain.value = 22; vib.connect(vg).connect(o.frequency);
		amp.gain.setValueAtTime(0.0001, t); amp.gain.linearRampToValueAtTime(0.16, t + dur * 0.7); amp.gain.linearRampToValueAtTime(0.12, t + dur);
		sob.frequency.value = 1.35; sg.gain.value = 0.07; sob.connect(sg).connect(amp.gain);
		const merge = c.createGain();
		[[750, 6, 1], [1250, 8, 0.8], [2700, 10, 0.3]].forEach(([fr, q, gain]) => {
			const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q;
			const bg = c.createGain(); bg.gain.value = gain; o.connect(bp).connect(bg).connect(merge);
		});
		merge.connect(amp).connect(this.out);
		[o, vib, sob].forEach((n) => { n.start(t); n.stop(t + dur + 0.1); });
		this.noise(t, dur, 0.03, 3000, 'highpass', 0.5);
	},
	scream(dur = 1.15) {
		if (!this.ctx) return;
		const c = this.ctx, t = c.currentTime;
		const ws = c.createWaveShaper(), k = 120, curve = new Float32Array(1024);
		for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
		ws.curve = curve; ws.oversample = '2x';
		const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.6;
		const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.03); g.gain.setValueAtTime(0.7, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
		[1, 1.5, 2.01].forEach((m) => {
			const o = c.createOscillator(); o.type = 'sawtooth';
			o.frequency.setValueAtTime(620 * m, t); o.frequency.exponentialRampToValueAtTime(1500 * m, t + dur * 0.55); o.frequency.linearRampToValueAtTime(1100 * m, t + dur);
			const v = c.createOscillator(), vg = c.createGain(); v.frequency.value = 13; vg.gain.value = 40 * m; v.connect(vg).connect(o.frequency);
			o.connect(ws); [o, v].forEach((n) => { n.start(t); n.stop(t + dur + 0.05); });
		});
		ws.connect(bp).connect(g).connect(this.out);
		this.noise(t, dur, 0.5, 3500, 'bandpass', 0.5);
		this.tone(48, t, dur, 'sine', 0.9, 30);
	}
};

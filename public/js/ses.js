// Ses motoru: kodla üretilen gerilim müziği + efektler + seslendirme çalma.
// Hiçbir hazır müzik dosyası yok, telif sorunu olmaz.

const NOTA = n => 220 * Math.pow(2, n / 12); // 0 = La3

const KISILER = {
  anlatici: { pitch: 0.85, rate: 0.98 }, muhtar: { pitch: 0.75, rate: 0.95 }, bakkal: { pitch: 1.1, rate: 1.12 },
  ebe: { pitch: 1.3, rate: 0.9 }, coban: { pitch: 1.05, rate: 1.0 }, ogretmen: { pitch: 1.2, rate: 1.05 }, demirci: { pitch: 0.6, rate: 0.9 },
};

export class Ses {
  constructor() {
    this.ctx = null;
    this.mod = 'bekleme';
    this.yogunluk = 0;
    this.muzikAcik = true;
    this.konusuyor = 0;
    this.adim = 0;
    this.sonrakiZaman = 0;
    this.kalpZaman = 0;
    this.akorSayac = 0;
    this.trTts = null;
  }

  get hazir() { return !!this.ctx && this.ctx.state === 'running'; }

  async baslat() {
    if (this.ctx) { if (this.ctx.state !== 'running') await this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = this.ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.ana = ctx.createGain(); this.ana.gain.value = 0.9; this.ana.connect(comp);
    this.muzik = ctx.createGain(); this.muzik.gain.value = 0.55; this.muzik.connect(this.ana);
    this.efekt = ctx.createGain(); this.efekt.gain.value = 0.8; this.efekt.connect(this.ana);
    // yankı
    this.yanki = ctx.createConvolver();
    const uz = ctx.sampleRate * 2.8, buf = ctx.createBuffer(2, uz, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < uz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / uz, 3); }
    this.yanki.buffer = buf;
    this.yankiGain = ctx.createGain(); this.yankiGain.gain.value = 0.35;
    this.yanki.connect(this.yankiGain); this.yankiGain.connect(this.ana);
    this.muzik.connect(this.yanki);
    this.efekt.connect(this.yanki);
    this.gurultuBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const g = this.gurultuBuf.getChannelData(0); for (let i = 0; i < g.length; i++) g[i] = Math.random() * 2 - 1;
    this.droneKur();
    this.ust = this.titremeKur();
    this.sonrakiZaman = ctx.currentTime + 0.1;
    setInterval(() => this.zamanla(), 25);
    if (ctx.state !== 'running') await ctx.resume();
    this.ttsSec();
  }

  droneKur() {
    const ctx = this.ctx;
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240; f.Q.value = 3;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 90; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    for (const [fr, dt] of [[55, -6], [55, 7], [82.4, 0], [27.5, 0]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = dt; o.connect(f); o.start();
    }
    f.connect(this.droneGain); this.droneGain.connect(this.muzik);
  }

  titremeKur() {
    const ctx = this.ctx;
    const g = ctx.createGain(); g.gain.value = 0;
    const trem = ctx.createGain(); trem.gain.value = 0.5;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 11; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain); lfo.start();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
    for (const fr of [NOTA(12), NOTA(13), NOTA(19)]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); }
    f.connect(trem); trem.connect(g); g.connect(this.muzik);
    return g;
  }

  // mod: bekleme | gunduz | oylama | gece | aksam | kilit | koy | vampir | sabah ; yogunluk 0..1
  ayarla(mod, yogunluk = 0) {
    this.mod = mod; this.yogunluk = yogunluk;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const drone = { bekleme: 0.06, gunduz: 0.05, oylama: 0.1, gece: 0.2, aksam: 0.18, kilit: 0.14, koy: 0.0, vampir: 0.22, sabah: 0.04 }[mod] ?? 0.06;
    this.droneGain.gain.setTargetAtTime(this.muzikAcik ? drone : 0, t, 0.8);
    let ust = 0;
    if (mod === 'oylama') ust = Math.max(0, (yogunluk - 0.7) / 0.3) * 0.05;
    if (mod === 'aksam') ust = 0.035;
    if (mod === 'vampir') ust = 0.03;
    this.ust.gain.setTargetAtTime(this.muzikAcik ? ust : 0, t, 0.5);
  }

  muzikAc(v) { this.muzikAcik = v; this.ayarla(this.mod, this.yogunluk); }

  tempo() {
    const m = this.mod;
    if (m === 'oylama') return 116 + this.yogunluk * 56;
    if (m === 'bekleme') return 92;
    if (m === 'gunduz' || m === 'sabah') return 100;
    if (m === 'kilit') return 76;
    return 0;
  }

  zamanla() {
    if (!this.hazir) return;
    const ctx = this.ctx, ileri = ctx.currentTime + 0.15;
    // ostinato
    const bpm = this.tempo();
    if (bpm && this.muzikAcik) {
      const sekizlik = 60 / bpm / 2;
      if (this.sonrakiZaman < ctx.currentTime - 0.5) this.sonrakiZaman = ctx.currentTime + 0.05;
      while (this.sonrakiZaman < ileri) {
        this.adimCal(this.sonrakiZaman, this.adim);
        this.adim++;
        this.sonrakiZaman += sekizlik;
      }
    } else this.sonrakiZaman = ctx.currentTime + 0.05;
    // kalp atışı
    if (this.muzikAcik && ['gece', 'aksam', 'kilit', 'vampir'].includes(this.mod)) {
      const aralik = this.mod === 'aksam' ? 0.72 : this.mod === 'kilit' ? 0.8 : 0.86;
      if (this.kalpZaman < ctx.currentTime) this.kalpZaman = ctx.currentTime + 0.05;
      while (this.kalpZaman < ileri) {
        this.kalp(this.kalpZaman);
        this.kalpZaman += aralik;
      }
    }
  }

  adimCal(t, i) {
    const m = this.mod;
    const kalip = [
      [0, null, 3, 0, 1, null, 7, 0], [0, null, 3, 0, 1, null, 8, 7],
      [0, null, 5, 3, 1, null, 3, 0], [0, null, 3, 0, -2, null, -1, 1],
    ];
    const bar = Math.floor(i / 8) % 4, a = i % 8;
    const n = kalip[bar][a];
    const ses = m === 'oylama' ? 0.11 : m === 'kilit' ? 0.07 : 0.075;
    if (n !== null) this.pluck(t, NOTA(n + (m === 'oylama' && bar % 2 ? 12 : 0)), ses);
    if (m === 'oylama') {
      if (a % 2 === 1) this.hihat(t, 0.025 + this.yogunluk * 0.03);
      if (a === 0 || a === 4) this.bas(t, 55, 0.22);
    }
    if ((m === 'gunduz' || m === 'bekleme' || m === 'sabah') && a === 0 && bar % 2 === 0) {
      const akorlar = [[0, 3, 7], [-4, 0, 3], [-7, -4, 0], [-5, -1, 2]];
      this.ped(t, akorlar[this.akorSayac++ % 4], 60 / this.tempo() * 8);
    }
  }

  osc(t, tip, fr, dur, vol, hedef, filtre) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tip; o.frequency.setValueAtTime(fr, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let son = g;
    if (filtre) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtre; g.connect(f); son = f; }
    o.connect(g); son.connect(hedef || this.muzik); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  pluck(t, fr, vol) { this.osc(t, 'triangle', fr, 0.32, vol, this.muzik, 2400); this.osc(t, 'sine', fr * 2, 0.15, vol * 0.25); }
  bas(t, fr, vol) { const o = this.osc(t, 'sine', fr, 0.3, vol); o.frequency.exponentialRampToValueAtTime(fr * 0.6, t + 0.25); }
  ped(t, notalar, dur) {
    const ctx = this.ctx;
    for (const n of notalar) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = NOTA(n); o.detune.value = Math.random() * 8 - 4;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.muzik); o.start(t); o.stop(t + dur + 0.1);
    }
  }
  gurultu(t, dur, vol, fr, tip = 'bandpass', Q = 1, hedef) {
    const ctx = this.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.gurultuBuf; f.type = tip; f.frequency.value = fr; f.Q.value = Q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(hedef || this.muzik); s.start(t); s.stop(t + dur + 0.05);
    return f;
  }
  hihat(t, vol) { this.gurultu(t, 0.05, vol, 8000, 'highpass', 0.7); }
  kalp(t) {
    for (const [dt, fr, v] of [[0, 62, 0.5], [0.16, 52, 0.36]]) {
      const o = this.osc(t + dt, 'sine', fr, 0.22, v, this.muzik);
      o.frequency.exponentialRampToValueAtTime(fr * 0.55, t + dt + 0.2);
    }
  }

  // ───── efektler ─────
  efektCal(ad) {
    if (!this.hazir) return;
    const t = this.ctx.currentTime + 0.02, E = this.efekt;
    if (ad === 'can' || ad === 'zil') {
      for (const [k, v] of [[1, 0.3], [2.0, 0.16], [2.4, 0.12], [3.0, 0.1], [4.2, 0.06]]) this.osc(t, 'sine', 196 * k, 3.2, v, E);
      for (const [k, v] of [[1, 0.25], [2.0, 0.13], [3.0, 0.08]]) this.osc(t + 0.9, 'sine', 196 * k, 2.6, v, E);
    } else if (ad === 'darbe' || ad === 'isirik' || ad === 'gece') {
      const o = this.osc(t, 'sine', 90, 1.4, 0.7, E); o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
      this.gurultu(t, 0.9, 0.35, 180, 'lowpass', 0.8, E);
      if (ad === 'isirik') this.yarasa(t + 0.2);
    } else if (ad === 'kilit') {
      this.gurultu(t, 0.25, 0.6, 500, 'bandpass', 2, E);
      this.osc(t, 'square', 640, 0.4, 0.05, E, 3000); this.osc(t, 'sine', 980, 0.6, 0.08, E);
      this.osc(t + 0.12, 'sine', 120, 0.5, 0.4, E);
    } else if (ad === 'surgun' || ad === 'woosh') {
      const f = this.gurultu(t, 1.0, 0.4, 300, 'bandpass', 3, E);
      f.frequency.exponentialRampToValueAtTime(3000, t + 0.9);
    } else if (ad === 'zafer' || ad === 'gunes') {
      [0, 4, 7, 12, 16].forEach((n, i) => this.osc(t + i * 0.13, 'triangle', NOTA(n + 3), 1.4, 0.16, E, 4000));
      this.osc(t + 0.7, 'sine', NOTA(15), 2.5, 0.12, E);
    } else if (ad === 'vampirKazandi') {
      for (const n of [-24, -23, -18, -12]) { const o = this.osc(t, 'sawtooth', NOTA(n), 3.5, 0.09, E, 900); o.detune.value = Math.random() * 20; }
      this.yarasa(t + 0.5); this.yarasa(t + 1.1);
    } else if (ad === 'ipucu' || ad === 'fener') {
      this.osc(t, 'sine', NOTA(19), 0.9, 0.12, E); this.osc(t + 0.12, 'sine', NOTA(24), 1.2, 0.1, E);
    } else if (ad === 'tik') {
      this.gurultu(t, 0.03, 0.4, 3000, 'bandpass', 4, E);
    } else if (ad === 'fenerAs') {
      this.osc(t, 'sine', NOTA(24), 0.6, 0.07, E); this.osc(t + 0.08, 'sine', NOTA(28), 0.6, 0.06, E);
    } else if (ad === 'havaiFisek') {
      const f = this.gurultu(t, 0.6, 0.2, 800, 'bandpass', 2, E); f.frequency.exponentialRampToValueAtTime(4000, t + 0.5);
      this.gurultu(t + 0.6, 0.8, 0.5, 1200, 'lowpass', 0.5, E);
    } else if (ad === 'oyBasla') {
      this.osc(t, 'square', NOTA(7), 0.15, 0.06, E, 2000); this.osc(t + 0.16, 'square', NOTA(12), 0.3, 0.07, E, 2000);
    } else if (ad === 'sessizSabah') {
      [0, 7, 12].forEach((n, i) => this.osc(t + i * 0.2, 'sine', NOTA(n + 12), 1.2, 0.08, E));
    }
  }
  yarasa(t) {
    for (let i = 0; i < 4; i++) { const o = this.osc(t + i * 0.07, 'sine', 3000, 0.06, 0.05, this.efekt); o.frequency.exponentialRampToValueAtTime(6500, t + i * 0.07 + 0.05); }
  }

  // ───── seslendirme ─────
  kis(v) {
    if (!this.ctx) return;
    this.konuşanSayisi = Math.max(0, (this.konuşanSayisi || 0) + v);
    this.muzik.gain.setTargetAtTime(this.konuşanSayisi > 0 ? 0.24 : 0.55, this.ctx.currentTime, 0.15);
  }

  konusDosya(url) {
    return new Promise(res => {
      const a = new Audio(url);
      a.volume = 1;
      let bitti = false;
      const son = () => { if (bitti) return; bitti = true; this.kis(-1); res(); };
      a.onended = son; a.onerror = son;
      this.kis(1);
      a.play().catch(son);
      setTimeout(son, 30000);
    });
  }

  // Parçaları art arda, aralarında çok kısa boşlukla çal (isim + sabit cümle)
  async konusDosyalar(urls) {
    this.kis(1);
    try {
      // hepsini önceden yükle ki parçalar arası takılma olmasın
      const sesler = urls.map(u => { const a = new Audio(u); a.preload = 'auto'; return a; });
      for (const a of sesler) {
        await new Promise(res => {
          let bitti = false;
          const son = () => { if (!bitti) { bitti = true; res(); } };
          a.onended = son; a.onerror = son;
          a.play().catch(son);
          setTimeout(son, 20000);
        });
        await new Promise(r => setTimeout(r, 40));
      }
    } finally { this.kis(-1); }
  }

  ttsSec() {
    if (!('speechSynthesis' in window)) return;
    const sec = () => {
      const v = speechSynthesis.getVoices().filter(x => /^tr/i.test(x.lang));
      this.trSesler = v;
      this.trTts = v.find(x => /yelda/i.test(x.name)) || v[0] || null;
    };
    sec(); speechSynthesis.onvoiceschanged = sec;
  }

  konusTTS(metin, kim, maks = 20000) {
    return new Promise(res => {
      if (!('speechSynthesis' in window)) return setTimeout(res, Math.min(maks, 1200 + metin.length * 60));
      const temiz = metin.replace(/\[[^\]]*\]/g, '').trim();
      const u = new SpeechSynthesisUtterance(temiz);
      u.lang = 'tr-TR';
      const sesler = this.trSesler || [];
      if (sesler.length > 1 && kim !== 'anlatici') {
        const sira = ['muhtar', 'bakkal', 'ebe', 'coban', 'ogretmen', 'demirci'].indexOf(kim);
        u.voice = sesler[(sira + 1) % sesler.length];
      } else if (this.trTts) u.voice = this.trTts;
      const p = KISILER[kim] || KISILER.anlatici;
      u.pitch = p.pitch; u.rate = p.rate;
      let bitti = false;
      const son = () => { if (bitti) return; bitti = true; this.kis(-1); res(); };
      u.onend = son; u.onerror = son;
      this.kis(1);
      speechSynthesis.speak(u);
      setTimeout(son, Math.min(maks, 2500 + temiz.length * 90));
    });
  }
}

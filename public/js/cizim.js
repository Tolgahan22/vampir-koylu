// Ekran çizimi: 720x1280 dikey (TikTok için 9:16). Her şey kodla çiziliyor.
import { KARAKTERLER } from './senaryolar.js';

const W = 720, H = 1280;
const F = '"Avenir Next","Segoe UI","Helvetica Neue",Arial,sans-serif';
const B = 'Georgia,"Times New Roman",serif';
const SAHNE_UST = 112, SAHNE_ALT = 660;
const AYAK_Y = 604;
const SLOT_X = [66, 184, 302, 418, 536, 654];

const RENK = {
  muhtar: { govde: '#6b4630', ten: '#f0c393' }, bakkal: { govde: '#3c78b5', ten: '#eab68a' }, ebe: { govde: '#7d3c80', ten: '#f3cfa6' },
  coban: { govde: '#8b6b3d', ten: '#dfa77a' }, ogretmen: { govde: '#3f8a5a', ten: '#f3caa1' }, demirci: { govde: '#5a5f66', ten: '#d69d76' },
};
const KISA = Object.fromEntries(KARAKTERLER.map(k => [k.id, k]));
const AD_RENK = { anlatici: '#ffcf6b', muhtar: '#f0a56b', bakkal: '#7fb8ff', ebe: '#e59cf0', coban: '#e3c27a', ogretmen: '#8fe0a8', demirci: '#c9d0d8' };

const lerp = (a, b, t) => a + (b - a) * t;
const kis = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function hexRgb(h) {
  if (h[0] === 'r') return h.slice(h.indexOf('(') + 1, -1).split(',').map(Number);
  const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255];
}
function karis(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function sar(c, metin, maks) {
  const kel = String(metin).split(' '), sat = [];
  let s = '';
  for (const k of kel) { const den = s ? s + ' ' + k : k; if (c.measureText(den).width > maks && s) { sat.push(s); s = k; } else s = den; }
  if (s) sat.push(s);
  return sat;
}
function yaz(c, metin, x, y, font, renk, hiza = 'left', golge = 0) {
  c.font = font; c.fillStyle = renk; c.textAlign = hiza; c.textBaseline = 'alphabetic';
  if (golge) { c.save(); c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = golge; c.fillText(metin, x, y); c.restore(); } else c.fillText(metin, x, y);
}

export class Cizici {
  constructor(canvas) {
    this.cv = canvas; this.c = canvas.getContext('2d');
    this.d = null; this.dZaman = 0;
    this.faz = null; this.fazBas = 0;
    this.karanlik = 0.5; this.kirmizi = 0;
    this.efektler = []; this.bildirimler = []; this.parcacik = []; this.fenerler = []; this.yarasalar = [];
    this.konusma = null; this.sarsinti = null; this.flas = null;
    this.sonOySayisi = {};
    this.yildiz = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: SAHNE_UST + Math.random() * 260, r: Math.random() * 1.6 + 0.3, f: Math.random() * 6 }));
    this.evler = ['Ayşe Teyze', 'Hüsnü Dede', 'Fırıncı Cemal', 'Değirmenci Osman', 'Postacı Yusuf', 'Kahveci Nazım', 'Bekçi Rıfat', 'Terzi Melek']
      .map((ad, i) => ({ ad, x: 150 + i * 72 + (i % 2) * 6, y: 400 - (i % 3) * 14, w: 58 + (i % 3) * 6, cati: ['#8c3b2e', '#6d4b3a', '#7a5230', '#5b3b4e'][i % 4] }));
    this.boyutla();
    window.addEventListener('resize', () => this.boyutla());
  }

  boyutla() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ow = window.innerWidth, oh = window.innerHeight;
    const olcek = Math.min(ow / W, oh / H);
    this.cv.style.width = Math.floor(W * olcek) + 'px';
    this.cv.style.height = Math.floor(H * olcek) + 'px';
    this.cv.width = Math.floor(W * olcek * dpr);
    this.cv.height = Math.floor(H * olcek * dpr);
    this.olcek = olcek * dpr;
  }

  guncelle(d) {
    const simdi = performance.now();
    if (!this.d || d.faz.ad !== this.d.faz.ad || d.senaryo.id !== this.d.senaryo.id && d.faz.ad === 'bekleme') { this.faz = d.faz.ad; this.fazBas = simdi - d.faz.gecen; }
    if (d.ipuclari && this.d && d.ipuclari.length > this.d.ipuclari.length) this.ipucuParla = simdi;
    this.d = d; this.dZaman = simdi;
  }

  kalanMs() {
    const d = this.d; if (!d) return 0;
    const gec = d.faz.gecen + (d.faz.duraklat ? 0 : performance.now() - this.dZaman);
    return Math.max(0, d.faz.sure - gec);
  }

  olay(e) {
    const t = performance.now();
    if (e.tip === 'bildirim') { this.bildirimler.unshift({ ...e, bas: t }); this.bildirimler = this.bildirimler.slice(0, 4); return; }
    if (e.tip !== 'efekt') return;
    const ad = e.ad;
    if (ad === 'can') { this.sarsinti = { bas: t, guc: 14, sure: 900 }; this.flas = { bas: t, renk: '214,56,75', sure: 700 }; }
    if (ad === 'isirik') { this.flas = { bas: t, renk: '120,0,20', sure: 900 }; this.yarasaSal(10); }
    if (ad === 'kilit') this.sarsinti = { bas: t, guc: 8, sure: 400 };
    if (ad === 'gece') this.yarasaSal(7);
    if (ad === 'zafer' || ad === 'sessizSabah' || ad === 'gunes') this.konfeti(ad === 'zafer' ? 140 : 70);
    if (ad === 'vampirKazandi') { this.yarasaSal(18); this.flas = { bas: t, renk: '160,0,30', sure: 1400 }; }
    if (ad === 'fenerAs') this.fenerler.push({ ad: e.isim, x: 80 + Math.random() * 560, bas: t });
    if (ad === 'havaiFisek') { for (let i = 0; i < 3; i++) setTimeout(() => this.havaiFisek(e.isim), i * 450); }
    if (ad === 'fener') this.flas = { bas: t, renk: '255,190,90', sure: 700 };
    this.efektler.push({ ad, bas: t, ...e });
  }

  konusmaBasla(item, sure) { this.konusma = { ...item, bas: performance.now(), sure: sure || 3000 }; }

  yarasaSal(n) {
    const t = performance.now();
    for (let i = 0; i < n; i++) this.yarasalar.push({ x: -40 - Math.random() * 300, y: SAHNE_UST + 40 + Math.random() * 260, v: 160 + Math.random() * 160, f: Math.random() * 6, s: 0.6 + Math.random() * 0.7, bas: t });
  }
  konfeti(n) {
    const renk = ['#ffcf6b', '#ff6b6b', '#6bd0ff', '#8fe08f', '#e59cf0', '#ffffff'];
    for (let i = 0; i < n; i++) this.parcacik.push({ x: Math.random() * W, y: SAHNE_UST - 20 - Math.random() * 200, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 160, r: 4 + Math.random() * 5, a: Math.random() * 6, renk: renk[i % renk.length], omur: 4.5, tip: 'k' });
  }
  havaiFisek(isim) {
    const x = 120 + Math.random() * 480, y = SAHNE_UST + 60 + Math.random() * 120;
    const renk = ['#ffcf6b', '#ff7b9c', '#7fd8ff', '#b3ff8a'][Math.floor(Math.random() * 4)];
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, v = 120 + Math.random() * 90; this.parcacik.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2.6, renk, omur: 1.6, tip: 'h' }); }
    if (isim) this.fenerler.push({ ad: isim, x, bas: performance.now(), yazi: true, y });
  }

  // ───────────── ANA ÇİZİM ─────────────
  ciz() {
    const c = this.c, t = performance.now();
    c.setTransform(this.olcek, 0, 0, this.olcek, 0, 0);
    c.fillStyle = '#05060c'; c.fillRect(0, 0, W, H);
    const d = this.d;
    if (!d) { yaz(c, 'Bağlanıyor...', W / 2, H / 2, `600 34px ${F}`, '#fff', 'center'); return; }
    const faz = d.faz.ad, fz = t - this.fazBas, kalan = this.kalanMs();
    const dt = Math.min(0.05, (t - (this.sonT || t)) / 1000); this.sonT = t;

    // gün/gece
    const hedef = { bekleme: 0.6, gece: 1, sabah: 0.12, sorgu: 0, oylama: 0.18, kilit: 0.4, aksam: 0.78, final: d.final?.kazanan === 'vampir' ? 1 : 0 }[faz] ?? 0.5;
    this.karanlik = lerp(this.karanlik, hedef, 1 - Math.pow(0.25, dt));
    const kh = faz === 'final' && d.final?.kazanan === 'vampir' ? 1 : faz === 'gece' || faz === 'aksam' ? 0.25 : 0;
    this.kirmizi = lerp(this.kirmizi, kh, 1 - Math.pow(0.3, dt));

    c.save();
    if (this.sarsinti) {
      const p = (t - this.sarsinti.bas) / this.sarsinti.sure;
      if (p < 1) { const g = this.sarsinti.guc * (1 - p); c.translate((Math.random() - 0.5) * g, (Math.random() - 0.5) * g); } else this.sarsinti = null;
    }
    this.sahne(t, d, faz, fz);
    c.restore();

    this.fazKatmani(t, d, faz, fz, kalan);
    this.ust(t, d, faz, kalan);
    if (faz !== 'sorgu' && faz !== 'oylama') this.konusmaPaneli(t, d, faz);
    if (faz === 'oylama' || faz === 'kilit') this.oyPanosu(t, d, faz); else this.ipucuPanosu(t, d, faz);
    this.koyluSeridi(t, d);
    this.alt(t, d, faz, kalan);
    if (['sorgu', 'oylama', 'gece'].includes(faz)) this.bildirimCiz(t);
    if (faz === 'bekleme') this.lobi(t, d, kalan);
    if (faz === 'final') this.finalCiz(t, d, fz);
    if (this.flas) {
      const p = (t - this.flas.bas) / this.flas.sure;
      if (p < 1) { c.fillStyle = `rgba(${this.flas.renk},${0.55 * (1 - p)})`; c.fillRect(0, 0, W, H); } else this.flas = null;
    }
    this.parcacikCiz(dt);
    if (faz === 'sorgu' || faz === 'oylama') this.konusmaPaneli(t, d, faz);
  }

  // ───────────── SAHNE ─────────────
  sahne(t, d, faz, fz) {
    const c = this.c, k = this.karanlik;
    c.save();
    c.beginPath(); c.rect(0, SAHNE_UST, W, SAHNE_ALT - SAHNE_UST); c.clip();
    // gökyüzü
    const g = c.createLinearGradient(0, SAHNE_UST, 0, 470);
    const gUst = karis(karis('#7fc6f2', '#070b1f', k), '#2a0610', this.kirmizi * k);
    const gAlt = karis(karis('#ffe2b0', '#2d1f52', k), '#5a0f1e', this.kirmizi * k);
    g.addColorStop(0, gUst); g.addColorStop(1, gAlt);
    c.fillStyle = g; c.fillRect(0, SAHNE_UST, W, SAHNE_ALT - SAHNE_UST);
    // yıldızlar
    if (k > 0.3) for (const y of this.yildiz) { c.globalAlpha = (k - 0.3) * (0.6 + 0.4 * Math.sin(t / 600 + y.f)); c.fillStyle = '#fff'; c.beginPath(); c.arc(y.x, y.y, y.r, 0, 7); c.fill(); }
    c.globalAlpha = 1;
    // ay / güneş
    const ayX = 560, ayY = lerp(330, 190, k);
    if (k > 0.35) {
      c.save(); c.globalAlpha = kis((k - 0.35) * 2);
      const kirmiziAy = this.kirmizi > 0.5;
      c.shadowColor = kirmiziAy ? '#ff3b3b' : '#fff3c4'; c.shadowBlur = 40;
      c.fillStyle = kirmiziAy ? '#d8343f' : '#f6ecc9'; c.beginPath(); c.arc(ayX, ayY, 42, 0, 7); c.fill();
      c.shadowBlur = 0; c.fillStyle = 'rgba(0,0,0,0.08)';
      for (const [x, y, r] of [[-12, -8, 9], [10, 10, 7], [14, -14, 5]]) { c.beginPath(); c.arc(ayX + x, ayY + y, r, 0, 7); c.fill(); }
      c.restore();
    }
    if (k < 0.65) {
      c.save(); c.globalAlpha = kis((0.65 - k) * 2);
      const gy = lerp(190, 360, k / 0.65);
      c.shadowColor = '#ffd27a'; c.shadowBlur = 50; c.fillStyle = '#ffd56b'; c.beginPath(); c.arc(170, gy, 38, 0, 7); c.fill();
      c.restore();
    }
    // tepeler
    c.fillStyle = karis('#7fae6a', '#18203a', k);
    c.beginPath(); c.moveTo(0, 410); c.bezierCurveTo(140, 330, 260, 360, 380, 395); c.bezierCurveTo(500, 350, 620, 330, 720, 380); c.lineTo(720, 660); c.lineTo(0, 660); c.fill();
    c.fillStyle = karis('#5d9450', '#121a30', k);
    c.beginPath(); c.moveTo(0, 450); c.bezierCurveTo(180, 400, 330, 430, 470, 440); c.bezierCurveTo(580, 420, 660, 430, 720, 445); c.lineTo(720, 660); c.lineTo(0, 660); c.fill();
    // evler
    const kurbanlar = new Set();
    if (d.sabah?.kurban) kurbanlar.add(d.sabah.kurban);
    for (const e of this.evler) this.ev(e, k, t, kurbanlar.has(e.ad));
    // saat kulesi
    this.kule(t, k);
    // meydan
    const mg = c.createLinearGradient(0, 470, 0, 660);
    mg.addColorStop(0, karis('#c9a774', '#2a2740', k)); mg.addColorStop(1, karis('#a8865a', '#1b1a2c', k));
    c.fillStyle = mg; c.beginPath(); c.ellipse(W / 2, 640, 430, 150, 0, Math.PI, 0); c.fill();
    c.strokeStyle = karis('#b8955f', '#24223a', k); c.lineWidth = 2;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(W / 2, 650, 120 + i * 70, 40 + i * 22, 0, Math.PI, 0); c.stroke(); }
    // fenerler (direk)
    for (const x of [24, 696]) this.direk(x, 600, k);
    // sis
    if (k > 0.5) {
      c.save(); c.globalAlpha = (k - 0.5) * 0.5;
      for (let i = 0; i < 5; i++) { const x = ((t / 40 + i * 190) % 900) - 90; c.fillStyle = 'rgba(180,190,230,0.25)'; c.beginPath(); c.ellipse(x, 560 + (i % 2) * 30, 160, 26, 0, 0, 7); c.fill(); }
      c.restore();
    }
    // karakterler
    this.karakterler(t, d, faz, fz);
    // kırmızı gözler (gece)
    if (faz === 'gece' || (faz === 'final' && d.final?.kazanan === 'vampir')) {
      const kirp = Math.sin(t / 900) > -0.85 ? 1 : 0.1;
      c.save(); c.fillStyle = '#ff2b3b'; c.shadowColor = '#ff2b3b'; c.shadowBlur = 16;
      const ex = 360 + Math.sin(t / 1700) * 160, ey = 300;
      c.beginPath(); c.ellipse(ex - 13, ey, 7, 4 * kirp, 0, 0, 7); c.ellipse(ex + 13, ey, 7, 4 * kirp, 0, 0, 7); c.fill();
      c.restore();
    }
    // yarasalar
    this.yarasalar = this.yarasalar.filter(b => b.x < W + 60);
    const dtb = 1 / 60;
    for (const b of this.yarasalar) { b.x += b.v * dtb; b.y += Math.sin(t / 200 + b.f) * 0.8; this.yarasa(b.x, b.y, b.s, t / 70 + b.f); }
    if ((faz === 'gece' || faz === 'aksam') && this.yarasalar.length < 3 && Math.random() < 0.02) this.yarasaSal(1);
    // fener / havai fişek isimleri
    this.fenerler = this.fenerler.filter(f => t - f.bas < 6000);
    for (const f of this.fenerler) {
      const p = (t - f.bas) / 6000;
      if (f.yazi) { c.globalAlpha = 1 - p; yaz(c, '✨ ' + f.ad, f.x, f.y + 90, `800 26px ${F}`, '#fff', 'center', 8); c.globalAlpha = 1; continue; }
      const y = 600 - p * 460, x = f.x + Math.sin(t / 500 + f.x) * 12;
      c.globalAlpha = p > 0.8 ? (1 - p) * 5 : 1;
      c.save(); c.shadowColor = '#ffb547'; c.shadowBlur = 24; c.fillStyle = '#ffb547'; rr(c, x - 12, y - 16, 24, 30, 8); c.fill(); c.restore();
      c.fillStyle = '#c0392b'; c.fillRect(x - 13, y - 18, 26, 4); c.fillRect(x - 13, y + 12, 26, 4);
      yaz(c, f.ad, x, y + 36, `700 18px ${F}`, '#fff', 'center', 6);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  ev(e, k, t, kurban) {
    const c = this.c, { x, y, w } = e, h = 46;
    c.fillStyle = karis('#e8d2a8', '#2b2a44', k); c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = karis(e.cati, '#1d1a2e', k * 0.8);
    c.beginPath(); c.moveTo(x - w / 2 - 6, y - h); c.lineTo(x, y - h - 28); c.lineTo(x + w / 2 + 6, y - h); c.fill();
    const isik = k > 0.45 && !kurban;
    c.fillStyle = isik ? '#ffcf6b' : karis('#6b8fb5', '#141428', k);
    if (isik) { c.save(); c.shadowColor = '#ffb547'; c.shadowBlur = 14; }
    c.fillRect(x - w / 4 - 7, y - h + 12, 14, 14); c.fillRect(x + w / 4 - 7, y - h + 12, 14, 14);
    if (isik) c.restore();
    c.fillStyle = karis('#7a5230', '#15131f', k); c.fillRect(x - 7, y - 20, 14, 20);
    if (kurban) { c.fillStyle = '#ff3b4b'; c.font = `20px ${F}`; c.textAlign = 'center'; c.fillText('🦇', x, y - h - 30); }
  }

  kule(t, k) {
    const c = this.c, x = 30, y = 470;
    c.fillStyle = karis('#b9a07a', '#2c2840', k); c.fillRect(x, y - 300, 86, 300);
    c.fillStyle = karis('#8c3b2e', '#1d1a2e', k);
    c.beginPath(); c.moveTo(x - 8, y - 300); c.lineTo(x + 43, y - 360); c.lineTo(x + 94, y - 300); c.fill();
    c.fillStyle = karis('#fff6e0', '#d9d2b8', k); c.beginPath(); c.arc(x + 43, y - 250, 28, 0, 7); c.fill();
    c.strokeStyle = '#3b2a1a'; c.lineWidth = 3; c.beginPath(); c.arc(x + 43, y - 250, 28, 0, 7); c.stroke();
    const sa = t / 9000, dk = t / 750;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 43, y - 250); c.lineTo(x + 43 + Math.sin(sa) * 14, y - 250 - Math.cos(sa) * 14); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(x + 43, y - 250); c.lineTo(x + 43 + Math.sin(dk) * 22, y - 250 - Math.cos(dk) * 22); c.stroke();
    c.fillStyle = karis('#5b4a36', '#0f0e18', k); rr(c, x + 25, y - 190, 36, 50, 18); c.fill();
    c.fillStyle = karis('#7a5230', '#15131f', k); rr(c, x + 25, y - 60, 36, 60, 16); c.fill();
  }

  direk(x, y, k) {
    const c = this.c;
    c.fillStyle = '#2a2a2a'; c.fillRect(x - 3, y - 150, 6, 150);
    const fen = this.d?.fener ? this.d.fener.deger / this.d.fener.hedef : 0;
    c.save();
    if (k > 0.3) { c.shadowColor = '#ffb547'; c.shadowBlur = 20 + fen * 30; }
    c.fillStyle = k > 0.3 ? `rgba(255,${180 + fen * 60},90,1)` : '#d9b36a';
    rr(c, x - 10, y - 178, 20, 28, 6); c.fill(); c.restore();
  }

  yarasa(x, y, s, f) {
    const c = this.c, kanat = Math.sin(f) * 10 * s;
    c.fillStyle = '#0b0b12';
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x - 14 * s, y - 10 * s - kanat, x - 26 * s, y - 2 * s + kanat * 0.3);
    c.quadraticCurveTo(x - 14 * s, y + 2 * s, x, y + 6 * s);
    c.quadraticCurveTo(x + 14 * s, y + 2 * s, x + 26 * s, y - 2 * s + kanat * 0.3);
    c.quadraticCurveTo(x + 14 * s, y - 10 * s - kanat, x, y);
    c.fill();
  }

  // ───────────── KARAKTERLER ─────────────
  karakterler(t, d, faz, fz) {
    const c = this.c, k = this.karanlik;
    const oy = d.oy;
    const lider = oy && oy.en > 0 && oy.liderler.length === 1 ? oy.liderler[0] : null;
    for (const kd of d.karakterler) {
      const i = kd.no - 1, x = SLOT_X[i];
      const konusan = this.konusma && this.konusma.kim === kd.id && performance.now() - this.konusma.bas < this.konusma.sure;
      if (kd.durum === 'suruldu' && faz !== 'final') {
        c.save(); c.globalAlpha = 0.5;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, AYAK_Y, 34, 9, 0, 0, 7); c.fill();
        c.restore();
        c.save(); c.translate(x, AYAK_Y - 70); c.rotate(-0.12);
        rr(c, -50, -16, 100, 32, 6); c.fillStyle = 'rgba(80,20,25,0.85)'; c.fill();
        c.strokeStyle = '#ff6b6b'; c.lineWidth = 2; c.stroke();
        yaz(c, 'SÜRÜLDÜ', 0, 7, `900 18px ${F}`, '#ffb3b3', 'center');
        c.restore();
        this.isimEtiketi(x, kd, false, k, true);
        continue;
      }
      if (kd.durum === 'kilitli' && (faz === 'kilit' || faz === 'aksam')) { this.isimEtiketi(x, kd, false, k, true); continue; }
      const bob = Math.sin(t / 420 + i) * 2 + (konusan ? Math.abs(Math.sin(t / 110)) * 5 : 0);
      const titre = (faz === 'oylama' && lider === kd.id) ? Math.sin(t / 40) * 1.6 : 0;
      if (konusan) {
        c.save(); c.globalAlpha = 0.55 + Math.sin(t / 150) * 0.2;
        const rg = c.createRadialGradient(x, AYAK_Y, 4, x, AYAK_Y, 60);
        rg.addColorStop(0, AD_RENK[kd.id]); rg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = rg; c.beginPath(); c.ellipse(x, AYAK_Y, 64, 18, 0, 0, 7); c.fill(); c.restore();
      }
      const vampir = faz === 'final' && d.final && d.final.vampirId === kd.id;
      const konus = konusan ? Math.abs(Math.sin(t / 85)) : 0;
      this.karakter(kd.id, x + titre, AYAK_Y - bob, 0.92, { konus, karanlik: k * 0.55, vampir, solgun: kd.durum === 'suruldu' });
      // numara rozeti
      const by = AYAK_Y - 192;
      const oySay = oy ? oy.say[kd.id] || 0 : null;
      c.save();
      if (faz === 'oylama') { c.shadowColor = lider === kd.id ? '#ff3b4b' : '#ffcf6b'; c.shadowBlur = 14 + Math.sin(t / 200) * 6; }
      c.fillStyle = lider === kd.id && faz === 'oylama' ? '#d6384b' : '#1d1b2c';
      c.beginPath(); c.arc(x, by, 21, 0, 7); c.fill();
      c.lineWidth = 3; c.strokeStyle = faz === 'oylama' ? '#ffcf6b' : 'rgba(255,255,255,0.6)'; c.stroke();
      c.restore();
      yaz(c, String(kd.no), x, by + 9, `900 25px ${F}`, '#fff', 'center');
      if (oySay !== null && (faz === 'oylama' || faz === 'kilit')) {
        rr(c, x + 12, by - 32, 40, 24, 12); c.fillStyle = '#ffcf6b'; c.fill();
        yaz(c, String(oySay), x + 32, by - 14, `900 17px ${F}`, '#2b1a00', 'center');
      }
      if (faz === 'oylama' && lider === kd.id) yaz(c, 'ÖNDE', x, by - 30, `900 16px ${F}`, '#ff6b78', 'center', 6);
      if (faz === 'final' && d.final) {
        const v = d.final.vampirId === kd.id;
        rr(c, x - 44, AYAK_Y - 232, 88, 24, 12); c.fillStyle = v ? '#d6384b' : 'rgba(40,120,70,0.9)'; c.fill();
        yaz(c, v ? 'VAMPİR' : 'MASUM', x, AYAK_Y - 214, `900 15px ${F}`, '#fff', 'center');
      }
      this.isimEtiketi(x, kd, konusan, k, false);
    }
  }

  isimEtiketi(x, kd, konusan, k, soluk) {
    const c = this.c;
    c.save(); if (soluk) c.globalAlpha = 0.5;
    c.font = `800 18px ${F}`;
    const w = Math.max(84, c.measureText(kd.kisa).width + 26);
    rr(c, x - w / 2, AYAK_Y + 10, w, 30, 15);
    c.fillStyle = konusan ? AD_RENK[kd.id] : 'rgba(15,14,26,0.85)'; c.fill();
    yaz(c, kd.kisa, x, AYAK_Y + 31, `800 18px ${F}`, konusan ? '#1a1a1a' : '#fff', 'center');
    c.restore();
  }

  // id, x (orta), y (ayak), s (ölçek), o {konus, karanlik, vampir, solgun, kafes}
  karakter(id, x, y, s, o = {}) {
    const c = this.c, r = RENK[id];
    c.save(); c.translate(x, y); c.scale(s, s);
    if (o.solgun) c.globalAlpha = 0.35;
    const golge = (renk) => o.karanlik ? karis(renk, '#10101c', o.karanlik) : renk;
    const iri = id === 'demirci' ? 1.22 : 1, ince = id === 'ogretmen' ? 0.92 : 1;
    const bw = 62 * iri * ince;
    // gölge
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 0, 38 * iri, 9, 0, 0, 7); c.fill();
    // pelerin (vampir)
    if (o.vampir) {
      c.fillStyle = '#1a0b10';
      c.beginPath(); c.moveTo(-bw / 2 - 18, -4); c.lineTo(-bw / 2 + 2, -122); c.lineTo(-34, -168); c.lineTo(0, -132); c.lineTo(34, -168); c.lineTo(bw / 2 - 2, -122); c.lineTo(bw / 2 + 18, -4); c.closePath(); c.fill();
      c.fillStyle = '#8b0f22'; c.beginPath(); c.moveTo(-bw / 2 + 6, -10); c.lineTo(-bw / 2 + 10, -118); c.lineTo(bw / 2 - 10, -118); c.lineTo(bw / 2 - 6, -10); c.fill();
    }
    // bacaklar
    c.fillStyle = golge('#2d2a35');
    rr(c, -16, -36, 13, 34, 5); c.fill(); rr(c, 3, -36, 13, 34, 5); c.fill();
    c.fillStyle = golge('#1a1716'); c.beginPath(); c.ellipse(-10, -2, 11, 5, 0, 0, 7); c.ellipse(10, -2, 11, 5, 0, 0, 7); c.fill();
    // gövde
    const gv = golge(r.govde);
    if (id === 'ebe') {
      c.fillStyle = gv; c.beginPath(); c.moveTo(-28, -112); c.lineTo(28, -112); c.lineTo(40, -26); c.lineTo(-40, -26); c.closePath(); c.fill();
    } else if (id === 'coban') {
      c.fillStyle = gv; c.beginPath(); c.moveTo(-40, -116); c.lineTo(40, -116); c.lineTo(34, -28); c.lineTo(-34, -28); c.closePath(); c.fill();
      c.strokeStyle = golge('#6d532d'); c.lineWidth = 3; for (let i = -24; i <= 24; i += 12) { c.beginPath(); c.moveTo(i, -110); c.lineTo(i * 1.1, -34); c.stroke(); }
    } else { c.fillStyle = gv; rr(c, -bw / 2, -116, bw, 86, 16); c.fill(); }
    // kıyafet detay
    if (id === 'muhtar') {
      c.fillStyle = golge('#f4efe6'); c.beginPath(); c.moveTo(-10, -116); c.lineTo(0, -88); c.lineTo(10, -116); c.fill();
      c.fillStyle = golge('#a3272b'); c.beginPath(); c.moveTo(-3, -110); c.lineTo(3, -110); c.lineTo(4, -86); c.lineTo(0, -80); c.lineTo(-4, -86); c.fill();
      c.strokeStyle = golge('#e9c25a'); c.lineWidth = 2.5; c.beginPath(); c.arc(-8, -78, 14, 0.2, 2.6); c.stroke();
    }
    if (id === 'bakkal') {
      c.fillStyle = golge('#f4f1ea'); rr(c, -22, -100, 44, 68, 8); c.fill();
      c.strokeStyle = golge('#f4f1ea'); c.lineWidth = 4; c.beginPath(); c.moveTo(-18, -100); c.lineTo(-12, -116); c.moveTo(18, -100); c.lineTo(12, -116); c.stroke();
    }
    if (id === 'ogretmen') {
      c.fillStyle = golge('#f4efe6'); c.beginPath(); c.moveTo(-9, -116); c.lineTo(0, -96); c.lineTo(9, -116); c.fill();
      c.fillStyle = golge('#2f6b45'); for (const yy of [-96, -82, -68, -54]) { c.beginPath(); c.arc(0, yy, 2.4, 0, 7); c.fill(); }
    }
    if (id === 'demirci') {
      c.fillStyle = golge('#3b2a20'); rr(c, -28, -104, 56, 76, 8); c.fill();
      c.strokeStyle = golge('#3b2a20'); c.lineWidth = 4; c.beginPath(); c.moveTo(-24, -104); c.lineTo(-30, -118); c.moveTo(24, -104); c.lineTo(30, -118); c.stroke();
    }
    if (id === 'ebe') { c.fillStyle = golge('#f3e6c8'); rr(c, -16, -94, 32, 50, 6); c.fill(); }
    // kollar
    c.fillStyle = gv;
    const kolSalla = o.konus ? Math.sin(performance.now() / 160) * 0.25 : 0;
    c.save(); c.translate(-bw / 2 + 2, -108); c.rotate(0.18 + kolSalla); rr(c, -8, 0, 15, 60, 7); c.fill(); c.fillStyle = golge(r.ten); c.beginPath(); c.arc(0, 62, 8, 0, 7); c.fill(); c.restore();
    c.save(); c.translate(bw / 2 - 2, -108); c.rotate(-0.18 - kolSalla * 0.6); c.fillStyle = gv; rr(c, -7, 0, 15, 60, 7); c.fill(); c.fillStyle = golge(r.ten); c.beginPath(); c.arc(0, 62, 8, 0, 7); c.fill();
    // el aksesuarı
    if (id === 'coban') { c.strokeStyle = golge('#6d4a25'); c.lineWidth = 5; c.beginPath(); c.moveTo(2, 100); c.lineTo(2, -60); c.arc(-10, -60, 12, 0, Math.PI, true); c.stroke(); }
    if (id === 'ogretmen') { c.fillStyle = golge('#b53a3a'); rr(c, -12, 52, 22, 28, 3); c.fill(); c.fillStyle = golge('#f3efe2'); c.fillRect(-10, 55, 3, 22); }
    if (id === 'demirci') { c.fillStyle = golge('#6d4a25'); c.fillRect(-2, 50, 6, 40); c.fillStyle = golge('#8d939b'); rr(c, -12, 84, 26, 14, 3); c.fill(); }
    c.restore();
    // baş
    const ten = golge(r.ten), hy = -142;
    c.fillStyle = ten; c.fillRect(-7, -124, 14, 10);
    c.beginPath(); c.arc(0, hy, 27, 0, 7); c.fill();
    c.beginPath(); c.arc(-26, hy, 6, 0, 7); c.arc(26, hy, 6, 0, 7); c.fill();
    // saç / şapka
    if (id === 'muhtar') {
      c.fillStyle = golge('#3b3b44'); c.beginPath(); c.ellipse(0, hy - 20, 30, 12, 0, Math.PI, 0); c.fill(); rr(c, -32, hy - 22, 66, 8, 4); c.fill();
      c.fillStyle = golge('#1d1b1b'); c.beginPath(); c.ellipse(-9, hy + 9, 11, 4.5, 0.25, 0, 7); c.ellipse(9, hy + 9, 11, 4.5, -0.25, 0, 7); c.fill();
    }
    if (id === 'bakkal') {
      c.fillStyle = golge('#3a2a1e'); c.beginPath(); c.ellipse(-24, hy - 6, 6, 10, 0, 0, 7); c.ellipse(24, hy - 6, 6, 10, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(0, hy + 9, 12, 4, 0, 0, 7); c.fill();
      c.strokeStyle = golge('#f1c40f'); c.lineWidth = 3; c.beginPath(); c.moveTo(22, hy - 18); c.lineTo(34, hy - 4); c.stroke();
    }
    if (id === 'ebe') {
      c.fillStyle = golge('#c0392b'); c.beginPath(); c.arc(0, hy - 2, 31, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(30, hy + 18); c.quadraticCurveTo(0, hy + 30, -30, hy + 18); c.closePath();
      c.save(); c.clip(); c.fillRect(-40, hy - 40, 80, 80);
      c.fillStyle = golge('#ffffff'); for (let a = 0; a < 18; a++) { c.beginPath(); c.arc(-28 + (a % 6) * 11, hy - 26 + Math.floor(a / 6) * 9, 1.8, 0, 7); c.fill(); }
      c.restore();
      c.fillStyle = ten; c.beginPath(); c.ellipse(0, hy + 3, 21, 22, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(230,110,110,0.35)'; c.beginPath(); c.arc(-12, hy + 8, 5, 0, 7); c.arc(12, hy + 8, 5, 0, 7); c.fill();
    }
    if (id === 'coban') {
      c.fillStyle = golge('#3a2412'); c.beginPath(); c.arc(0, hy - 6, 27, Math.PI, 0); c.fill();
      for (let i = -20; i <= 20; i += 8) { c.beginPath(); c.arc(i, hy - 24, 6, 0, 7); c.fill(); }
      c.fillStyle = golge('#5c4325'); c.beginPath(); c.ellipse(0, hy - 24, 40, 8, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(0, hy - 30, 22, 12, 0, Math.PI, 0); c.fill();
    }
    if (id === 'ogretmen') {
      c.fillStyle = golge('#5a3620'); c.beginPath(); c.arc(0, hy - 4, 28, Math.PI * 1.05, Math.PI * 1.95); c.fill();
      c.beginPath(); c.arc(0, hy - 32, 11, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-27, hy - 6); c.quadraticCurveTo(-32, hy + 16, -22, hy + 22); c.lineTo(-20, hy); c.fill();
      c.beginPath(); c.moveTo(27, hy - 6); c.quadraticCurveTo(32, hy + 16, 22, hy + 22); c.lineTo(20, hy); c.fill();
    }
    if (id === 'demirci') {
      c.fillStyle = golge('#3b2414'); c.beginPath(); c.moveTo(-26, hy + 2); c.quadraticCurveTo(-24, hy + 40, 0, hy + 42); c.quadraticCurveTo(24, hy + 40, 26, hy + 2); c.quadraticCurveTo(0, hy + 18, -26, hy + 2); c.fill();
    }
    // gözler
    const ey = hy - 3;
    if (o.vampir) {
      c.save(); c.fillStyle = '#ff2b3b'; c.shadowColor = '#ff2b3b'; c.shadowBlur = 12;
      c.beginPath(); c.ellipse(-9, ey, 4.5, 3, 0, 0, 7); c.ellipse(9, ey, 4.5, 3, 0, 0, 7); c.fill(); c.restore();
    } else {
      const kirp = (Math.sin(performance.now() / 1300 + x) > 0.97) ? 0.2 : 1;
      c.fillStyle = '#1b1414'; c.beginPath(); c.ellipse(-9, ey, 3.4, 3.6 * kirp, 0, 0, 7); c.ellipse(9, ey, 3.4, 3.6 * kirp, 0, 0, 7); c.fill();
    }
    c.strokeStyle = golge('#3a2a1e'); c.lineWidth = 2.4;
    const kas = o.konus && o.konus > 0.5 ? -2 : 0;
    c.beginPath(); c.moveTo(-14, ey - 8 + kas); c.lineTo(-5, ey - 9); c.moveTo(14, ey - 8 + kas); c.lineTo(5, ey - 9); c.stroke();
    if (id === 'ogretmen') { c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.arc(-9, ey, 7, 0, 7); c.moveTo(16, ey); c.arc(9, ey, 7, 0, 7); c.moveTo(-2, ey); c.lineTo(2, ey); c.stroke(); }
    // ağız
    const my = hy + (id === 'muhtar' || id === 'bakkal' ? 15 : 12);
    c.fillStyle = '#5a1f1f';
    if (o.konus) { c.beginPath(); c.ellipse(0, my, 6, 1.5 + o.konus * 5, 0, 0, 7); c.fill(); }
    else { c.strokeStyle = '#5a1f1f'; c.lineWidth = 2; c.beginPath(); c.arc(0, my - 4, 6, 0.3, Math.PI - 0.3); c.stroke(); }
    if (o.vampir) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-5, my - 1); c.lineTo(-3, my + 6); c.lineTo(-1, my - 1); c.moveTo(1, my - 1); c.lineTo(3, my + 6); c.lineTo(5, my - 1); c.fill(); }
    // kafes
    if (o.kafes) {
      c.strokeStyle = '#8d939b'; c.lineWidth = 6;
      for (let i = -48; i <= 48; i += 16) { c.beginPath(); c.moveTo(i, 6); c.lineTo(i, -186); c.stroke(); }
      c.lineWidth = 9; c.beginPath(); c.moveTo(-56, -186); c.lineTo(56, -186); c.moveTo(-56, 6); c.lineTo(56, 6); c.stroke();
    }
    c.restore();
  }

  // ───────────── FAZ KATMANLARI (sahne üstü) ─────────────
  fazKatmani(t, d, faz, fz, kalan) {
    const c = this.c;
    if (faz === 'gece') {
      c.fillStyle = 'rgba(5,5,20,0.35)'; c.fillRect(0, SAHNE_UST, W, SAHNE_ALT - SAHNE_UST);
      const a = kis(fz / 800);
      c.globalAlpha = a;
      yaz(c, '🌙 GECE', W / 2, 250, `900 72px ${B}`, '#f6ecc9', 'center', 20);
      yaz(c, d.gece <= 1 ? 'Olay gecesine dönüyoruz…' : 'Vampir hâlâ köyde mi?', W / 2, 300, `italic 600 30px ${B}`, '#d9c9ff', 'center', 10);
      if (d.gece === 1 && d.incelemeSonuc) {
        yaz(c, d.incelemeSonuc.karar, W / 2, 375, `900 24px ${F}`, '#ffcf6b', 'center');
        c.font = `700 26px ${F}`;
        sar(c, d.incelemeSonuc.metin, W - 120).forEach((l, i) => yaz(c, l, W / 2, 419 + 34 * i, c.font, '#fff', 'center', 6));
      }
      c.globalAlpha = 1;
    }
    if (faz === 'sabah' && d.sabah) this.sabahKarti(t, d, fz);
    if (faz === 'kilit' && d.kilitli) {
      c.fillStyle = 'rgba(10,8,20,0.55)'; c.fillRect(0, SAHNE_UST, W, SAHNE_ALT - SAHNE_UST);
      const dus = kis(fz / 500);
      const k = KISA[d.kilitli];
      const konus = this.konusma && this.konusma.kim === d.kilitli && t - this.konusma.bas < this.konusma.sure ? Math.abs(Math.sin(t / 85)) : 0;
      this.karakter(d.kilitli, W / 2, 600, 1.55, { konus, kafes: false });
      c.save(); c.translate(W / 2, 600); c.scale(1.55, 1.55); c.translate(0, -300 * (1 - dus));
      c.strokeStyle = '#9aa1a9'; c.lineWidth = 6;
      for (let i = -56; i <= 56; i += 16) { c.beginPath(); c.moveTo(i, 8); c.lineTo(i, -196); c.stroke(); }
      c.lineWidth = 10; c.beginPath(); c.moveTo(-64, -196); c.lineTo(64, -196); c.moveTo(-64, 8); c.lineTo(64, 8); c.stroke();
      c.restore();
      yaz(c, '🔒 KULEYE KİLİTLENDİ', W / 2, 172, `900 40px ${F}`, '#ffcf6b', 'center', 12);
      yaz(c, `${k.ad} · ${d.kilitOy} oy`, W / 2, 212, `700 28px ${F}`, '#fff', 'center', 8);
    }
    if (faz === 'kilit' && !d.kilitli) {
      yaz(c, 'Köy karar veremedi...', W / 2, 260, `900 44px ${B}`, '#ffb3b3', 'center', 14);
    }
    if (faz === 'aksam') {
      c.fillStyle = 'rgba(20,6,20,0.35)'; c.fillRect(0, SAHNE_UST, W, SAHNE_ALT - SAHNE_UST);
      if (d.aksamSurulen) {
        const p = kis(fz / 7000);
        const x = lerp(W / 2, W + 120, p * p);
        this.karakter(d.aksamSurulen, x, 600, 1.2, { karanlik: 0.4 });
        yaz(c, `🚪 ${KISA[d.aksamSurulen].ad} köyden sürüldü`, W / 2, 180, `800 32px ${F}`, '#fff', 'center', 10);
      }
      const nab = 1 + Math.sin(t / 260) * 0.05;
      c.save(); c.translate(W / 2, 290); c.scale(nab, nab);
      yaz(c, 'VAMPİR HÂLÂ', 0, 0, `900 64px ${B}`, '#ff4b5c', 'center', 24);
      yaz(c, 'KÖYDE Mİ?', 0, 66, `900 64px ${B}`, '#ff4b5c', 'center', 24);
      c.restore();
    }
  }

  sabahKarti(t, d, fz) {
    const c = this.c, s = d.sabah;
    const kirmizi = s.acildi && s.sonuc !== 'sessiz';
    const y0 = 140, h = 300;
    c.save(); c.globalAlpha = kis(fz / 500);
    rr(c, 40, y0, W - 80, h, 26);
    c.fillStyle = kirmizi ? 'rgba(40,6,14,0.94)' : 'rgba(20,30,50,0.93)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = kirmizi ? '#ff4b5c' : '#ffcf6b'; c.stroke();
    if (!s.acildi) {
      yaz(c, '☀️ SABAH OLDU', W / 2, y0 + 70, `900 46px ${B}`, '#ffe08a', 'center', 10);
      yaz(c, 'Kimse ısırılmamış...', W / 2, y0 + 140, `800 38px ${F}`, '#fff', 'center');
      yaz(c, s.gunes ? 'VAMPİR GİTTİ!' : 'Vampiri yakaladık mı?', W / 2, y0 + 200, `italic 700 32px ${B}`, s.gunes ? '#8fe08f' : '#d9c9ff', 'center');
    } else {
      const can = s.sonuc === 'sahte';
      yaz(c, can ? '🔔 ÇAN ÇALIYOR!' : d.gece <= 1 ? '☀️ İLK SABAH' : '☀️ SABAH OLDU', W / 2, y0 + 64, `900 46px ${B}`, can ? '#ff6b78' : '#ffe08a', 'center', 10);
      c.font = `800 36px ${F}`;
      const sat = sar(c, `🦇 ${s.kurban} ısırıldı!`, W - 140);
      sat.forEach((l, i) => yaz(c, l, W / 2, y0 + 128 + i * 42, `800 36px ${F}`, '#fff', 'center'));
      let yy = y0 + 128 + sat.length * 42 + 6;
      if (d.gece > 1) { yaz(c, 'VAMPİR HÂLÂ KÖYDE!', W / 2, yy + 10, `900 34px ${B}`, '#ff4b5c', 'center', 10); yy += 46; }
      if (s.izleyiciKurban) yaz(c, `👻 ${s.izleyiciKurban} de ısırıldı!`, W / 2, yy + 8, `700 26px ${F}`, '#d9c9ff', 'center');
      else if (s.kilpayi) yaz(c, `🏮 Vampir ${s.kilpayi} kapısına geldi... fener yanıyordu!`, W / 2, yy + 8, `600 22px ${F}`, '#ffd99a', 'center');
    }
    c.restore();
  }

  // ───────────── ÜST BAR ─────────────
  ust(t, d, faz, kalan) {
    const c = this.c;
    const g = c.createLinearGradient(0, 0, 0, SAHNE_UST);
    g.addColorStop(0, '#0d0b18'); g.addColorStop(1, '#1c1430');
    c.fillStyle = g; c.fillRect(0, 0, W, SAHNE_UST);
    c.fillStyle = '#7a1b2b'; c.fillRect(0, SAHNE_UST - 4, W, 4);
    if (faz === 'oylama' && d.oy) return this.liderBandi(t, d);
    yaz(c, '🦇 VAMPİR KÖYLÜ', 24, 36, `900 22px ${F}`, '#ff6b78', 'left');
    yaz(c, d.senaryo.baslik, 24 + 210, 36, `italic 600 22px ${B}`, '#d9c9ff', 'left');
    const pencere = d.soruPenceresi;
    let sorguEtiketi = `${d.gun}. GÜN · SORGU`;
    if (pencere?.acik) sorguEtiketi = `SORU YAZ · ${Math.ceil(pencere.kalan / 1000)} sn`;
    else if (pencere?.secilen) sorguEtiketi = 'SEÇİLEN SORU · ' + KISA[pencere.secilen.hedef].kisa;
    const etiket = { bekleme: 'OLAY YERİ', gece: 'GECE', sabah: 'SABAH', sorgu: sorguEtiketi, kilit: 'KULE', aksam: 'AKŞAM', final: d.final?.kazanan === 'koy' ? 'KÖY KAZANDI' : 'VAMPİR KAZANDI' }[faz] || '';
    yaz(c, etiket, 24, 88, `900 40px ${F}`, '#fff', 'left');
    if (faz === 'bekleme' || (faz === 'sorgu' && !pencere?.acik)) {
      const sn = Math.ceil(kalan / 1000), p = kalan / d.faz.sure;
      c.save(); c.translate(W - 62, 58);
      c.lineWidth = 8; c.strokeStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.arc(0, 0, 36, 0, 7); c.stroke();
      c.strokeStyle = sn <= 10 ? '#ff4b5c' : '#ffcf6b'; c.beginPath(); c.arc(0, 0, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); c.stroke();
      yaz(c, String(sn), 0, 11, `900 30px ${F}`, '#fff', 'center');
      c.restore();
    }
    if (d.faz.duraklat) yaz(c, '⏸', W - 140, 70, `900 30px ${F}`, '#fff', 'center');
  }

  liderBandi(t, d) {
    const c = this.c, oy = d.oy;
    const tek = oy.en > 0 && oy.liderler.length === 1;
    const nab = 0.5 + Math.sin(t / 180) * 0.5;
    if (oy.en <= 0) {
      yaz(c, '🗳️ OYLAMA BAŞLADI', W / 2, 52, `900 40px ${F}`, '#ffcf6b', 'center', 8);
      yaz(c, 'Yoruma numara ya da isim yaz: 1 2 3 4 5 6', W / 2, 92, `700 24px ${F}`, '#fff', 'center');
      return;
    }
    const bg = c.createLinearGradient(0, 0, W, 0);
    bg.addColorStop(0, '#5a0f1e'); bg.addColorStop(0.5, `rgba(${170 + nab * 50},30,50,1)`); bg.addColorStop(1, '#5a0f1e');
    c.fillStyle = bg; c.fillRect(0, 0, W, SAHNE_UST - 4);
    if (tek) {
      const k = KISA[oy.liderler[0]];
      yaz(c, 'ÖNDE', 26, 44, `900 26px ${F}`, '#ffd0d5', 'left');
      yaz(c, `${k.no} · ${k.ad.toLocaleUpperCase('tr-TR')}`, 26, 94, `900 44px ${F}`, '#fff', 'left', 10);
      rr(c, W - 170, 22, 148, 70, 16); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill();
      yaz(c, `${oy.en}`, W - 128, 76, `900 48px ${F}`, '#ffcf6b', 'center');
      yaz(c, 'OY', W - 62, 72, `900 26px ${F}`, '#ffcf6b', 'center');
    } else {
      yaz(c, 'BERABERE!', 26, 50, `900 34px ${F}`, '#ffd0d5', 'left');
      yaz(c, oy.liderler.map(id => KISA[id].kisa).join(' · ') + `  (${oy.en} oy)`, 26, 94, `900 32px ${F}`, '#fff', 'left');
    }
  }

  // ───────────── KONUŞMA PANELİ ─────────────
  konusmaPaneli(t, d, faz) {
    const c = this.c, y0 = SAHNE_ALT + 6, h = 176;
    const k = this.konusma;
    const aktif = k && t - k.bas < k.sure + 1500;
    const vurgu = aktif ? AD_RENK[k.kim] || '#ffcf6b' : '#615977';
    rr(c, 14, y0, W - 28, h, 18);
    c.fillStyle = '#151322'; c.fill();
    c.lineWidth = aktif ? 3 : 2; c.strokeStyle = vurgu; c.stroke();
    if (aktif) {
      const x = 36, genislik = W - 2 * x;
      rr(c, x, y0 + 12, 6, 31, 3); c.fillStyle = vurgu; c.fill();
      const ad = k.kim === 'anlatici' ? 'Anlatıcı' : KISA[k.kim]?.ad || k.kim;
      yaz(c, ad, x + 17, y0 + 38, `800 29px ${F}`, vurgu);
      if (k.soru) {
        const soruX = x + 17 + c.measureText(ad).width + 24;
        const yer = W - x - soruX;
        c.font = `600 22px ${F}`;
        const soru = k.soru.ad + ' · ' + k.soru.metin.replace(/^[?¿]\s*/, '');
        let kisa = soru;
        while (kisa && c.measureText(kisa + '…').width > yer) kisa = kisa.slice(0, -1);
        c.save(); c.beginPath(); c.rect(soruX, y0 + 8, yer, 40); c.clip();
        yaz(c, kisa === soru ? soru : kisa.trimEnd() + '…', soruX, y0 + 37, c.font, '#d3d0e1');
        c.restore();
      }
      const font = `750 34px ${F}`;
      c.font = font;
      const satirlar = sar(c, k.metin, genislik);
      // Üç satırlık altyazı sayfalarını konuşma süresine, içerdikleri metin oranında dağıt.
      const harf = kis((t - k.bas) / Math.max(1, k.sure)) * satirlar.join(' ').length;
      let ilk = 0, bitis = 0;
      while (ilk + 3 < satirlar.length) {
        bitis += satirlar.slice(ilk, ilk + 3).join(' ').length + 1;
        if (harf < bitis) break;
        ilk += 3;
      }
      c.save(); c.beginPath(); c.rect(x, y0 + 47, genislik, h - 51); c.clip();
      satirlar.slice(ilk, ilk + 3).forEach((satir, i) => {
        yaz(c, satir, x, y0 + 83 + i * 40, font, '#fff');
      });
      c.restore();
    } else {
      const ipucu = {
        sorgu: d.soruPenceresi?.acik ? ['Sorunu yoruma yaz', '?Hasan dün gece neredeydin', 'Bir seyircinin sorusu seçilecek.'] : ['Soru alımı kapandı', 'İfadeleri dinle', 'Kimin sözü ipuçlarıyla çelişiyor?'],
        oylama: ['Oy ver:', 'Numara ya da isim yaz', 'Örnek: 3  ya da  Fatma'],
        bekleme: ['Araştırmaya katıl', 'Yoruma 1 veya 2 yaz', 'Son seçimin geçerli.'],
      }[faz];
      if (ipucu) {
        yaz(c, ipucu[0], 32, y0 + 52, `800 24px ${F}`, '#ffcf6b', 'left');
        yaz(c, ipucu[1], 32, y0 + 98, `900 34px ${F}`, '#fff', 'left');
        yaz(c, ipucu[2], 32, y0 + 140, `600 22px ${F}`, '#a9a3c9', 'left');
      } else yaz(c, '...', W / 2, y0 + 100, `900 34px ${F}`, '#666', 'center');
    }
  }

  // ───────────── İPUCU PANOSU ─────────────
  ipucuPanosu(t, d, faz) {
    const c = this.c, y0 = SAHNE_ALT + 190, h = 246;
    rr(c, 14, y0, W - 28, h, 18);
    const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#f3e4c2'); g.addColorStop(1, '#e2cc9d');
    c.fillStyle = g; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#8a6a3a'; c.stroke();
    if (d.inceleme?.tip === 'deney') {
      const kalan = Math.ceil(Math.max(0, Math.min(20000, d.faz.sure) - d.faz.gecen) / 1000);
      yaz(c, d.inceleme.soru, 34, y0 + 44, `900 29px ${F}`, '#462b1c');
      this.secimKutulari(d.inceleme, y0 + 67);
      yaz(c, `Yoruma A veya B yaz · ${kalan} sn`, 34, y0 + 225, `800 24px ${F}`, '#704320');
      return;
    }
    yaz(c, '📜 İPUÇLARI', 34, y0 + 38, `900 24px ${F}`, '#5a3a14', 'left');
    if (d.ipuclari.length === 0) { yaz(c, 'İlk kanıt seçtiğiniz yerden gelecek.', 34, y0 + 90, `italic 600 24px ${B}`, '#7a5a2a', 'left'); return; }
    // en yeni üstte
    const liste = d.ipuclari.slice().reverse();
    let yy = y0 + 72;
    const parla = this.ipucuParla && t - this.ipucuParla < 3000;
    for (let i = 0; i < liste.length && yy < y0 + h - 14; i++) {
      const ip = liste[i];
      const yeni = i === 0;
      c.font = `${yeni ? 800 : 600} ${yeni ? 22 : 19}px ${F}`;
      const sat = sar(c, ip.metin, W - 140);
      const kutuH = sat.length * (yeni ? 27 : 23) + 10;
      if (yeni) { rr(c, 26, yy - 24, W - 52, kutuH + 4, 10); c.fillStyle = parla ? `rgba(255,207,107,${0.5 + Math.sin(t / 120) * 0.3})` : 'rgba(255,255,255,0.35)'; c.fill(); }
      yaz(c, ip.inceleme ? '⌕' : ip.bonus ? '🏮' : `${ip.gun}.`, 40, yy, `900 ${yeni ? 22 : 19}px ${F}`, '#8a3a14', 'left');
      sat.forEach((l, j) => { if (yy + j * (yeni ? 27 : 23) < y0 + h - 8) yaz(c, l, 84, yy + j * (yeni ? 27 : 23), c.font, '#3b2a1a', 'left'); });
      yy += kutuH + 8;
    }
  }

  // ───────────── OY PANOSU ─────────────
  oyPanosu(t, d, faz) {
    const c = this.c, y0 = SAHNE_ALT + 190, h = 246, oy = d.oy;
    rr(c, 14, y0, W - 28, h, 18); c.fillStyle = 'rgba(22,10,22,0.94)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#d6384b'; c.stroke();
    if (!oy) return;
    const maks = Math.max(1, oy.en);
    const satirH = 30, x0 = 34;
    d.karakterler.forEach((k, i) => {
      const y = y0 + 22 + i * satirH;
      const n = oy.say[k.id];
      const hayatta = k.durum !== 'suruldu';
      const lider = oy.liderler.includes(k.id) && oy.en > 0;
      c.globalAlpha = hayatta ? 1 : 0.3;
      yaz(c, String(k.no), x0, y + 20, `900 22px ${F}`, '#ffcf6b', 'left');
      yaz(c, k.kisa, x0 + 28, y + 20, `800 21px ${F}`, '#fff', 'left');
      const bx = x0 + 110, bw = 330;
      rr(c, bx, y + 4, bw, 20, 10); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fill();
      if (hayatta && n) {
        const hedefW = bw * n / maks;
        const onceki = this.sonOySayisi[k.id] ?? hedefW;
        const w = lerp(onceki, hedefW, 0.2); this.sonOySayisi[k.id] = w;
        rr(c, bx, y + 4, Math.max(20, w), 20, 10); c.fillStyle = lider ? '#ff4b5c' : '#ffcf6b'; c.fill();
      }
      yaz(c, hayatta ? String(n ?? 0) : '—', bx + bw + 14, y + 21, `900 21px ${F}`, '#fff', 'left');
      c.globalAlpha = 1;
    });
    // son oylar
    const sx = 520;
    yaz(c, 'SON OYLAR', sx, y0 + 34, `900 16px ${F}`, '#a9a3c9', 'left');
    (oy.son || []).slice(0, 6).forEach((s, i) => {
      const yy = y0 + 62 + i * 30;
      c.globalAlpha = 1 - i * 0.12;
      yaz(c, `${s.hayalet ? '👻' : '🗳️'} ${s.ad.slice(0, 9)} → ${KISA[s.id].no}`, sx, yy, `700 17px ${F}`, '#fff', 'left');
    });
    c.globalAlpha = 1;
  }

  // ───────────── KÖYLÜLER ─────────────
  koyluSeridi(t, d) {
    const c = this.c, y0 = SAHNE_ALT + 444;
    yaz(c, `🏡 Köylüler: ${d.izleyici.toplam}` + (d.izleyici.hayalet ? `   👻 ${d.izleyici.hayalet}` : ''), 22, y0 + 22, `800 20px ${F}`, '#ffcf6b', 'left');
    let x = 22, y = y0 + 38;
    c.font = `700 16px ${F}`;
    for (const iz of d.izleyici.son) {
      const etiket = (iz.durum === 'hayalet' ? '👻 ' : iz.fenerli ? '🏮 ' : '') + iz.ad;
      const w = c.measureText(etiket).width + 20;
      if (x + w > W - 18) break;
      rr(c, x, y, w, 25, 12); c.fillStyle = iz.durum === 'hayalet' ? 'rgba(150,140,200,0.25)' : 'rgba(255,255,255,0.1)'; c.fill();
      yaz(c, etiket, x + 10, y + 18, `700 16px ${F}`, iz.durum === 'hayalet' ? '#c8c0ff' : '#e9e6f5', 'left');
      x += w + 6;
    }
  }

  // ───────────── ALT BAR ─────────────
  alt(t, d, faz, kalan) {
    const c = this.c, y0 = 1184;
    c.fillStyle = '#0d0b18'; c.fillRect(0, y0, W, H - y0);
    if (faz === 'oylama') {
      const sn = Math.ceil(kalan / 1000), p = kalan / d.faz.sure, acil = sn <= 10;
      const nab = acil ? 0.5 + Math.sin(t / 120) * 0.5 : 0;
      c.fillStyle = acil ? `rgba(${150 + nab * 80},20,40,1)` : '#3a1020'; c.fillRect(0, y0, W, H - y0);
      c.fillStyle = acil ? '#ffcf6b' : '#ff4b5c'; c.fillRect(0, y0, W * p, 10);
      yaz(c, '🗳️ OY ZAMANI', 26, y0 + 70, `900 36px ${F}`, '#fff', 'left');
      yaz(c, `${sn}`, W - 130, y0 + 78, `900 62px ${F}`, acil ? '#ffcf6b' : '#fff', 'center');
      yaz(c, 'sn', W - 60, y0 + 74, `800 26px ${F}`, '#fff', 'center');
      return;
    }
    const f = d.fener, p = f.deger / f.hedef;
    yaz(c, '🏮 FENERLER', 22, y0 + 32, `900 20px ${F}`, '#ffcf6b', 'left');
    rr(c, 160, y0 + 15, 250, 22, 11); c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill();
    if (p > 0) { c.save(); c.shadowColor = '#ffb547'; c.shadowBlur = p >= 1 ? 20 : 6; rr(c, 160, y0 + 15, Math.max(22, 250 * p), 22, 11); c.fillStyle = '#ffb547'; c.fill(); c.restore(); }
    yaz(c, f.bonusVar ? '❤️ beğeni at, dolunca ipucu!' : '❤️ beğeni = fener', 424, y0 + 33, `700 18px ${F}`, '#e9e6f5', 'left');
    const katilim = faz === 'sorgu' && !d.soruPenceresi?.acik ? 'İpuçlarını tartış   •   Oylamada şüphelinin adını yaz' : 'Katıl: yorum yaz   •   Soru: ?Hasan ...   •   Oy: 1-6';
    yaz(c, katilim, W / 2, y0 + 78, `800 21px ${F}`, '#fff', 'center');
  }

  bildirimCiz(t) {
    const c = this.c;
    this.bildirimler = this.bildirimler.filter(b => t - b.bas < 4000);
    this.bildirimler.forEach((b, i) => {
      const p = (t - b.bas) / 4000;
      const giris = kis((t - b.bas) / 250);
      c.save(); c.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
      c.font = `800 19px ${F}`;
      const m = `${b.ikon} ${b.metin}`;
      const w = c.measureText(m).width + 30;
      const x = W - 16 - w * giris, y = SAHNE_UST + 14 + i * 40;
      rr(c, x, y, w, 32, 16); c.fillStyle = 'rgba(14,12,26,0.85)'; c.fill();
      yaz(c, m, x + 15, y + 22, c.font, '#fff', 'left');
      c.restore();
    });
  }

  secimKutulari(adim, y) {
    const c = this.c;
    adim.secenekler.forEach((secenek, i) => {
      const x = 44 + i * 322;
      rr(c, x, y, 310, 100, 14);
      c.fillStyle = i ? '#303455' : '#57354a'; c.fill();
      yaz(c, adim.tuslar[i] + '  ·  ' + adim.say[i] + ' oy', x + 16, y + 32, `800 22px ${F}`, '#ffdb90');
      yaz(c, secenek, x + 16, y + 73, `800 25px ${F}`, '#fff');
    });
  }

  secimAl(clientX, clientY) {
    if (!this.d?.inceleme) return null;
    const r = this.cv.getBoundingClientRect();
    const x = (clientX - r.left) * W / r.width;
    const y = (clientY - r.top) * H / r.height;
    const ust = this.d.inceleme.tip === 'yer' ? SAHNE_UST + 16 + 251 : SAHNE_ALT + 190 + 67;
    if (y < ust || y > ust + 100) return null;
    if (x >= 44 && x <= 354) return 0;
    return x >= 366 && x <= 676 ? 1 : null;
  }

  // ───────────── LOBİ ─────────────
  lobi(t, d, kalan) {
    const c = this.c, y0 = SAHNE_UST + 16;
    rr(c, 30, y0, W - 60, 552, 26); c.fillStyle = 'rgba(12,8,24,0.92)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#7a1b2b'; c.stroke();
    yaz(c, d.senaryo.baslik, 58, y0 + 60, `900 38px ${B}`, '#ffe08a');
    c.font = `650 26px ${F}`;
    const satirlar = sar(c, d.senaryo.giris, W - 120);
    satirlar.forEach((l, i) => yaz(c, l, 60, y0 + 107 + i * 33, c.font, '#eae5ee'));
    if (d.inceleme) {
      yaz(c, d.inceleme.soru, 60, y0 + 230, `900 33px ${F}`, '#fff');
      this.secimKutulari(d.inceleme, y0 + 251);
    }
    let yy = y0 + 428;
    if (d.sonGalip) { yaz(c, `👑 Geçen turun galibi: ${d.sonGalip}`, W / 2, yy, `900 25px ${F}`, '#ffcf6b', 'center', 6); yy += 36; }
    yaz(c, '🏆 GECENİN DEDEKTİFLERİ', 70, yy, `900 21px ${F}`, '#ffcf6b', 'left'); yy += 30;
    if (!d.tablo.length) yaz(c, 'Henüz kimse yok. İlk sen ol!', 70, yy, `italic 600 22px ${B}`, '#d9c9ff', 'left');
    d.tablo.slice(0, d.sonGalip ? 1 : 2).forEach((s, i) => yaz(c, `${['🥇', '🥈', '🥉'][i]} ${s.ad} — ${s.dogru} doğru oy${s.galibiyet ? '  ' + '👑'.repeat(Math.min(3, s.galibiyet)) : ''}`, 70, yy + i * 27, `700 21px ${F}`, '#fff', 'left'));
    const sn = Math.ceil(kalan / 1000);
    yaz(c, `Yoruma 1 veya 2 yaz · ${sn} sn`, W / 2, y0 + 536, `800 21px ${F}`, '#ff9aa5', 'center');
  }

  // ───────────── FİNAL ─────────────
  finalCiz(t, d, fz) {
    const c = this.c, f = d.final; if (!f) return;
    const koy = f.kazanan === 'koy';
    const y0 = SAHNE_UST + 10;
    c.save(); c.globalAlpha = kis(fz / 600);
    rr(c, 24, y0, W - 48, 1040, 28); c.fillStyle = koy ? 'rgba(10,30,24,0.97)' : 'rgba(36,4,12,0.97)'; c.fill();
    c.lineWidth = 4; c.strokeStyle = koy ? '#8fe08f' : '#ff4b5c'; c.stroke();
    yaz(c, koy ? '🎉 KÖY KAZANDI!' : '🦇 VAMPİR KAZANDI!', W / 2, y0 + 70, `900 52px ${B}`, koy ? '#b9ffb0' : '#ff6b78', 'center', 16);
    // vampir büyük
    c.save();
    const g = c.createRadialGradient(W / 2, y0 + 270, 10, W / 2, y0 + 270, 190);
    g.addColorStop(0, 'rgba(214,56,75,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, y0 + 90, W, 360);
    c.restore();
    this.karakter(f.vampirId, W / 2, y0 + 410, 1.6, { vampir: true, konus: this.konusma && this.konusma.kim === f.vampirId && t - this.konusma.bas < this.konusma.sure ? Math.abs(Math.sin(t / 85)) : 0 });
    yaz(c, `VAMPİR: ${KISA[f.vampirId].ad.toLocaleUpperCase('tr-TR')}`, W / 2, y0 + 470, `900 38px ${F}`, '#fff', 'center', 10);
    c.font = `600 25px ${F}`;
    const sat = sar(c, f.aciklama, W - 120);
    sat.slice(0, 6).forEach((l, i) => yaz(c, l, W / 2, y0 + 524 + i * 34, c.font, '#ecebf5', 'center'));
    let yy = y0 + 524 + Math.min(6, sat.length) * 34 + 24;
    if (f.masumlar.length) { yaz(c, `😢 Masum yere sürülen: ${f.masumlar.join(', ')}`, W / 2, yy, `700 22px ${F}`, '#ffb3b3', 'center'); yy += 40; }
    if (f.galip && d.galipAcik) {
      const nab = 1 + Math.sin(t / 220) * 0.04;
      rr(c, 60, yy - 8, W - 120, 118, 22);
      const g2 = c.createLinearGradient(60, 0, W - 60, 0); g2.addColorStop(0, '#6b4a00'); g2.addColorStop(0.5, '#c99a1e'); g2.addColorStop(1, '#6b4a00');
      c.fillStyle = g2; c.fill();
      yaz(c, '👑 TURUN GALİBİ', W / 2, yy + 28, `900 24px ${F}`, '#fff3c4', 'center');
      c.save(); c.translate(W / 2, yy + 74); c.scale(nab, nab);
      yaz(c, f.galip.ad, 0, 0, `900 42px ${F}`, '#fff', 'center', 10); c.restore();
      yaz(c, `${f.galip.dogru} doğru oy`, W / 2, yy + 102, `800 20px ${F}`, '#fff3c4', 'center');
      yy += 140;
    } else if (f.galip) {
      yaz(c, '👑 Turun galibi...', W / 2, yy + 40, `900 34px ${F}`, '#ffcf6b', 'center', 10); yy += 80;
    } else {
      yaz(c, 'Bu turda kimse vampiri bilemedi...', W / 2, yy + 20, `italic 700 26px ${B}`, '#d9c9ff', 'center'); yy += 60;
    }
    const liste = (f.dogrular || []).slice(f.galip && d.galipAcik ? 1 : 0, 9);
    if (liste.length && (d.galipAcik || !f.galip)) {
      yaz(c, '🕵️ VAMPİRİ BİLENLER', W / 2, yy, `900 21px ${F}`, '#ffcf6b', 'center'); yy += 32;
      liste.slice(0, 6).forEach((p, i) => {
        const x = i % 2 === 0 ? W / 2 - 150 : W / 2 + 150, y = yy + Math.floor(i / 2) * 30;
        yaz(c, `${p.ad}  ✓${p.dogru}`, x, y, `800 21px ${F}`, '#fff', 'center');
      });
    }
    c.restore();
  }

  parcacikCiz(dt) {
    const c = this.c;
    this.parcacik = this.parcacik.filter(p => (p.omur -= dt) > 0);
    for (const p of this.parcacik) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.tip === 'h') { p.vy += 90 * dt; p.vx *= 0.985; c.globalAlpha = Math.min(1, p.omur); c.fillStyle = p.renk; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }
      else { p.a += dt * 6; c.globalAlpha = Math.min(1, p.omur); c.fillStyle = p.renk; c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); c.restore(); }
    }
    c.globalAlpha = 1;
  }
}

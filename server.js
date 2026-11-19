// Vampir Köylü — TikTok LIVE sunucusu
// Ekran: http://localhost:3000   Panel: http://<mac-ip>:3000/panel?k=ANAHTAR
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { karakter } from './public/js/senaryolar.js';
import { Oyun } from './public/js/engine.js';
import { Simulator } from './public/js/sim.js';
import { YerelSes } from './lib/yerel-ses.js';
import { Eleven } from './lib/eleven.js';
import { gptKur } from './lib/gpt.js';
import { envOku, sesAyarlari } from './lib/env.js';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(KOK, 'public');
const VERI = path.join(KOK, 'data');
fs.mkdirSync(VERI, { recursive: true });

const env = envOku(KOK);

const PORT = +env.PORT || 3000;
const kayitDosya = path.join(VERI, 'panel-anahtar.txt');
let PANEL_ANAHTAR = env.PANEL_ANAHTAR;
if (!PANEL_ANAHTAR) {
  try { PANEL_ANAHTAR = fs.readFileSync(kayitDosya, 'utf8').trim(); } catch { /* yok */ }
  if (!PANEL_ANAHTAR) { PANEL_ANAHTAR = crypto.randomBytes(3).toString('hex'); fs.writeFileSync(kayitDosya, PANEL_ANAHTAR); }
}
const log = (...a) => console.log(new Date().toLocaleTimeString('tr-TR'), ...a);

// ───────── skor ─────────
const skorDosya = path.join(VERI, 'skor.json');
let skor = {};
try { skor = JSON.parse(fs.readFileSync(skorDosya, 'utf8')); } catch { /* ilk çalıştırma */ }

// ───────── ses + GPT ─────────
const eleven = new Eleven({
  anahtar: env.ELEVENLABS_API_KEY, model: env.ELEVEN_MODEL || 'eleven_v3', isimModel: env.ELEVEN_ISIM_MODEL || 'eleven_flash_v2_5',
  klasor: path.join(VERI, 'ses'), log,
  sesler: sesAyarlari(env),
});
const yerelSes = env.SES_MOTORU === 'yerel'
  ? new YerelSes(env.YEREL_SES_PYTHON || path.join(os.homedir(), 'Desktop/Tts/.venv/bin/python'))
  : null;
const gpt = gptKur({ anahtar: env.OPENAI_SEARCH_API_KEY || env.OPENAI_API_KEY, model: env.OPENAI_MODEL || 'gpt-4o-mini', log });

// ───────── WebSocket istemcileri ─────────
const ekranlar = new Set(), paneller = new Set();
const gonder = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const yayinla = (kume, o) => { const s = JSON.stringify(o); for (const ws of kume) if (ws.readyState === 1) ws.send(s); };

// ───────── konuşma oynatıcı ─────────
const bekleyenBitis = new Map();
const uyu = ms => new Promise(r => setTimeout(r, ms));
let ttsAcik = true;
// Bir konuşmanın ses dosyalarını hazırla: parçalı ise her parça ayrı (sabitler önbellekten, isim yeni), değilse tek dosya
async function replikSesi(item) {
  if (yerelSes) return yerelSes.uret(item);
  if (!eleven.anahtar) return null;
  if (item.parcalar && item.parcalar.length) {
    const sonuc = await Promise.all(item.parcalar.map(p => eleven.uret({ kim: item.kim, d: item.d, metin: p.m, tip: p.tip })));
    if (sonuc.every(Boolean)) return { dosyalar: sonuc.map(x => x.dosya), sure: sonuc.reduce((a, x) => a + x.sure, 0) + 0.08 * (sonuc.length - 1) };
  }
  const tek = await eleven.uret(item);
  return tek ? { dosyalar: [tek.dosya], sure: tek.sure } : null;
}

async function sesHazirla(item) {
  if (!item.tanitim) return replikSesi(item);
  const [ad, replik] = await Promise.all([
    replikSesi({ kim: 'anlatici', metin: item.tanitim + '.', d: 'normal', tip: 'isim' }),
    replikSesi(item),
  ]);
  if (!ad || !replik) return null;
  return { dosyalar: [...ad.dosyalar, ...replik.dosyalar], sure: ad.sure + 0.04 + replik.sure };
}

const oynatici = {
  onYukle(item) { if (eleven.acik) sesHazirla(item).catch(() => {}); },
  async cal(item) {
    const ses = (yerelSes && !ekranlar.size) ? null : await Promise.race([sesHazirla(item).catch(() => null), uyu(8000).then(() => null)]);
    const tahmin = 900 + item.metin.length * 72;
    const sure = ses ? Math.round(ses.sure * 1000) : tahmin;
    const mesaj = { tip: 'soyle', item: { id: item.id, kim: item.kim, tanitim: item.tanitim, metin: item.metin, d: item.d, soru: item.soru || null, galip: !!item.galip }, ses: ses?.dosyalar || null, sure };
    yayinla(ekranlar, mesaj);
    yayinla(paneller, { tip: 'konusma', item: mesaj.item, ses: !!ses });
    if (ses || !ekranlar.size || !ttsAcik) return uyu(sure + 300);
    // Mac sesi: ekran "bitti" diyene kadar bekle
    await Promise.race([new Promise(r => bekleyenBitis.set(item.id, r)), uyu(tahmin * 1.7 + 2500)]);
    bekleyenBitis.delete(item.id);
    await uyu(250);
  },
};

const oyun = new Oyun({
  oynatici, cevapUret: gpt, skor,
  skorKaydet: s => fs.writeFile(skorDosya, JSON.stringify(s, null, 1), () => {}),
  ayar: {
    ...(env.SORGU_SURE ? { sorgu: +env.SORGU_SURE } : {}),
    ...(env.OYLAMA_SURE ? { oylama: +env.OYLAMA_SURE } : {}),
    ...(env.LOBI_SURE ? { lobi: +env.LOBI_SURE } : {}),
  },
});
oyun.on(e => {
  // yeni izleyicinin ismini önceden seslendir: selamlama geldiğinde hazır olsun (anlatıcının sesiyle)
  if (e.tip === 'isimHazir') { if (eleven.acik) eleven.uret({ kim: 'anlatici', metin: e.ad + '!', tip: 'isim' }).catch(() => {}); return; }
  yayinla(ekranlar, { tip: 'olay', e });
  if (e.tip === 'soru') yayinla(paneller, { tip: 'olay', e });
});

let sim = null;
let son = Date.now();
setInterval(() => {
  const t = Date.now(), dt = Math.min(500, t - son); son = t;
  oyun.tick(dt);
  if (sim) sim.tick(dt);
}, 100);

let tiktokDurum = 'kapalı';
setInterval(() => {
  yayinla(ekranlar, { tip: 'durum', d: oyun.durum(false) });
  if (paneller.size) {
    const d = oyun.durum(true);
    d.sunucu = { tiktok: tiktokDurum, eleven: yerelSes?.durum || eleven.durum, elevenKarakter: eleven.uretilen, gpt: gpt ? (env.OPENAI_MODEL || 'gpt-4o-mini') : 'kapalı', ekran: ekranlar.size, sim: !!sim, tts: ttsAcik };
    yayinla(paneller, { tip: 'durum', d });
  }
}, 200);

// ───────── test olayları ─────────
function testIsle(m) {
  const kim = String(m.kim || 'deneme').slice(0, 30);
  if (m.olay === 'yorum') oyun.yorum(kim, kim, m.metin || 'selam');
  else if (m.olay === 'begeni') oyun.begeni(kim, kim, 50);
  else if (m.olay === 'takip') oyun.takip(kim, kim);
  else if (m.olay === 'paylas') oyun.paylasim(kim, kim);
  else if (m.olay === 'hediye') oyun.hediye(kim, kim, +m.elmas || 1, 1);
  else if (m.olay === 'sim') { sim = sim ? null : new Simulator(oyun); log('Sahte izleyiciler', sim ? 'açık' : 'kapalı'); }
  else if (m.olay === 'sonraki') oyun.komut('sonraki');
}

// ───────── HTTP ─────────
const TIP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
const sunucu = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/demo-ses') {
    const yerel = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (!yerel || req.method !== 'POST' || req.headers.origin !== 'http://' + req.headers.host ||
        req.headers['content-type'] !== 'application/json') { res.writeHead(403); return res.end(); }
    if (!yerelSes) { res.writeHead(204); return res.end(); }
    let boyut = 0;
    const parcalar = [];
    req.on('data', parca => {
      boyut += parca.length;
      if (boyut <= 4096) parcalar.push(parca);
    });
    req.on('end', async () => {
      if (boyut > 4096) { res.writeHead(413); return res.end(); }
      let is;
      try { is = JSON.parse(Buffer.concat(parcalar)); } catch { res.writeHead(400); return res.end(); }
      if (!is || !['anlatici','muhtar','bakkal','ebe','coban','ogretmen','demirci'].includes(is.kim) ||
          typeof is.metin !== 'string' || !is.metin.trim() || is.metin.length > 600) {
        res.writeHead(400); return res.end();
      }
      const tanitim = is.tanit === true ? karakter(is.kim)?.ad : undefined;
      const ses = await sesHazirla({ kim: is.kim, metin: is.metin, tanitim }).catch(() => null);
      res.writeHead(ses ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(ses));
    });
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  if (p === '/panel') p = '/panel.html';
  let dosya;
  if (p.startsWith('/ses/')) dosya = path.join(VERI, 'ses', path.basename(p));
  else dosya = path.join(PUB, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!dosya.startsWith(PUB) && !dosya.startsWith(path.join(VERI, 'ses'))) { res.writeHead(403); return res.end(); }
  fs.readFile(dosya, (err, veri) => {
    if (err) { res.writeHead(404); return res.end('yok'); }
    res.writeHead(200, { 'Content-Type': TIP[path.extname(dosya)] || 'application/octet-stream', 'Cache-Control': p.startsWith('/ses/') ? 'max-age=86400' : 'no-cache' });
    res.end(veri);
  });
});

const wss = new WebSocketServer({ server: sunucu, path: '/ws' });
wss.on('connection', (ws, req) => {
  const yerel = /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress || '');
  let rol = null;
  ws.on('message', ham => {
    let m; try { m = JSON.parse(ham); } catch { return; }
    if (m.tip === 'merhaba') {
      if (m.rol === 'panel') {
        if (m.anahtar !== PANEL_ANAHTAR) { gonder(ws, { tip: 'hata', metin: 'Panel anahtarı yanlış' }); return ws.close(); }
        rol = 'panel'; paneller.add(ws);
      } else { rol = 'ekran'; ekranlar.add(ws); gonder(ws, { tip: 'ayar', v: { tts: ttsAcik } }); }
      return;
    }
    if (m.tip === 'bitti' && rol === 'ekran') { bekleyenBitis.get(m.id)?.(); return; }
    if (m.tip === 'test' && (rol === 'panel' || (rol === 'ekran' && yerel))) return testIsle(m);
    if (m.tip === 'komut' && rol === 'panel') {
      if (m.k === 'tts') { ttsAcik = !!m.v; yayinla(ekranlar, { tip: 'ayar', v: { tts: ttsAcik } }); return; }
      oyun.komut(m.k, m.v);
    }
  });
  ws.on('close', () => { ekranlar.delete(ws); paneller.delete(ws); });
});

// ───────── TikTok ─────────
async function tiktokBaglan() {
  const kullanici = (env.TIKTOK_KULLANICI || '').replace(/^@/, '').trim();
  if (!kullanici) { tiktokDurum = 'kapalı (.env içinde TIKTOK_KULLANICI yok)'; return; }
  let mod;
  try { mod = await import('tiktok-live-connector'); } catch (e) { tiktokDurum = 'kütüphane yok: npm install'; return; }
  const { TikTokLiveConnection, WebcastEvent } = mod;
  const conn = new TikTokLiveConnection(kullanici, { processInitialData: false, ...(env.EULER_API_KEY ? { signApiKey: env.EULER_API_KEY } : {}) });
  const kim = u => (u && (u.uniqueId || u.displayId || u.userId || u.id || u.nickname)) || null;
  conn.on(WebcastEvent.CHAT, d => oyun.yorum(kim(d.user), d.user?.nickname, d.comment ?? d.content ?? ''));
  conn.on(WebcastEvent.LIKE, d => oyun.begeni(kim(d.user), d.user?.nickname, d.likeCount ?? d.count ?? 1));
  conn.on(WebcastEvent.GIFT, d => {
    const g = d.giftDetails || d.gift || {};
    const tip = g.giftType ?? g.type;
    if (tip === 1 && !d.repeatEnd) return;
    oyun.hediye(kim(d.user), d.user?.nickname, g.diamondCount ?? g.diamond_count ?? 1, d.repeatCount || 1);
  });
  conn.on(WebcastEvent.FOLLOW, d => oyun.takip(kim(d.user), d.user?.nickname));
  conn.on(WebcastEvent.SHARE, d => oyun.paylasim(kim(d.user), d.user?.nickname));
  const yeniden = neden => { tiktokDurum = 'koptu (' + neden + '), 15 sn sonra tekrar'; log('TikTok', tiktokDurum); setTimeout(tiktokBaglan, 15000); };
  conn.on(WebcastEvent.DISCONNECTED, () => yeniden('bağlantı'));
  conn.on(WebcastEvent.STREAM_END, () => yeniden('yayın bitti'));
  try {
    tiktokDurum = 'bağlanıyor...';
    const s = await conn.connect();
    tiktokDurum = 'bağlı ✓ (@' + kullanici + ')';
    log('TikTok bağlandı, oda', s?.roomId);
  } catch (e) {
    tiktokDurum = 'bağlanamadı: ' + String(e?.message || e).slice(0, 80) + ' — 15 sn sonra tekrar';
    log('TikTok', tiktokDurum);
    setTimeout(tiktokBaglan, 15000);
  }
}

function lanIp() {
  for (const ag of Object.values(os.networkInterfaces())) for (const a of ag || []) if (a.family === 'IPv4' && !a.internal) return a.address;
  return 'localhost';
}

if (!yerelSes) await eleven.hazirla();
sunucu.listen(PORT, () => {
  console.log('\n🦇  VAMPİR KÖYLÜ çalışıyor\n');
  console.log(`   Yayın ekranı : http://localhost:${PORT}`);
  console.log(`   Panel (telefondan, aynı Wi-Fi): http://${lanIp()}:${PORT}/panel?k=${PANEL_ANAHTAR}`);
  console.log(`   Ses motoru   : ${yerelSes?.durum || eleven.durum}`);
  console.log(`   GPT          : ${gpt ? env.OPENAI_MODEL || 'gpt-4o-mini' : 'kapalı (hazır cevaplar kullanılıyor)'}`);
  console.log('');
  tiktokBaglan();
});

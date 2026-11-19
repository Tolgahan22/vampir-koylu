// Yayın ekranı: sunucuya bağlanır (ya da ?demo ile kendi içinde oynar), çizer, seslendirir.
import { Cizici } from './cizim.js';
import { Ses } from './ses.js';

const q = new URLSearchParams(location.search);
const webDemo = location.hostname.endsWith('.github.io');
const demo = webDemo || q.has('demo') || !!window.__DEMO;
const cizici = new Cizici(document.getElementById('ekran'));
const ses = new Ses();
window.__cizici = cizici;

let sonIpucu = 0, sonSaniye = -1, sonD = null, ws = null, mac = { tts: true };

function dongu() {
  cizici.ciz();
  if (sonD) muzikGuncelle(sonD);
  requestAnimationFrame(dongu);
}
requestAnimationFrame(dongu);

function muzikGuncelle(d) {
  const f = d.faz.ad;
  const mod = { bekleme: 'bekleme', gece: 'gece', sabah: 'sabah', sorgu: 'gunduz', oylama: 'oylama', kilit: 'kilit', aksam: 'aksam', final: d.final?.kazanan === 'vampir' ? 'vampir' : 'koy' }[f] || 'bekleme';
  const kalan = cizici.kalanMs();
  const yog = f === 'oylama' ? 1 - kalan / d.faz.sure : 0;
  if (mod !== ses.mod || Math.abs(yog - ses.yogunluk) > 0.03) ses.ayarla(mod, yog);
  if (f === 'oylama') {
    const sn = Math.ceil(kalan / 1000);
    if (sn !== sonSaniye) { sonSaniye = sn; if (sn <= 10 && sn > 0) ses.efektCal('tik'); }
  }
}

function durumGeldi(d) {
  if (d.ipuclari.length > sonIpucu) ses.efektCal('ipucu');
  sonIpucu = d.ipuclari.length;
  sonD = d;
  cizici.guncelle(d);
}

function olayGeldi(e) {
  cizici.olay(e);
  if (e.tip === 'efekt') ses.efektCal(e.ad);
  if (e.tip === 'faz' && e.ad === 'oylama') ses.efektCal('oyBasla');
  if (e.tip === 'faz' && e.ad === 'aksam') ses.efektCal('darbe');
  if (e.tip === 'ayar' && e.v) mac = { ...mac, ...e.v };
}

// Seslendirme: dosya varsa onu çal, yoksa tarayıcının Türkçe sesi
async function soyle(item, url, sureMs) {
  cizici.konusmaBasla(item, sureMs);
  if (item.galip) { cizici.olay({ tip: 'efekt', ad: 'zafer' }); ses.efektCal('zafer'); }
  if (!ses.hazir) return new Promise(r => setTimeout(r, sureMs));
  if (Array.isArray(url) && url.length) return ses.konusDosyalar(url);
  if (url && !Array.isArray(url)) return ses.konusDosya(url);
  if (mac.tts) {
    if (item.tanitim) await ses.konusTTS(item.tanitim + '.', 'anlatici');
    return ses.konusTTS(item.metin, item.kim, sureMs + 6000);
  }
  return new Promise(r => setTimeout(r, sureMs));
}

// ───────── başlat düğmesi ─────────
const basla = document.getElementById('basla');
basla.addEventListener('click', async () => {
  await ses.baslat();
  basla.style.display = 'none';
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ tip: 'sesHazir' }));
});

// Yayın penceresi, tarayıcının otomatik ses izniyle açılır.
if (q.has('yayin') && !demo) basla.click();

// ───────── DEMO: oyun tarayıcıda döner ─────────
async function demoBaslat() {
  const { Oyun } = await import('./engine.js');
  const { Simulator } = await import('./sim.js');
  const oynatici = {
    async cal(item) {
      const tahmini = 1200 + item.metin.length * 62;
      if (webDemo) return soyle(item, null, tahmini);
      let ses = null;
      try {
        const r = await fetch('/demo-ses', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kim: item.kim, metin: item.metin, tanit: !!item.tanitim }), signal: AbortSignal.timeout(8000) });
        if (r.status === 200) ses = await r.json();
      } catch { /* Sunucusuz demoda tarayıcı sesine geç. */ }
      return soyle(item, ses?.dosyalar, ses ? Math.round(ses.sure * 1000) : tahmini);
    },
  };
  const { SENARYOLAR } = await import('./senaryolar.js');
  const dosya = SENARYOLAR.filter(s => s.dosya === q.get('dosya'));
  const ilkSenaryo = dosya.length ? dosya[Math.floor(Math.random() * dosya.length)].id : null;
  const oyun = new Oyun({ oynatici, ilkSenaryo, ayar: { lobi: 20, sorgu: 45, oylama: 32 } });
  let simAcik = true;
  const sim = new Simulator(oyun, { hiz: 1 });
  document.querySelector('[data-o="sim"]').addEventListener('click', e => {
    simAcik = !simAcik;
    e.currentTarget.textContent = simAcik ? '🤖 Sahte izleyiciler açık' : '🤖 Sahte izleyiciler kapalı';
  });
  document.getElementById('ekran').addEventListener('click', e => {
    const i = cizici.secimAl(e.clientX, e.clientY);
    if (i != null && oyun.inceleme) oyun.yorum('demo-oyuncu', 'Sen', oyun.inceleme.tuslar[i]);
  });
  oyun.on(olayGeldi);
  let son = performance.now();
  setInterval(() => {
    const t = performance.now(), dt = Math.min(250, t - son); son = t;
    if (basla.style.display !== 'none') return;
    oyun.tick(dt); if (simAcik) sim.tick(dt);
  }, 50);
  setInterval(() => durumGeldi(oyun.durum()), 120);
  window.__oyun = oyun;
}

// ───────── CANLI: sunucuya bağlan ─────────
function baglan() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => ws.send(JSON.stringify({ tip: 'merhaba', rol: 'ekran' }));
  ws.onmessage = ev => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.tip === 'durum') durumGeldi(m.d);
    else if (m.tip === 'olay') olayGeldi(m.e);
    else if (m.tip === 'soyle') soyle(m.item, m.ses, m.sure).then(() => { if (!(m.ses && m.ses.length) && ws.readyState === 1) ws.send(JSON.stringify({ tip: 'bitti', id: m.item.id })); });
    else if (m.tip === 'ayar') mac = { ...mac, ...m.v };
  };
  ws.onclose = () => setTimeout(baglan, 1500);
}

if (demo) demoBaslat(); else baglan();

// ───────── klavye: D test paneli, F tam ekran, M müzik ─────────
const test = document.getElementById('test');
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'd' || e.key === 'D') test.style.display = test.style.display === 'block' ? 'none' : 'block';
  if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.();
  if (e.key === 'm' || e.key === 'M') ses.muzikAc(!ses.muzikAcik);
});
const gonder = (o) => { if (demo && window.__oyun) testDemo(o); else if (ws && ws.readyState === 1) ws.send(JSON.stringify({ tip: 'test', ...o })); };
function testDemo(o) {
  const g = window.__oyun;
  if (o.olay === 'yorum') g.yorum(o.kim, o.kim, o.metin);
  if (o.olay === 'begeni') g.begeni(o.kim, o.kim, 50);
  if (o.olay === 'hediye') g.hediye(o.kim, o.kim, o.elmas || 1, 1);
  if (o.olay === 'takip') g.takip(o.kim, o.kim);
  if (o.olay === 'sonraki') g.komut('sonraki');
}
test.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const kim = document.getElementById('tkim').value || 'deneme_kullanici';
  const metin = document.getElementById('tmetin').value;
  gonder({ olay: b.dataset.o, kim, metin, elmas: +b.dataset.e || 1 });
});

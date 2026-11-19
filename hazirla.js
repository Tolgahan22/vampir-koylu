// Yayından önce bütün sabit cümleleri ElevenLabs'ta bir kere üretip kaydeder.
// Böylece yayında sadece isimler (birkaç harf) ve varsa GPT cevapları üretilir, gecikme olmaz.
//
//   node hazirla.js --tahmin   → kaç cümle, kaç karakter tutacağını gösterir, hiçbir şey üretmez
//   node hazirla.js            → eksikleri üretir (zaten kayıtlı olanlara kredi harcamaz)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Oyun, sablonParcala } from './public/js/engine.js';
import { Simulator } from './public/js/sim.js';
import { KARAKTERLER, SENARYOLAR, GENEL, FIGURANLAR } from './public/js/senaryolar.js';
import { ANLATICI, SOHBET, CAGRI, YONELME, ILGI } from './public/js/replikler.js';
import { Eleven } from './lib/eleven.js';
import { envOku, sesAyarlari } from './lib/env.js';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const env = envOku(KOK);
const tahmin = process.argv.includes('--tahmin');

const liste = new Map();
const ekle = (kim, metin, d, tip = 'sabit') => {
  if (!metin || tip !== 'sabit' || !/[\p{L}]/u.test(metin)) return;
  liste.set(`${kim}|${d}|${metin}`, { kim, metin, d, tip });
};
const sablon = (kim, x, v) => {
  const p = sablonParcala(x.m, v);
  if (p) for (const s of p) ekle(kim, s.m, x.d, s.tip);
  else ekle(kim, x.m.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? ''), x.d);
};

// 1) Senaryo cümleleri
for (const s of SENARYOLAR) {
  const incelemeler = [['Önce nereye bakalım?', s.yerler, s.bulgular, ['1', '2']]];
  if (s.deney) incelemeler.push([s.soru, s.islem, s.deney, ['A', 'B']]);
  for (const [soru, secenekler, bulgular, tuslar] of incelemeler) {
    ekle('anlatici', `${soru} ${tuslar[0]} için ${secenekler[0]}, ${tuslar[1]} için ${secenekler[1]}.`, 'heyecan');
    secenekler.forEach((ad, i) => {
      for (const karar of ['İlk iz', 'Eşitlik kurası', 'Köyün seçimi']) ekle('anlatici', `${karar}: ${ad}. ${bulgular[i]}`, 'normal');
    });
  }
  ekle('anlatici', s.giris, 'korku');
  for (const ip of [...s.ipuclari, ...s.bonus]) ekle('anlatici', ip, 'normal');
  ekle('anlatici', s.final.koy, 'normal'); ekle('anlatici', s.final.vampir, 'normal');
  for (const [id, k] of Object.entries(s.k)) {
    ekle(id, k.gece, 'normal');
    for (const g of k.gordu) ekle(id, g, 'normal');
    ekle(id, k.suphe, /!/.test(k.suphe) ? 'ofke' : 'sakin');
    ekle(id, k.sonSoz, /\.\.\.\s*$/.test(k.sonSoz) ? 'uzgun' : /!\s*$/.test(k.sonSoz) ? 'bagir' : 'ofke');
  }
}
// 2) Karakterlerin genel cümleleri ve laf atışmaları
for (const k of KARAKTERLER) {
  for (const havuz of Object.values(GENEL[k.id])) for (const m of havuz) for (const d of ['normal', 'ofke', 'sakin']) if (havuz === GENEL[k.id].inkar ? d === 'ofke' : havuz === GENEL[k.id].kaba ? d === 'ofke' : d === 'normal') ekle(k.id, m, d);
  for (const [tur, havuz] of Object.entries(SOHBET[k.id])) for (const x of havuz) {
    if (tur === 'suclama') for (const h of KARAKTERLER) { if (h.id !== k.id) sablon(k.id, x, { hedef: h.kisa }); }
    else sablon(k.id, x, {});
  }
  for (const m of ['Hmm...', 'Bir dakika...', 'Şey...', 'Bir düşüneyim...', 'Bana mı soruyorsun?']) ekle(k.id, m, 'normal');
  for (const x of CAGRI.kilitTepki) sablon(k.id, x, {});
}
// 3) Anlatıcı havuzları (isimler ayrı parça olduğu için sabit kısımlar önceden üretilebilir)
for (const havuz of Object.values(ANLATICI)) for (const x of havuz) {
  if (/\{(n|oy)\}/.test(x.m)) continue; // sayılı cümleler yayında üretilir
  if (/\{kisi\}/.test(x.m)) { if (/\{kisi\}/.test(x.m)) for (const k of KARAKTERLER) sablon('anlatici', x, { kisi: k.ad }); continue; }
  sablon('anlatici', x, { ad: 'X', a: 'X', b: 'X', gun: 1 });
}
for (const g of [1, 2, 3, 4]) ekle('anlatici', `${g}. gün ipucu:`, 'normal');
for (const [tur, havuz] of Object.entries(CAGRI)) for (const x of havuz) {
  if (tur === 'kilitTepki') continue;
  if (/\{(n|oy)\}/.test(x.m)) continue; // sayılı cümleler yayında üretilir (az sayıda)
  if (/\{(kime|kisi|ilgi|kisa)\}/.test(x.m)) { for (const k of KARAKTERLER) sablon('anlatici', x, { kime: YONELME[k.id], kisi: k.ad, ilgi: ILGI[k.id], kisa: k.kisa }); continue; }
  if (/\{ipucu\}/.test(x.m)) { sablon('anlatici', x, { ipucu: 'X' }); continue; }
  if (/\{(a|b)\}/.test(x.m) && tur === 'basabas') { for (const a of KARAKTERLER) for (const b of KARAKTERLER) if (a !== b) sablon('anlatici', x, { a: a.kisa, b: b.kisa }); continue; }
  sablon('anlatici', x, { ad: 'X' });
}
// isim parçası olarak çıkan "X!" yer tutucusunu at
for (const k of [...liste.keys()]) if (liste.get(k).metin === 'X!' || liste.get(k).metin === 'X') liste.delete(k);

// 4) Oyunun kendi anlatım cümleleri: sahte izleyicilerle her senaryoyu birkaç kez oynatıp topla
for (const s of SENARYOLAR) {
  for (const egilim of [0, 0.3, 0.9]) {
    let oyun; const bekleyen = [];
    oyun = new Oyun({ ayar: { isimOku: false }, oynatici: { cal(item) { return new Promise(r => bekleyen.push({ bitis: oyun.zaman + oyun.sureTahmin(item.metin), r, item })); } } });
    oyun.komut('senaryo', s.id);
    const sim = new Simulator(oyun); sim.vampirEgilim = egilim;
    let finalGordu = false;
    for (let i = 0; i < 30 * 60 * 10; i++) {
      oyun.tick(100); sim.tick(100);
      for (let j = bekleyen.length - 1; j >= 0; j--) if (oyun.zaman >= bekleyen[j].bitis) {
        const b = bekleyen.splice(j, 1)[0];
        const it = b.item;
        if (it.parcalar) for (const p of it.parcalar) ekle(it.kim, p.m, it.d, p.tip);
        else if (!/\d/.test(it.metin)) ekle(it.kim, it.metin, it.d);
        b.r();
      }
      await Promise.resolve(); await Promise.resolve();
      if (oyun.faz.ad === 'final') finalGordu = true;
      if (finalGordu && oyun.faz.ad === 'bekleme') break;
    }
  }
}

const isler = [...liste.values()];
const eleven = new Eleven({
  anahtar: env.ELEVENLABS_API_KEY, model: env.ELEVEN_MODEL || 'eleven_v3', isimModel: env.ELEVEN_ISIM_MODEL || 'eleven_flash_v2_5',
  klasor: path.join(KOK, 'data', 'ses'), sesler: sesAyarlari(env), log: () => {},
});
const toplamKar = isler.reduce((a, x) => a + x.metin.length, 0);
console.log(`\nSabit cümle parçası: ${isler.length} adet, toplam ${toplamKar.toLocaleString('tr-TR')} karakter`);

if (!env.ELEVENLABS_API_KEY) { console.log('.env içinde ELEVENLABS_API_KEY yok. Önce onu yaz.'); process.exit(0); }
await eleven.hazirla();
const eksik = isler.filter(x => !eleven.onbellekte(x));
const eksikKar = eksik.reduce((a, x) => a + x.metin.length, 0);
console.log(`Kayıtlı olmayan: ${eksik.length} adet, ${eksikKar.toLocaleString('tr-TR')} karakter (bu kadar kredi gider)`);
if (tahmin) { console.log('\nÜretmek için: node hazirla.js\n'); process.exit(0); }

let bitti = 0, hata = 0;
const bas = Date.now();
await Promise.all(eksik.map(x => eleven.uret(x).then(r => {
  bitti++; if (!r) hata++;
  if (bitti % 20 === 0 || bitti === eksik.length) process.stdout.write(`\r${bitti}/${eksik.length} üretildi${hata ? `, ${hata} hata` : ''}   `);
})));
console.log(`\nBitti (${Math.round((Date.now() - bas) / 1000)} sn). ElevenLabs durumu: ${eleven.durum}`);
if (hata) console.log('Hata olanlar yayında tekrar denenecek. Kredi bittiyse ElevenLabs panelinden kontrol et.');

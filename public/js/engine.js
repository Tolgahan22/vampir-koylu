// Vampir Köylü oyun motoru. Hem Node (sunucu) hem tarayıcı (demo) içinde çalışır.
import { KARAKTERLER, FIGURANLAR, SENARYOLAR, GENEL, karakter } from './senaryolar.js';
import { ANLATICI, SOHBET, ILGI, CAGRI } from './replikler.js';
import { kotuMu, temizIsim, okunurIsim, ozelIsim, temizSoru } from './filtre.js';

export const VARSAYILAN = {
  lobi: 20, gece: 9, sabah: 12, sorgu: 50, oylama: 35, kilit: 12, aksam: 10, final: 24,
  otoSoru: true, soruOku: 'secilen', // hepsi | secilen | hic
  bosluk: 1.2, isimOku: true, fenerHedef: 250, isirikSans: 0.4, minIzleyiciIsirik: 3, karsilaAralik: 14,
};

const SORU_SECIM_MS = 8000;
const SORU_PENCERESI_MS = 10000;

const FAZ_SIRA = ['bekleme', 'gece', 'sabah', 'sorgu', 'oylama', 'kilit', 'aksam', 'final'];
const SENARYOLU = new Set(['sabah', 'kilit', 'aksam', 'final', 'gece']); // anlatım bitmeden geçmez

const tr = s => String(s || '').toLocaleLowerCase('tr-TR');
const karsilamaTuru = tur => tur === 'takip' || tur === 'adim';
const doldur = (m, v) => m.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

// Şablonu seslendirme parçalarına böler: isimler ve ipuçları ayrı parça olur, böylece
// sabit kısımlar bir kere üretilip hep yeniden kullanılır, sadece isim (birkaç harf) yeni üretilir.
// tip: sabit (önbelleğe girer) | isim (kısa, ayrı üretilir) | dinamik (izleyici sorusu gibi, her seferinde yeni)
const AYRI = { ad: 'isim', a: 'isim', b: 'isim', soru: 'dinamik', ipucu: 'sabit' };
export function sablonParcala(sablon, v) {
  const re = /\{(ad|a|b|soru|ipucu)\}([!?.,…:]*)/g;
  if (!/\{(ad|a|b|soru|ipucu)\}/.test(sablon)) return null;
  const out = [];
  let son = 0, m;
  const ekle = (metin, tip) => { const t = metin.trim(); if (/[\p{L}\p{N}]/u.test(t)) out.push({ m: t, tip }); };
  while ((m = re.exec(sablon))) {
    ekle(doldur(sablon.slice(son, m.index), v), 'sabit');
    const deger = String(v[m[1]] ?? '').trim();
    if (deger) ekle(deger + (m[2] || ''), AYRI[m[1]]);
    son = m.index + m[0].length;
  }
  ekle(doldur(sablon.slice(son), v), 'sabit');
  return out;
}

export class Oyun {
  constructor(opts = {}) {
    this.ayar = { ...VARSAYILAN, ...(opts.ayar || {}) };
    this.rnd = opts.rastgele || Math.random;
    this.cevapUret = opts.cevapUret || null;
    this.oynatici = opts.oynatici || null; // { cal(item) => Promise, onYukle?(item) }
    this.skor = opts.skor || {};
    this.skorKaydet = opts.skorKaydet || (() => {});
    this.dinleyiciler = [];
    this.zaman = 0;
    this.sayac = 0;
    this.izleyiciler = new Map();
    this.susturulan = new Set();
    this.duraklatildi = false;
    this.kuyruk = [];
    this.konusma = null;
    this.sonKonusmaBitis = 0;
    this.sonSozler = [];
    this.yeniGelenler = [];
    this.sonKarsila = -99999;
    this.tesekkur = [];
    this.sonTesekkur = -99999;
    this.oynananlar = [];
    this.sonrakiSenaryo = opts.ilkSenaryo || null;
    this.fazGir('bekleme');
  }

  on(cb) { this.dinleyiciler.push(cb); }
  yay(o) { for (const cb of this.dinleyiciler) { try { cb(o); } catch (e) { /* yut */ } } }
  sec(a) { return a[Math.floor(this.rnd() * a.length)]; }

  // ───────────── KONUŞMA KUYRUĞU ─────────────
  soyle(kim, metin, d = 'normal', oncelik = 1, ek = {}) {
    if (!metin) return;
    if (oncelik === 0 && (this.kuyruk.length || this.konusma)) return;
    const item = { id: ++this.sayac, kim, metin, d, oncelik, eklendi: this.zaman, ...ek };
    let i = this.kuyruk.findIndex(x => x.oncelik < oncelik);
    if (i < 0) i = this.kuyruk.length;
    this.kuyruk.splice(i, 0, item);
    while (this.kuyruk.length > 7) {
      let en = -1;
      for (let j = this.kuyruk.length - 1; j >= 0; j--) if (this.kuyruk[j].oncelik < 3) { en = j; break; }
      if (en < 0) break;
      this.kuyruk.splice(en, 1);
    }
    this.sonSozler.push(metin);
    if (this.sonSozler.length > 30) this.sonSozler.shift();
    try { this.oynatici?.onYukle?.(item); } catch (e) { /* yut */ }
  }
  replik(havuz, v = {}, kim = 'anlatici', oncelik = 1, ek = {}) {
    let adaylar = havuz.filter(x => !this.sonSozler.includes(doldur(x.m, v)));
    if (!adaylar.length) { const yakin = this.sonSozler.slice(-3); adaylar = havuz.filter(x => !yakin.includes(doldur(x.m, v))); }
    const x = this.sec(adaylar.length ? adaylar : havuz);
    const parcalar = sablonParcala(x.m, v);
    this.soyle(kim, doldur(x.m, v), x.d, oncelik, parcalar ? { ...ek, parcalar } : ek);
  }
  sureTahmin(metin) { return 1200 + String(metin).length * 62; }

  konusmaIlerlet() {
    if (this.konusma) {
      // güvenlik: oynatıcı takılırsa
      if (this.zaman - this.konusma.basladi > this.sureTahmin(this.konusma.metin) + 15000) this.konusmaBitti(this.konusma);
      return;
    }
    while (this.kuyruk.length && this.kuyruk[0].oncelik < 2 && this.zaman - this.kuyruk[0].eklendi > 20000) this.kuyruk.shift();
    if (!this.kuyruk.length) return;
    const item = this.kuyruk.shift();
    if (item.kim !== this.sonKonusan) item.tanitim = karakter(item.kim)?.ad;
    this.sonKonusan = item.kim;
    item.basladi = this.zaman;
    this.konusma = item;
    const p = this.oynatici ? this.oynatici.cal(item) : new Promise(r => setTimeout(r, this.sureTahmin(item.metin)));
    Promise.resolve(p).catch(() => {}).then(() => this.konusmaBitti(item));
  }
  konusmaBitti(item) {
    if (this.konusma === item) { this.konusma = null; this.sonKonusmaBitis = this.zaman; }
  }
  konusmaVar(minOncelik = 0) {
    return (this.konusma && this.konusma.oncelik >= minOncelik) || this.kuyruk.some(x => x.oncelik >= minOncelik);
  }

  // ───────────── FAZLAR ─────────────
  get T() { return this.tur; }
  hayattaMi(id) { return this.tur.hayatta.includes(id); }
  vampirKarakter() { return karakter(this.tur.senaryo.vampir); }

  fazGir(ad, sure) {
    const s = sure ?? (ad === 'bekleme' ? this.ayar.lobi : this.ayar[ad]) * 1000;
    this.faz = { ad, sure: s, gecen: 0, bayrak: {} };
    this['gir_' + ad]?.();
    this.yay({ tip: 'faz', ad });
  }
  sonrakiFaz() {
    const f = this.faz.ad;
    if (f === 'bekleme') { this.incelemeBitir(); return this.fazGir('gece'); }
    if (f === 'gece') return this.fazGir('sabah', this.tur.geceSonuc.sonuc === 'isirik' ? this.ayar.sabah * 1000 : 13000);
    if (f === 'sabah') {
      const s = this.tur.geceSonuc;
      if (s.sonuc === 'sessiz') return this.fazGir('final');
      if (s.vampirKazanir) return this.fazGir('final');
      return this.fazGir('sorgu');
    }
    if (f === 'sorgu') { this.incelemeBitir(); return this.fazGir('oylama'); }
    if (f === 'oylama') return this.fazGir('kilit');
    if (f === 'kilit') return this.fazGir('aksam');
    if (f === 'aksam') return this.fazGir('gece');
    if (f === 'final') return this.fazGir('bekleme');
  }

  gir_bekleme() {
    this.sonKonusan = null;
    let sen = null;
    if (this.sonrakiSenaryo) sen = SENARYOLAR.find(s => s.id === this.sonrakiSenaryo);
    this.sonrakiSenaryo = null;
    if (!sen) {
      let kalan = SENARYOLAR.filter(s => !this.oynananlar.includes(s.dosya));
      if (!kalan.length) { this.oynananlar = this.oynananlar.slice(-2); kalan = SENARYOLAR.filter(s => !this.oynananlar.includes(s.dosya)); }
      sen = this.sec(kalan);
    }
    this.oynananlar.push(sen.dosya);
    this.tur = {
      senaryo: sen, gun: 0, gece: 0, hayatta: KARAKTERLER.map(k => k.id), suruldu: [], kilitli: null,
      ipuclari: [], bonusKalan: [...sen.bonus], bonusGun: -1, oylar: new Map(), oyGecmisi: [], sonOylar: [],
      sahteKullanildi: false, vampirSuruldu: false, sonSurulenMasum: false, kullanilanKurban: [],
      geceSonuc: null, sabah: null, final: null, sonLider: null, sonLiderDuyuru: -99999, fener: 0,
      oyZaman: new Map(), sonIfadeler: {}, anilma: {}, yorumcular: new Map(), cagriZaman: {},
    };
    for (const iz of this.izleyiciler.values()) { iz.durum = 'koylu'; iz.isirildi = false; }
    this.aktifSoru = null; this.sorular = []; this.soruToken = (this.soruToken || 0) + 1;
    this.incelemeBaslat('yer', 'Önce nereye bakalım?', sen.yerler, sen.bulgular, ['1', '2']);
    if (this.sonGalip && this.sonGalipOkunur) this.replik(CAGRI.lobiGalip, { ad: this.sonGalipOkunur }, 'anlatici', 2);
  }

  incelemeBaslat(tip, soru, secenekler, bulgular, tuslar) {
    this.inceleme = { tip, soru, secenekler, bulgular, tuslar, oylar: new Map() };
    this.soyle('anlatici', `${soru} ${tuslar[0]} için ${secenekler[0]}, ${tuslar[1]} için ${secenekler[1]}.`, 'heyecan', 3);
  }

  incelemeSay() {
    const say = [0, 0];
    for (const i of this.inceleme.oylar.values()) say[i]++;
    return say;
  }

  incelemeBitir() {
    const adim = this.inceleme;
    if (!adim) return;
    const [a, b] = this.incelemeSay();
    const i = a === b ? this.sec([0, 1]) : Number(b > a);
    const karar = a === b ? (a === 0 ? 'İlk iz' : 'Eşitlik kurası') : 'Köyün seçimi';
    const metin = `${adim.secenekler[i]} · ${adim.bulgular[i]}`;
    this.tur.incelemeSonuc = { karar, metin };
    this.tur.ipuclari.push({ gun: Math.max(1, this.tur.gun), metin, inceleme: true });
    this.soyle('anlatici', `${karar}: ${adim.secenekler[i]}. ${adim.bulgular[i]}`, 'normal', 3);
    this.inceleme = null;
  }

  gir_gece() {
    const T = this.tur;
    T.gece++;
    T.kilitli = null;
    const vampirHayatta = !T.vampirSuruldu;
    let sonuc = 'isirik';
    if (!vampirHayatta) sonuc = 'sessiz';
    else if (T.gece > 1 && T.senaryo.sahteZafer && !T.sahteKullanildi && T.sonSurulenMasum) { sonuc = 'sahte'; T.sahteKullanildi = true; }
    const g = { sonuc, kurban: null, izleyiciKurban: null, kilpayi: null, vampirKazanir: false };
    if (sonuc !== 'sessiz') {
      let kid = T.senaryo.kurbanlar[T.kullanilanKurban.length];
      if (!kid || T.kullanilanKurban.includes(kid)) kid = this.sec(Object.keys(FIGURANLAR).filter(x => !T.kullanilanKurban.includes(x)));
      T.kullanilanKurban.push(kid);
      g.kurban = FIGURANLAR[kid];
      g.vampirKazanir = T.gece > 1 && (T.hayatta.length <= 2 || T.gun >= T.senaryo.ipuclari.length);
      const koylu = [...this.izleyiciler.values()].filter(iz => iz.durum === 'koylu');
      const uygun = koylu.filter(iz => this.zaman - iz.katilma > 45000);
      if (T.gece > 1 && uygun.length >= this.ayar.minIzleyiciIsirik && this.rnd() < this.ayar.isirikSans) {
        const iz = this.sec(uygun);
        iz.durum = 'hayalet'; iz.isirildi = true;
        g.izleyiciKurban = iz.ad; g.izleyiciKurbanIz = iz;
      } else if (koylu.length && this.rnd() < 0.55) {
        const kp = this.sec(koylu); g.kilpayi = kp.ad; g.kilpayiIz = kp;
      }
    }
    T.geceSonuc = g;
    this.soyle('anlatici', T.gece === 1 ? 'Olay gecesine dönüyoruz. Köyde kim uyanıktı?' : this.sec(ANLATICI.gece).m, 'fisilti', 3);
    this.yay({ tip: 'efekt', ad: 'gece' });
  }

  ipucuEkle(bonus = false) {
    const T = this.tur;
    if (bonus) {
      const m = T.bonusKalan.shift();
      if (!m) return null;
      T.ipuclari.push({ gun: T.gun, metin: m, bonus: true });
      return m;
    }
    const m = T.senaryo.ipuclari[Math.min(T.gun, T.senaryo.ipuclari.length) - 1];
    if (m && !T.ipuclari.some(x => x.metin === m)) T.ipuclari.push({ gun: T.gun, metin: m, bonus: false });
    return m;
  }

  gir_sabah() {
    const T = this.tur, g = T.geceSonuc;
    T.sabah = { sonuc: g.sonuc, kurban: g.kurban, izleyiciKurban: g.izleyiciKurban, kilpayi: g.kilpayi, acildi: g.sonuc === 'isirik' };
    if (g.sonuc === 'isirik') this.sabahAc();
    else {
      this.soyle('anlatici', 'Sabah oldu... ve... kimse ısırılmamış! Köy sessiz uyandı!', 'heyecan', 3);
      this.yay({ tip: 'efekt', ad: 'sessizSabah' });
    }
  }
  sabahAc() {
    const T = this.tur, g = T.geceSonuc;
    T.sabah.acildi = true;
    T.gun++;
    T.anilma = {};
    const ipucu = this.ipucuEkle();
    if (g.sonuc === 'sahte') {
      this.yay({ tip: 'efekt', ad: 'can' });
      this.soyle('anlatici', `Dur! Çan çalıyor! ${g.kurban} ısırılmış bulundu! Vampir hâlâ köyde!`, 'bagir', 3);
    } else if (T.gece === 1) {
      this.yay({ tip: 'efekt', ad: 'isirik' });
      this.soyle('anlatici', T.senaryo.giris, 'korku', 3);
    } else {
      this.yay({ tip: 'efekt', ad: 'isirik' });
      this.soyle('anlatici', `Sabah oldu... ve ${g.kurban} ısırılmış bulundu! Vampir hâlâ köyde!`, 'korku', 3);
    }
    if (g.izleyiciKurban) { const a = this.okunur(g.izleyiciKurbanIz); this.replik(a ? ANLATICI.izleyiciIsirildi : ANLATICI.izleyiciIsirildiAnonim, { ad: a }, 'anlatici', 3); }
    else if (g.kilpayi) { const a = this.okunur(g.kilpayiIz); this.replik(a ? ANLATICI.kilpayi : ANLATICI.kilpayiAnonim, { ad: a }, 'anlatici', 2); }
    if (!g.vampirKazanir && ipucu) this.replik(ANLATICI.ipucuOku, { gun: T.gun, ipucu }, 'anlatici', 3, { ipucu: true });
  }

  gir_sorgu() {
    this.yeniGelenler = [];
    this.tesekkur = this.tesekkur.filter(t => !karsilamaTuru(t.tur));
    this.kuyruk = this.kuyruk.filter(item => !item.karsilama);
    const { gun, senaryo } = this.tur;
    if (gun === 1 && senaryo.deney) {
      this.incelemeBaslat('deney', senaryo.soru, senaryo.islem, senaryo.deney, ['A', 'B']);
    }
    this.soyle('anlatici', 'Köylünün adını yaz, sorunu sor!', 'heyecan', 2, { soruDaveti: true });
  }

  gir_oylama() {
    const T = this.tur;
    T.oylar = new Map(); T.oyZaman = new Map(); T.sonOylar = []; T.sonLider = null;
    this.aktifSoru = null; this.sorular = []; this.soruToken++;
    this.kuyruk = this.kuyruk.filter(x => x.oncelik >= 3);
    this.soyle('anlatici', 'Oylama zamanı! Vampir kim? Yoruma şüphelinin numarasını ya da adını yazın!', 'bagir', 3);
  }

  oySayim() {
    const T = this.tur, say = {};
    for (const id of T.hayatta) say[id] = 0;
    for (const id of T.oylar.values()) if (id in say) say[id]++;
    let en = -1, liderler = [];
    for (const [id, n] of Object.entries(say)) {
      if (n > en) { en = n; liderler = [id]; } else if (n === en) liderler.push(id);
    }
    return { say, en, liderler, toplam: T.oylar.size };
  }

  gir_kilit() {
    const T = this.tur, s = this.oySayim();
    T.oyGecmisi.push({ gun: T.gun, oylar: [...T.oylar.entries()], zaman: new Map(T.oyZaman) });
    this.kuyruk = this.kuyruk.filter(x => x.oncelik >= 3);
    if (s.toplam === 0 || s.en <= 0) {
      T.kilitli = null;
      this.soyle('anlatici', 'Kimse oy vermedi! Köy karar veremedi... Vampir buna çok sevindi!', 'korku', 3);
      return;
    }
    const id = s.liderler.length > 1 ? this.sec(s.liderler) : s.liderler[0];
    T.kilitli = id; T.kilitOy = s.en;
    const k = karakter(id);
    if (s.liderler.length > 1) this.soyle('anlatici', 'Oylar berabere! Kura çekildi...', 'heyecan', 3);
    this.soyle('anlatici', `${k.ad} kuleye kilitlendi! Son sözün var mı ${k.kisa}?`, 'bagir', 3);
    const sz = T.senaryo.k[id].sonSoz;
    this.soyle(id, sz, /\.\.\.\s*$/.test(sz) ? 'uzgun' : /!\s*$/.test(sz) ? 'bagir' : 'ofke', 3);
    this.yay({ tip: 'efekt', ad: 'kilit', id });
  }

  gir_aksam() {
    const T = this.tur;
    if (T.kilitli) {
      const id = T.kilitli, k = karakter(id), vamp = id === T.senaryo.vampir;
      T.hayatta = T.hayatta.filter(x => x !== id);
      T.suruldu.push({ id, gun: T.gun, masum: !vamp });
      if (vamp) T.vampirSuruldu = true;
      T.sonSurulenMasum = !vamp;
      T.aksamSurulen = id;
      this.soyle('anlatici', `${k.ad} köyden sürüldü...`, 'uzgun', 3);
      this.soyle('anlatici', 'Peki... vampir hâlâ köyde mi?', 'fisilti', 3);
      this.yay({ tip: 'efekt', ad: 'surgun', id });
    } else {
      T.aksamSurulen = null; T.sonSurulenMasum = false;
      this.soyle('anlatici', 'Gece geliyor... ve vampir hâlâ aranızda.', 'fisilti', 3);
    }
  }

  gir_final() {
    const T = this.tur, vk = this.vampirKarakter();
    const kazanan = T.vampirSuruldu ? 'koy' : 'vampir';
    // Her izleyicinin bu turdaki doğru oy sayısı. Eşitlikte vampiri ilk bulan önde.
    const sayim = new Map();
    for (const g of T.oyGecmisi) {
      for (const [uid, id] of g.oylar) {
        if (id !== vk.id) continue;
        const z = g.gun * 1e9 + (g.zaman?.get(uid) ?? 0);
        const x = sayim.get(uid) || { uid, dogru: 0, ilk: Infinity };
        x.dogru++; x.ilk = Math.min(x.ilk, z);
        sayim.set(uid, x);
      }
    }
    const ad = uid => this.izleyiciler.get(uid)?.ad || uid;
    const sira = [...sayim.values()].sort((a, b) => b.dogru - a.dogru || a.ilk - b.ilk);
    const galip = sira[0] || null;
    for (const x of sira) {
      const sk = this.skor[x.uid] || (this.skor[x.uid] = { ad: ad(x.uid), dogru: 0, galibiyet: 0 });
      sk.ad = ad(x.uid); sk.dogru = (sk.dogru || 0) + x.dogru;
      if (x === galip) sk.galibiyet = (sk.galibiyet || 0) + 1;
    }
    this.sonGalip = galip ? ad(galip.uid) : null;
    const galipOkunur = galip ? this.okunur(this.izleyiciler.get(galip.uid)) : null;
    this.sonGalipOkunur = galipOkunur;
    T.final = {
      kazanan, vampirId: vk.id, aciklama: T.senaryo.final[kazanan],
      masumlar: T.suruldu.filter(x => x.masum).map(x => karakter(x.id).ad),
      galip: galip ? { ad: ad(galip.uid), dogru: galip.dogru } : null,
      dogrular: sira.slice(0, 10).map(x => ({ ad: ad(x.uid), dogru: x.dogru })),
    };
    try { this.skorKaydet(this.skor); } catch (e) { /* yut */ }
    this.yay({ tip: 'efekt', ad: kazanan === 'koy' ? 'zafer' : 'vampirKazandi' });
    if (kazanan === 'koy') this.soyle('anlatici', 'Köy kazandı! Vampir yakalandı!', 'heyecan', 3);
    else this.soyle('anlatici', 'Vampir kazandı! Köy karanlığa gömüldü!', 'korku', 3);
    this.soyle('anlatici', T.senaryo.final[kazanan], 'normal', 3);
    this.soyle(vk.id, kazanan === 'koy' ? 'Beni yakaladınız... Ama bir dahaki sefere o kadar şanslı olmayacaksınız!' : 'Hahaha! Bu köy artık benim!', 'alay', 3);
    if (galip) {
      this.soyle('anlatici', 'Peki bu turun galibi kim? En çok doğru oyu veren...', 'heyecan', 3, { galipAcilis: true });
      this.replik(galipOkunur ? ANLATICI.galip : ANLATICI.galipEkranda, { ad: galipOkunur, n: galip.dogru }, 'anlatici', 3, { galip: true });
      if (sira.length > 1) this.soyle('anlatici', `Vampiri bilen ${sira.length - 1} kişi daha vardı, onları da tebrik ediyoruz!`, 'heyecan', 2);
    } else {
      this.soyle('anlatici', 'Bu turda kimse vampire oy vermedi! Acaba bir sonraki turda sen bulabilecek misin?', 'heyecan', 3);
    }
    this.soyle('anlatici', 'Yeni tur birazdan! Acaba bu sefer vampiri bulabilecek misin?', 'heyecan', 1);
  }

  // Duruma göre mantıklı bir çağrı üret (kimse sormadıysa, biri çok anıldıysa, oy vermeyen varsa...)
  cagri() {
    const T = this.tur, f = this.faz.ad, z = this.zaman;
    const bos = (tur, ms) => z - (T.cagriZaman[tur] ?? -1e9) > ms;
    const yap = (tur, havuz, v, kim = 'anlatici', ek) => { T.cagriZaman[tur] = z; this.replik(havuz, v, kim, 1); if (ek) ek(); return true; };
    const aktif = [...T.yorumcular.entries()].filter(([, t]) => z - t < 120000).map(([u]) => this.izleyiciler.get(u)).filter(Boolean);
    const adaylar = [];
    if (f === 'sorgu') {
      const enAnilan = Object.entries(T.anilma).filter(([id]) => this.hayattaMi(id)).sort((a, b) => b[1] - a[1])[0];
      if (enAnilan && enAnilan[1] >= 3 && bos('anilan', 40000)) {
        const k = karakter(enAnilan[0]);
        adaylar.push(() => yap('anilan', CAGRI.anilan, { ilgi: ILGI[k.id], kisi: k.ad, kisa: k.kisa }, 'anlatici', () => this.replik(SOHBET[k.id].savunma, {}, k.id, 1)));
      }
      if (this.izleyiciler.size >= 6 && aktif.length < this.izleyiciler.size / 2 && bos('kalabalik', 60000)) adaylar.push(() => yap('kalabalik', CAGRI.sessizKalabalik, { n: this.izleyiciler.size }));
      const ip = T.ipuclari[T.ipuclari.length - 1];
      if (ip && bos('ipucu', 35000)) adaylar.push(() => yap('ipucu', CAGRI.ipucu, { ipucu: ip.metin }));
    }
    if (f === 'oylama') {
      const s = this.oySayim();
      const sirali = Object.entries(s.say).sort((a, b) => b[1] - a[1]);
      if (sirali.length > 1 && sirali[0][1] > 0 && sirali[0][1] - sirali[1][1] <= 1 && sirali[1][1] > 0 && bos('basabas', 12000))
        adaylar.push(() => yap('basabas', CAGRI.basabas, { a: karakter(sirali[0][0]).kisa, b: karakter(sirali[1][0]).kisa }));
      const vermeyen = aktif.filter(iz => !T.oylar.has(iz.uid) && this.okunur(iz));
      if (vermeyen.length && bos('vermeyen', 9000)) adaylar.push(() => yap('vermeyen', CAGRI.oyVermeyen, { ad: this.okunur(this.sec(vermeyen)) }));
      if (s.toplam > 0 && bos('oyDurum', 16000)) adaylar.push(() => yap('oyDurum', CAGRI.oyDurum, { oy: s.toplam }));
      if (s.en > 0 && s.liderler.length === 1 && bos('emin', 20000)) adaylar.push(() => yap('emin', CAGRI.emin, { kisi: karakter(s.liderler[0]).ad }));
    }
    if (f === 'bekleme') {
      const lider = Object.values(this.skor).sort((a, b) => (b.dogru || 0) - (a.dogru || 0))[0];
      const liderAd = lider && this.ayar.isimOku ? okunurIsim(lider.ad) : null;
      if (liderAd && lider.dogru > 0 && bos('lider', 30000)) adaylar.push(() => yap('lider', CAGRI.lobiLider, { ad: liderAd, n: lider.dogru }));
      if (bos('lobi', 15000)) adaylar.push(() => yap('lobi', CAGRI.lobi, {}));
    }
    if (!adaylar.length) return false;
    return this.sec(adaylar)();
  }

  // ───────────── ZAMAN ─────────────
  tick(dt) {
    this.zaman += dt;
    const f = this.faz;
    if (!this.duraklatildi) f.gecen += dt;
    this.konusmaIlerlet();

    // sahte zafer / sessiz sabah: 6. saniyede açılış
    if (f.ad === 'sabah' && !this.tur.sabah.acildi && !f.bayrak.acilis && f.gecen > 6000 && !this.konusmaVar(3)) {
      f.bayrak.acilis = true;
      if (this.tur.geceSonuc.sonuc === 'sahte') this.sabahAc();
      else {
        this.tur.sabah.gunes = true;
        this.yay({ tip: 'efekt', ad: 'gunes' });
        this.soyle('anlatici', 'Güneş doğdu... ve bütün gece tek bir kanat sesi duyulmadı. Vampir gitti!', 'heyecan', 3);
      }
    }
    if (f.ad === 'oylama') this.oylamaTick();
    if (f.ad === 'sorgu') {
      if (this.inceleme && f.gecen >= Math.min(20000, f.sure)) this.incelemeBitir();
      this.sorguTick();
    }
    if (f.ad === 'sorgu' || f.ad === 'sabah') this.fenerKontrol();
    this.karsilaTick();
    this.dolgu();

    if (f.gecen >= f.sure) {
      if (f.ad === 'sorgu' && (this.aktifSoru || this.konusma?.soru || this.kuyruk.some(item => item.soru))) return;
      if (SENARYOLU.has(f.ad) && this.konusmaVar(3) && f.gecen < f.sure + 25000) return;
      if (f.ad === 'sabah' && !this.tur.sabah.acildi && this.tur.geceSonuc.sonuc === 'sahte') { this.sabahAc(); return; }
      this.sonrakiFaz();
    }
  }

  oylamaTick() {
    const f = this.faz, kalan = f.sure - f.gecen;
    if (kalan < 10500 && !f.bayrak.s10) { f.bayrak.s10 = true; this.replik(ANLATICI.son10, {}, 'anlatici', 3); }
    if (kalan < 5200 && !f.bayrak.s5) { f.bayrak.s5 = true; this.replik(ANLATICI.son5, {}, 'anlatici', 3); }
    const s = this.oySayim(), T = this.tur;
    const lider = s.en > 0 && s.liderler.length === 1 ? s.liderler[0] : (s.en > 0 ? 'berabere' : null);
    if (lider && lider !== T.sonLider && this.zaman - T.sonLiderDuyuru > 6000 && kalan > 6000) {
      T.sonLider = lider; T.sonLiderDuyuru = this.zaman;
      if (lider === 'berabere') this.replik(ANLATICI.berabere, {}, 'anlatici', 2);
      else {
        this.replik(ANLATICI.lider, { kisi: karakter(lider).ad }, 'anlatici', 2);
        if (this.rnd() < 0.7) this.replik(SOHBET[lider].savunma, {}, lider, 2);
      }
    }
  }

  get soruAliniyor() {
    return this.faz.ad === 'sorgu' && this.faz.gecen < SORU_PENCERESI_MS && !this.faz.bayrak.secilenSoru;
  }

  sorguTick() {
    const f = this.faz;
    if (f.gecen >= SORU_PENCERESI_MS && f.sure - f.gecen < 10500 && !f.bayrak.s10 && !this.aktifSoru) {
      f.bayrak.s10 = true;
      this.replik(CAGRI.sorgu10, {}, 'anlatici', 2);
    }
    if (f.gecen < SORU_SECIM_MS || f.bayrak.secilenSoru) return;
    const aday = this.sorular.find(q => q.id === f.bayrak.panelAdayi);
    const secim = aday || (this.ayar.otoSoru && this.sorular[0]);
    if (secim) this.soruIsle(secim, !!aday);
    else if (f.gecen >= SORU_PENCERESI_MS && !f.bayrak.soruKapandi) {
      f.bayrak.soruKapandi = true;
      this.sorular = [];
      this.kuyruk = this.kuyruk.filter(item => !item.soruDaveti);
    }
  }

  fenerKontrol() {
    const T = this.tur;
    if (T.fener < this.ayar.fenerHedef) return;
    if (this.faz.ad !== 'sorgu') return;
    if (T.bonusGun === T.gun) return;
    T.fener = 0;
    if (!T.bonusKalan.length) {
      this.yay({ tip: 'efekt', ad: 'fener' });
      this.soyle('anlatici', 'Fenerler yandı! Köy pırıl pırıl, vampir saklanacak yer bulamıyor!', 'heyecan', 1);
      return;
    }
    const m = this.ipucuEkle(true);
    this.yay({ tip: 'efekt', ad: 'fener' });
    this.replik(ANLATICI.fener, {}, 'anlatici', 2);
    if (m) { T.bonusGun = T.gun; this.replik(ANLATICI.fenerIpucu, { ipucu: m }, 'anlatici', 2, { ipucu: true }); }
  }

  karsilaTick() {
    const f = this.faz.ad;
    if (!['bekleme', 'sorgu', 'oylama'].includes(f)) return;
    if (!this.aktifSoru && this.tesekkur.length && this.zaman - this.sonTesekkur > 9000 && !this.konusmaVar(2)) {
      const t = this.tesekkur.shift();
      const ad = this.okunur(t.iz);
      this.sonTesekkur = this.zaman;
      this.replik(ad ? ANLATICI[t.tur] : ANLATICI[t.tur + 'Anonim'], { ad }, 'anlatici', 1, { karsilama: karsilamaTuru(t.tur) });
      return;
    }
    if (!this.yeniGelenler.length || this.zaman - this.sonKarsila < this.ayar.karsilaAralik * 1000) return;
    if (this.konusmaVar(1)) return;
    const ad = [...new Set(this.yeniGelenler)].map(iz => this.okunur(iz)).filter(Boolean);
    this.yeniGelenler = [];
    this.sonKarsila = this.zaman;
    const havuz = !ad.length ? ANLATICI.karsilaAnonim : ad.length === 1 ? ANLATICI.karsila1 : ANLATICI.karsilaCok;
    this.replik(havuz, { ad: ad[0], a: ad[0], b: ad[1] }, 'anlatici', 1, { karsilama: true });
  }

  // Sessizlik olmasın: konuşma bitince kısa süre sonra yeni bir şey söyle
  dolgu() {
    if (this.konusma || this.kuyruk.length) return;
    if (this.zaman - this.sonKonusmaBitis < this.ayar.bosluk * 1000) return;
    const f = this.faz.ad, T = this.tur;
    if (f === 'sorgu') {
      if (this.aktifSoru || this.soruAliniyor) return;
      // önce duruma uygun mantıklı bir çağrı dene
      if (this.rnd() < 0.5 && this.cagri()) return;
      const x = this.rnd();
      if (x < 0.36) return this.tartisma();
      if (x < 0.5) { const id = this.sec(T.hayatta); const sz = T.senaryo.k[id].suphe; return this.soyle(id, sz, /!/.test(sz) ? 'ofke' : 'sakin', 0); }
      if (x < 0.6) { const id = this.sec(T.hayatta); const g = T.senaryo.k[id].gordu; return this.soyle(id, g[Math.min(T.gun, g.length) - 1], 'normal', 0); }
      if (x < 0.68) { const id = this.sec(T.hayatta); return this.replik(this.rnd() < 0.5 ? SOHBET[id].sakin : SOHBET[id].korku, {}, id, 0); }
      return this.tartisma();
    }
    if (f === 'oylama') {
      if (this.rnd() < 0.55 && this.cagri()) return;
      const s = this.oySayim();
      const x = this.rnd();
      if (s.toplam < 3 && x < 0.35) return this.replik(ANLATICI.oyAz, {}, 'anlatici', 0);
      if (s.en > 0 && s.liderler.length === 1) {
        const lider = s.liderler[0];
        if (x < 0.45) return this.replik(SOHBET[lider].savunma, {}, lider, 0);
        if (x < 0.7) {
          const diger = this.sec(T.hayatta.filter(id => id !== lider));
          if (diger) return this.replik(SOHBET[diger].suclama, { hedef: karakter(lider).kisa }, diger, 0);
        }
      }
      return this.replik(ANLATICI.oylama, {}, 'anlatici', 0);
    }
    if (f === 'bekleme') {
      if (this.rnd() < 0.45 && this.cagri()) return;
      const x = this.rnd();
      if (x < 0.35) return this.replik(ANLATICI.bekleme, {}, 'anlatici', 0);
      if (x < 0.7) return this.replik(ANLATICI.davet, {}, 'anlatici', 0);
      const id = this.sec(KARAKTERLER).id;
      return this.replik(SOHBET[id].davet, {}, id, 0);
    }
    if (f === 'gece' && this.faz.gecen > 1500) return this.replik(ANLATICI.gece, {}, 'anlatici', 0);
    if (f === 'aksam' && this.faz.gecen > 2000) return this.replik(ANLATICI.gece, {}, 'anlatici', 0);
    if (f === 'sabah' && T.sabah?.acildi) {
      const id = this.sec(T.hayatta);
      return this.rnd() < 0.5 ? this.replik(CAGRI.sabah, {}, 'anlatici', 0) : this.replik(SOHBET[id].korku, {}, id, 0);
    }
    if (f === 'kilit' && T.kilitli && !this.faz.bayrak.tepki) {
      this.faz.bayrak.tepki = true;
      const id = this.sec(T.hayatta.filter(x => x !== T.kilitli));
      if (id) return this.replik(CAGRI.kilitTepki, {}, id, 0);
    }
  }

  tartisma() {
    const T = this.tur;
    if (T.hayatta.length < 2) return;
    const a = this.sec(T.hayatta);
    const sz = T.senaryo.k[a].suphe;
    let b = T.hayatta.find(id => id !== a && sz.includes(karakter(id).kisa));
    if (!b || this.rnd() < 0.3) b = this.sec(T.hayatta.filter(id => id !== a));
    this.replik(SOHBET[a].suclama, { hedef: karakter(b).kisa }, a, 1);
    this.replik(SOHBET[b].savunma, {}, b, 1);
    if (this.rnd() < 0.45) {
      const c = T.hayatta.find(id => id !== a && id !== b && ['ogretmen', 'ebe', 'demirci'].includes(id));
      if (c) this.replik(SOHBET[c].sakin, {}, c, 1);
    }
  }

  // Sesli okunacak isim: izleyicinin kendi verdiği isim > kullanıcı adından çıkarılan isim > null (isimsiz cümle)
  okunur(iz) {
    if (!iz || !this.ayar.isimOku) return null;
    if (iz.ozelAd) return iz.ozelAd;
    if (iz.okunurAd === undefined) {
      iz.okunurAd = okunurIsim(iz.hamAd || iz.ad);
      if (iz.okunurAd) this.yay({ tip: 'isimHazir', ad: iz.okunurAd });
    }
    return iz.okunurAd;
  }

  // ───────────── İZLEYİCİ OLAYLARI ─────────────
  izleyiciEkle(uid, ad) {
    if (!uid) return null;
    let iz = this.izleyiciler.get(uid);
    if (!iz) {
      iz = { uid, ad: temizIsim(ad, uid), hamAd: ad || uid, durum: 'koylu', katilma: this.zaman, isirildi: false, fenerli: false, son: this.zaman };
      this.izleyiciler.set(uid, iz);
      if (this.faz.ad !== 'sorgu') {
        this.yeniGelenler.push(iz);
        if (this.yeniGelenler.length > 8) this.yeniGelenler.shift();
      }
      this.okunur(iz);
      this.yay({ tip: 'bildirim', ikon: '🏠', metin: `${iz.ad} köye katıldı` });
    }
    iz.son = this.zaman;
    return iz;
  }

  yorum(uid, ad, metin) {
    if (!uid || this.susturulan.has(uid)) return;
    const iz = this.izleyiciEkle(uid, ad);
    const m = String(metin || '').trim();
    if (!m) return;
    const f = this.faz.ad;
    this.tur.yorumcular.set(iz.uid, this.zaman);
    const oz = ozelIsim(m);
    if (oz !== undefined) {
      if (oz) {
        iz.ozelAd = oz;
        if (f !== 'sorgu') this.tesekkur.unshift({ tur: 'adim', iz });
        this.yay({ tip: 'isimHazir', ad: oz });
      }
      return;
    }
    if (f === 'sorgu' || f === 'sabah') {
      const t = tr(m);
      for (const k of KARAKTERLER) if (k.anahtar.some(a => t.includes(a))) this.tur.anilma[k.id] = (this.tur.anilma[k.id] || 0) + 1;
    }
    if (this.inceleme) {
      const i = this.inceleme.tuslar.indexOf(m.toLocaleUpperCase('tr-TR'));
      if (i >= 0) { this.inceleme.oylar.set(uid, i); return; }
    }
    if (f === 'oylama') {
      const id = this.oyCoz(m);
      if (id) return this.oyVer(iz, id);
    }
    if (this.soruAliniyor && !kotuMu(m)) {
      const soru = m.startsWith('?') || m.startsWith('¿') || /\?\s*$/.test(m);
      if (soru) {
        const hedef = this.hedefBul(m);
        if (hedef) this.soruEkle(iz, hedef, m);
      }
    }
  }

  hedefBul(m) {
    const t = tr(m);
    const no = t.match(/^\s*\?\s*([1-6])\b/);
    if (no) { const k = KARAKTERLER.find(x => x.no === +no[1]); if (k && this.hayattaMi(k.id)) return k.id; }
    const kel = t.split(/[^a-zçğıöşüâî0-9]+/).filter(Boolean);
    for (const w of kel) for (const k of KARAKTERLER) if (k.anahtar.some(a => w === a || (a.length > 3 && w.startsWith(a)))) if (this.hayattaMi(k.id)) return k.id;
    return null;
  }

  oyCoz(m) {
    const secim = tr(m).trim().replace(/^oy\s+/u, '').replace(/[!.]+$/u, '').trim().replace(/\s+/gu, ' ');
    const aday = KARAKTERLER.find(k => String(k.no) === secim || k.anahtar.includes(secim) || tr(k.ad) === secim);
    return aday && this.hayattaMi(aday.id) ? aday.id : null;
  }

  oyVer(iz, id) {
    const T = this.tur;
    if (T.oylar.get(iz.uid) === id) return;
    T.oylar.set(iz.uid, id);
    T.oyZaman.set(iz.uid, this.zaman);
    T.sonOylar.unshift({ ad: iz.ad, id, hayalet: iz.durum === 'hayalet' });
    if (T.sonOylar.length > 7) T.sonOylar.pop();
  }

  soruEkle(iz, hedef, metin) {
    if (this.sorular.length >= 25 && !this.sorular.some(q => q.uid === iz.uid)) return;
    this.sorular = this.sorular.filter(q => q.uid !== iz.uid);
    this.sorular.push({ id: ++this.sayac, uid: iz.uid, ad: iz.ad, hedef, metin: temizSoru(metin), zaman: this.zaman });
    if (this.faz.gecen >= SORU_SECIM_MS) this.sorguTick();
  }

  soruIsle(q, secildi) {
    this.aktifSoru = q;
    this.faz.bayrak.secilenSoru = { ad: q.ad, metin: q.metin, hedef: q.hedef };
    this.sorular = [];
    this.kuyruk = this.kuyruk.filter(item => item.oncelik >= 2 && !item.soruDaveti);
    const token = ++this.soruToken;
    const okunacak = this.ayar.soruOku === 'hepsi' || (secildi && this.ayar.soruOku === 'secilen');
    const ek = { soru: this.faz.bayrak.secilenSoru };
    const soranAd = this.okunur(this.izleyiciler.get(q.uid));
    if (okunacak) this.replik(ANLATICI.soruOku, { ad: soranAd || 'Bir köylü', soru: q.metin.replace(/^[?¿\s]+/, '') }, 'anlatici', 3, ek);
    this.yay({ tip: 'soru', soru: ek.soru });
    this.cevapAl(q).then(c => {
      if (token !== this.soruToken) return;
      this.tur.sonIfadeler[q.hedef] = { soru: q.metin, cevap: c.m };
      if (!c.gpt && soranAd && this.rnd() < 0.4) this.soyle(q.hedef, soranAd + '! ' + c.m, c.d, 3, { ...ek, parcalar: [{ m: soranAd + '!', tip: 'isim' }, { m: c.m, tip: 'sabit' }] });
      else this.soyle(q.hedef, c.m, c.d, 3, c.gpt ? { ...ek, parcalar: [{ m: c.m, tip: 'dinamik' }] } : ek);
      this.aktifSoru = null;
    });
  }

  bilgi(id) {
    const T = this.tur, k = T.senaryo.k[id], gun = Math.max(1, T.gun);
    return { gece: k.gece, gordu: k.gordu.slice(0, Math.min(gun, k.gordu.length)), suphe: k.suphe };
  }

  async cevapAl(q) {
    const T = this.tur;
    if (this.cevapUret) {
      try {
        const metin = await Promise.race([
          this.cevapUret({
            karakter: karakter(q.hedef), vampirMi: q.hedef === T.senaryo.vampir, senaryo: T.senaryo,
            bilgi: this.bilgi(q.hedef), gun: T.gun, ipuclari: T.ipuclari.map(x => x.metin), soru: q.metin, onceki: T.sonIfadeler[q.hedef],
            surulenler: T.suruldu.map(x => karakter(x.id).ad),
          }),
          new Promise(r => setTimeout(() => r(null), 7000)),
        ]);
        if (metin && !kotuMu(metin)) {
          const m = String(metin).trim();
          const etiket = m.match(/^\[(\w+)\]\s*/);
          const d = etiket && ['ofke', 'bagir', 'sakin', 'fisilti', 'korku', 'heyecan', 'alay', 'uzgun', 'normal'].includes(etiket[1]) ? etiket[1] : 'normal';
          const temiz = m.replace(/^\[\w+\]\s*/, '').replace(/\s+/g, ' ').slice(0, 220);
          if (temiz.length > 2) return { m: temiz, d, gpt: true };
        }
      } catch (e) { /* yedeğe düş */ }
    }
    return this.yedekCevap(q.hedef, q.metin);
  }

  yedekCevap(id, soru) {
    const T = this.tur, gen = GENEL[id], b = this.bilgi(id);
    const s = tr(soru);
    const p = a => this.sec(a);
    if (kotuMu(soru)) return { m: p(gen.kaba), d: 'ofke' };
    if (/(vampir mi|vampir misin|vampirsin|sen misin|sen mi|sensin|itiraf|yalancı|yalan söyl)/.test(s)) return { m: p(gen.inkar), d: 'ofke' };
    if (/(nerede|nerde|neredeydin|nerdeydin|ne yapıyordun|ne yapiyordun|ne yaptın|ne yaptin|dün gece|dun gece|gece ne)/.test(s)) return { m: b.gece, d: 'normal' };
    if (/(gördün|gordun|gören|goren|şahit|sahit|duydun|ne gördün|bir şey|birşey|fark ettin)/.test(s)) return { m: b.gordu[b.gordu.length - 1], d: 'normal' };
    if (/(\bkim\b|kimden|kimi\b|şüphe|suphe|sence|neden|niye|niçin)/.test(s)) return { m: b.suphe, d: /!/.test(b.suphe) ? 'ofke' : 'sakin' };
    if (/(sarımsak|sarimsak|ayna|güneş|gunes|soğan)/.test(s)) return { m: p(gen.sarimsak), d: 'normal' };
    if (/(selam|merhaba|nasılsın|nasilsin|naber|\bsa\b|slm|günaydın)/.test(s)) return { m: p(gen.selam), d: 'normal' };
    return this.rnd() < 0.5 ? { m: b.gordu[b.gordu.length - 1], d: 'normal' } : { m: p(gen.bilmem), d: 'normal' };
  }

  begeni(uid, ad, adet = 1) {
    if (uid) this.izleyiciEkle(uid, ad);
    this.tur.fener = Math.min(this.ayar.fenerHedef, this.tur.fener + Math.max(1, adet));
  }
  takip(uid, ad) {
    const iz = this.izleyiciEkle(uid, ad);
    this.tur.fener = Math.min(this.ayar.fenerHedef, this.tur.fener + 25);
    if (iz) {
      if (this.faz.ad !== 'sorgu') this.tesekkur.push({ tur: 'takip', iz });
      this.yay({ tip: 'bildirim', ikon: '🏡', metin: `${iz.ad} köye taşındı!` });
    }
  }
  paylasim(uid, ad) {
    const iz = this.izleyiciEkle(uid, ad);
    this.tur.fener = Math.min(this.ayar.fenerHedef, this.tur.fener + 40);
    if (iz) { this.tesekkur.push({ tur: 'paylas', iz }); this.yay({ tip: 'bildirim', ikon: '📣', metin: `${iz.ad} haberi yaydı!` }); }
  }
  // Hediye oyunu ETKİLEMEZ: sadece teşekkür ve görsel fener/havai fişek
  hediye(uid, ad, elmas = 1, adet = 1) {
    const iz = this.izleyiciEkle(uid, ad);
    if (!iz) return;
    iz.fenerli = true;
    const toplam = elmas * adet;
    this.yay({ tip: 'efekt', ad: toplam >= 99 ? 'havaiFisek' : 'fenerAs', isim: iz.ad });
    if (!this.tesekkur.some(t => t.iz === iz && t.tur === 'hediye')) this.tesekkur.push({ tur: 'hediye', iz });
    if (this.tesekkur.length > 5) this.tesekkur.shift();
  }

  // ───────────── YÖNETİM PANELİ ─────────────
  komut(k, v) {
    switch (k) {
      case 'sonraki': if (this.faz.ad === 'sabah' && !this.tur.sabah.acildi && this.tur.geceSonuc.sonuc === 'sahte') this.sabahAc(); this.kuyruk = this.kuyruk.filter(x => x.oncelik >= 3); this.sonrakiFaz(); break;
      case 'sureEkle': this.faz.sure += (v || 30) * 1000; break;
      case 'duraklat': this.duraklatildi = !this.duraklatildi; break;
      case 'soruSec': {
        if (!this.soruAliniyor || !this.sorular.some(q => q.id === v)) break;
        this.faz.bayrak.panelAdayi = v;
        this.sorguTick();
        break;
      }
      case 'soruSil': this.sorular = this.sorular.filter(x => x.id !== v); break;
      case 'sustur': {
        if (this.susturulan.has(v)) this.susturulan.delete(v); else { this.susturulan.add(v); this.sorular = this.sorular.filter(x => x.uid !== v); }
        break;
      }
      case 'senaryo': this.sonrakiSenaryo = v; if (this.faz.ad === 'bekleme') { this.kuyruk = []; this.fazGir('bekleme'); } break;
      case 'yeniTur': this.kuyruk = []; this.konusma = null; this.fazGir('bekleme'); break;
      case 'ayar': if (v && v.k in this.ayar) this.ayar[v.k] = v.v; break;
      case 'anlat': if (v) this.soyle('anlatici', String(v).slice(0, 200), 'normal', 3); break;
      default: break;
    }
  }

  // ───────────── DURUM ─────────────
  durum(panel = false) {
    const T = this.tur, f = this.faz;
    const s = (f.ad === 'oylama' || f.ad === 'kilit') ? this.oySayim() : null;
    const izl = [...this.izleyiciler.values()];
    const son = izl.slice().sort((a, b) => b.son - a.son).slice(0, 18).map(x => ({ ad: x.ad, durum: x.durum, fenerli: x.fenerli }));
    const tablo = Object.values(this.skor).filter(x => (x.dogru || 0) > 0).sort((a, b) => (b.dogru || 0) - (a.dogru || 0) || (b.galibiyet || 0) - (a.galibiyet || 0)).slice(0, 5).map(x => ({ ad: x.ad, dogru: x.dogru || 0, galibiyet: x.galibiyet || 0 }));
    const d = {
      faz: { ad: f.ad, sure: f.sure, gecen: f.gecen, duraklat: this.duraklatildi },
      inceleme: this.inceleme ? { soru: this.inceleme.soru, secenekler: this.inceleme.secenekler, tuslar: this.inceleme.tuslar, say: this.incelemeSay(), tip: this.inceleme.tip } : null,
      incelemeSonuc: T.incelemeSonuc || null,
      senaryo: { id: panel ? T.senaryo.id : T.senaryo.dosya, baslik: T.senaryo.baslik, giris: T.senaryo.giris },
      gun: T.gun, gece: T.gece,
      karakterler: KARAKTERLER.map(k => ({ id: k.id, no: k.no, ad: k.ad, kisa: k.kisa,
        durum: T.hayatta.includes(k.id) ? (T.kilitli === k.id ? 'kilitli' : 'hayatta') : 'suruldu',
        masum: T.final ? k.id !== T.senaryo.vampir : null })),
      ipuclari: T.ipuclari,
      oy: s ? { say: s.say, toplam: s.toplam, en: s.en, liderler: s.liderler, son: T.sonOylar } : null,
      kilitli: T.kilitli, kilitOy: T.kilitOy || 0, aksamSurulen: T.aksamSurulen || null,
      sabah: T.sabah, final: T.final,
      konusma: this.konusma ? { kim: this.konusma.kim, metin: this.konusma.metin, soru: this.konusma.soru || null } : null,
      soruPenceresi: f.ad === 'sorgu' ? {
        acik: this.soruAliniyor, kalan: Math.max(0, SORU_PENCERESI_MS - f.gecen),
        secilen: f.bayrak.secilenSoru || null,
      } : null,
      aktifSoru: this.aktifSoru ? { ad: this.aktifSoru.ad, metin: this.aktifSoru.metin, hedef: this.aktifSoru.hedef } : null,
      izleyici: { toplam: izl.length, hayalet: izl.filter(x => x.durum === 'hayalet').length, son },
      fener: { deger: T.fener, hedef: this.ayar.fenerHedef, bonusVar: T.bonusKalan.length > 0 && T.bonusGun !== T.gun },
      tablo, sonGalip: this.sonGalip || null,
      galipAcik: !!(this.konusma?.galip || (T.final && this.faz.bayrak.galipGosterildi)),
    };
    if (this.konusma?.galip) this.faz.bayrak.galipGosterildi = true;
    if (panel) {
      d.vampir = T.senaryo.vampir;
      d.ters = T.senaryo.ters;
      d.panelAdayi = f.bayrak.panelAdayi || null;
      d.sorular = this.sorular.map(q => ({ ...q }));
      d.kuyruk = this.kuyruk.map(x => ({ kim: x.kim, metin: x.metin, oncelik: x.oncelik }));
      d.ayar = { ...this.ayar };
      d.senaryolar = SENARYOLAR.map(x => ({ id: x.id, baslik: x.baslik, vampir: x.vampir, ters: x.ters }));
      d.sonraki = this.sonrakiSenaryo;
      d.susturulan = [...this.susturulan];
    }
    return d;
  }
}

export { FAZ_SIRA };

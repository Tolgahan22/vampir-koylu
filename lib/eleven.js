// ElevenLabs seslendirme: her cümle bir kez üretilir, diske kaydedilir, sonra bedava tekrar çalınır.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const API = process.env.ELEVEN_API || 'https://api.elevenlabs.io';
const ETIKET = { ofke: '[angry]', bagir: '[shouting]', sakin: '[calm]', fisilti: '[whispers]', korku: '[nervous]', heyecan: '[excited]', alay: '[mischievously]', uzgun: '[sad]', normal: '' };
const AYAR = {
  ofke: { stability: 0.3, style: 0.75 }, bagir: { stability: 0.25, style: 0.85 }, sakin: { stability: 0.75, style: 0.1 },
  fisilti: { stability: 0.6, style: 0.35 }, korku: { stability: 0.35, style: 0.55 }, heyecan: { stability: 0.35, style: 0.6 },
  alay: { stability: 0.4, style: 0.6 }, uzgun: { stability: 0.55, style: 0.4 }, normal: { stability: 0.5, style: 0.3 },
};
const ROLLER = ['anlatici', 'muhtar', 'bakkal', 'ebe', 'coban', 'ogretmen', 'demirci'];
// Otomatik ses seçimi için istekler: cinsiyet, yaş tercihi
const ISTEK = {
  anlatici: { g: 'male', yas: ['middle_aged', 'old', 'middle aged'], tercih: /deep|narrat|story|documentary|calm/i },
  muhtar: { g: 'male', yas: ['middle_aged', 'old', 'middle aged'] },
  bakkal: { g: 'male', yas: ['middle_aged', 'young', 'middle aged'] },
  ebe: { g: 'female', yas: ['old', 'middle_aged', 'middle aged'] },
  coban: { g: 'male', yas: ['young'] },
  ogretmen: { g: 'female', yas: ['young', 'middle_aged', 'middle aged'] },
  demirci: { g: 'male', yas: ['middle_aged', 'old', 'middle aged'], tercih: /deep|gravel|rough|strong/i },
};

export class Eleven {
  constructor({ anahtar, model, isimModel, sesler = {}, klasor, log = console.log }) {
    this.anahtar = anahtar;
    this.model = model || 'eleven_v3';
    // İsimler kısa (tek kelime). v3 çok kısa metinde tutarsız olabildiği için isimler hızlı modelle, aynı sesle üretilir.
    this.isimModel = isimModel || 'eleven_flash_v2_5';
    this.sesler = { ...sesler };
    this.klasor = klasor;
    this.log = log;
    this.uretilen = 0;
    this.kapaliKadar = 0;
    this.durum = anahtar ? 'hazırlanıyor' : 'kapalı (anahtar yok)';
    this.bekleyen = new Map();
    this.aktif = 0;
    this.sira = [];
    fs.mkdirSync(klasor, { recursive: true });
  }

  get acik() { return !!this.anahtar && Date.now() > this.kapaliKadar && Object.keys(this.sesler).length > 0; }
  modelSec(item) { return item.tip === 'isim' ? this.isimModel : this.model; }
  etiketliMi(model) { return /v3|v4/.test(model); }

  async hazirla() {
    if (!this.anahtar) return;
    const eksik = ['anlatici', 'demirci', 'ebe', 'ogretmen', 'coban', 'bakkal', 'muhtar'].filter(r => !this.sesler[r]);
    if (eksik.length) {
      try {
        const r = await fetch(API + '/v1/voices', { headers: { 'xi-api-key': this.anahtar } });
        if (!r.ok) throw new Error('voices ' + r.status + ' ' + (await r.text()).slice(0, 200));
        const { voices = [] } = await r.json();
        const kullanilan = new Set(Object.values(this.sesler));
        for (const rol of eksik) {
          const ist = ISTEK[rol];
          const puan = v => {
            const l = v.labels || {}; let p = 0;
            if ((l.gender || '').toLowerCase() === ist.g) p += 10;
            const y = (l.age || '').toLowerCase();
            const yi = ist.yas.indexOf(y); if (yi >= 0) p += 6 - yi * 2;
            if (ist.tercih && ist.tercih.test(`${v.name} ${l.description || ''} ${l.use_case || ''} ${l.descriptive || ''}`)) p += 3;
            if (/tr|turk/i.test(`${l.accent || ''} ${l.language || ''} ${v.name}`)) p += 4;
            if (v.category && v.category !== 'premade') p += 1;
            if (kullanilan.has(v.voice_id)) p -= 8;
            return p;
          };
          const en = voices.slice().sort((a, b) => puan(b) - puan(a))[0];
          if (en) { this.sesler[rol] = en.voice_id; kullanilan.add(en.voice_id); this.log(`  ses: ${rol.padEnd(9)} → ${en.name} (${en.voice_id})`); }
        }
      } catch (e) {
        this.log('ElevenLabs ses listesi alınamadı: ' + e.message);
      }
    }
    this.durum = this.acik ? `açık (${this.model})` : 'kapalı (ses bulunamadı)';
  }

  anahtarUret(item) {
    const ses = this.sesler[item.kim] || this.sesler.anlatici;
    const model = this.modelSec(item);
    const metin = this.metin(item);
    return crypto.createHash('sha1').update(`${model}|${ses}|${item.tip === 'isim' ? 'isim' : item.d}|${metin}`).digest('hex').slice(0, 20);
  }

  metin(item) {
    const temiz = String(item.metin).replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
    if (item.tip === 'isim' || !this.etiketliMi(this.modelSec(item))) return temiz;
    const e = ETIKET[item.d] || '';
    return e ? `${e} ${temiz}` : temiz;
  }

  onbellekte(item) { return fs.existsSync(path.join(this.klasor, this.anahtarUret(item) + '.mp3')); }

  // { dosya: '/ses/xxx.mp3', sure: saniye } ya da null
  uret(item) {
    if (!this.anahtar || !Object.keys(this.sesler).length) return Promise.resolve(null);
    const k = this.anahtarUret(item);
    if (this.bekleyen.has(k)) return this.bekleyen.get(k);
    const dosyaYolu = path.join(this.klasor, k + '.mp3');
    if (fs.existsSync(dosyaYolu)) {
      const sure = fs.statSync(dosyaYolu).size * 8 / 128000;
      return Promise.resolve({ dosya: `/ses/${k}.mp3`, sure });
    }
    if (!this.acik) return Promise.resolve(null);
    const p = new Promise(res => this.sira.push({ item, k, dosyaYolu, res })).finally(() => setTimeout(() => this.bekleyen.delete(k), 1000));
    this.bekleyen.set(k, p);
    this.isle();
    return p;
  }

  isle() {
    while (this.aktif < 3 && this.sira.length) {
      const is = this.sira.shift();
      this.aktif++;
      this.istek(is).then(is.res, () => is.res(null)).finally(() => { this.aktif--; this.isle(); });
    }
  }

  async istek({ item, k, dosyaYolu }, dilKodu = true) {
    const ses = this.sesler[item.kim] || this.sesler.anlatici;
    const metin = this.metin(item);
    const model = this.modelSec(item);
    const vs = this.etiketliMi(model) ? { stability: 0.5, similarity_boost: 0.75 }
      : { ...(item.tip === 'isim' ? AYAR.heyecan : AYAR[item.d] || AYAR.normal), similarity_boost: 0.75, use_speaker_boost: true };
    const govde = { text: metin, model_id: model, voice_settings: vs };
    if (dilKodu) govde.language_code = 'tr';
    const ctrl = new AbortController();
    const zaman = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(`${API}/v1/text-to-speech/${ses}?output_format=mp3_44100_128`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'xi-api-key': this.anahtar, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify(govde),
      });
      if (!r.ok) {
        const hata = (await r.text()).slice(0, 300);
        if (dilKodu && (r.status === 400 || r.status === 422) && /language/i.test(hata)) return this.istek({ item, k, dosyaYolu }, false);
        if (r.status === 401 || r.status === 402 || r.status === 429 || /quota|credit/i.test(hata)) {
          this.kapaliKadar = Date.now() + 5 * 60 * 1000;
          this.durum = 'geçici kapalı: ' + (/quota|credit/i.test(hata) ? 'kredi bitti' : 'hata ' + r.status) + ' (Mac sesine geçildi)';
        }
        this.log(`ElevenLabs hata ${r.status}: ${hata}`);
        return null;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(dosyaYolu, buf);
      this.uretilen += metin.length;
      this.durum = `açık (${this.model})`;
      return { dosya: `/ses/${k}.mp3`, sure: buf.length * 8 / 128000 };
    } catch (e) {
      this.log('ElevenLabs istek hatası: ' + e.message);
      return null;
    } finally { clearTimeout(zaman); }
  }
}

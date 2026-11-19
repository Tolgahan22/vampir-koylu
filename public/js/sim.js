// Sahte izleyiciler: demo ve test için. Gerçek yayında kullanılmaz.
import { KARAKTERLER } from './senaryolar.js';

const ADLAR = ['ayse_34', 'mehmet.k', 'zeynep', 'burak_06', 'elif.nur', 'can_ankara', 'selin_ist', 'emre', 'deniz_35', 'kubra',
  'oguz', 'merve.b', 'hakan_16', 'busra', 'tolga', 'gamze_07', 'serkan', 'irem', 'yusuf_44', 'ece', 'baris', 'dilara', 'kaan', 'nisa'];
const SORULAR = ['?{k} dün gece neredeydin', '?{k} ne gördün', '?{k} sence vampir kim', '?{k} vampir misin',
  '?{k} sarımsak sever misin', '{k} neden bu kadar sessizsin?', '?{k} neden şüphelisin', '?{k} gece ne yapıyordun'];
const SOHBET = ['selam', 'hazırım', 'vampir kim ya', 'bence hasan', 'çok gerildim', 'merhaba köy', 'ben buradayım', 'heyecanlı'];

export class Simulator {
  constructor(oyun, opts = {}) {
    this.oyun = oyun;
    this.hiz = opts.hiz || 1;
    this.havuz = ADLAR.slice().sort(() => Math.random() - 0.5);
    this.aktif = [];
    this.t = 0;
    this.oyVerdi = new Set();
    this.sonFaz = null;
  }
  r() { return Math.random(); }
  sec(a) { return a[Math.floor(this.r() * a.length)]; }
  tick(dt) {
    const o = this.oyun, f = o.faz.ad, sn = dt / 1000 * this.hiz;
    if (f !== this.sonFaz) { this.sonFaz = f; this.oyVerdi.clear(); }
    // katılım
    if (this.havuz.length && this.r() < sn * (this.aktif.length < 6 ? 0.6 : 0.12)) {
      const ad = this.havuz.shift();
      this.aktif.push(ad);
      o.yorum(ad, ad.replace(/[._]/g, ' '), this.sec(SOHBET));
    }
    if (!this.aktif.length) return;
    if (this.r() < sn * 0.8) o.begeni(this.sec(this.aktif), null, 5 + Math.floor(this.r() * 15));
    if (this.r() < sn * 0.015) o.takip(this.sec(this.aktif), null);
    if (this.r() < sn * 0.01) o.paylasim(this.sec(this.aktif), null);
    if (this.r() < sn * 0.012) o.hediye(this.sec(this.aktif), null, this.r() < 0.2 ? 100 : 1, 1);
    if (o.inceleme && this.r() < sn * 0.85) {
      const ad = this.sec(this.aktif);
      o.yorum(ad, null, this.sec(o.inceleme.tuslar));
    }
    if (o.soruAliniyor && this.r() < sn * 0.35) {
      const hay = o.tur.hayatta;
      const hid = this.sec(hay); const k = KARAKTERLER.find(x => x.id === hid);
      o.yorum(this.sec(this.aktif), null, this.sec(SORULAR).replace('{k}', k.kisa));
    }
    if (f === 'oylama' && this.r() < sn * 0.9) {
      const kim = this.sec(this.aktif);
      if (this.oyVerdi.has(kim) && this.r() < 0.8) return;
      this.oyVerdi.add(kim);
      const hay = o.tur.hayatta;
      const vamp = o.tur.senaryo.vampir;
      const id = (this.r() < (this.vampirEgilim ?? 0.24) && hay.includes(vamp)) ? vamp : this.sec(hay);
      const k = KARAKTERLER.find(x => x.id === id);
      o.yorum(kim, null, this.r() < 0.6 ? String(k.no) : this.sec([k.kisa, 'oy ' + k.kisa, k.kisa + '!!']));
    }
  }
}

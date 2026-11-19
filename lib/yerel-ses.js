import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export class YerelSes {
  constructor(python) {
    this.python = python;
    this.worker = null;
    this.pending = new Map();
    this.durum = 'yerel EMA + OpenVoice';
  }

  baslat() {
    const script = fileURLToPath(new URL('./yerel_ses.py', import.meta.url));
    const worker = spawn(this.python, ['-u', script], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, HF_HUB_OFFLINE: '1' },
    });
    this.worker = worker;
    const kapat = () => {
      if (this.worker !== worker) return;
      this.worker = null;
      this.durum = 'yerel ses kullanılamıyor';
      for (const is of this.pending.values()) is.bitir(null);
      this.pending.clear();
    };
    worker.on('error', kapat);
    worker.on('close', kapat);
    worker.stdin.on('error', () => worker.kill());
    const lines = createInterface({ input: worker.stdout });
    lines.on('line', line => {
      let yanit;
      try { yanit = JSON.parse(line); } catch { return; }
      const is = this.pending.get(yanit.id);
      if (!is || this.worker !== worker) return;
      this.pending.delete(yanit.id);
      const ok = yanit.sure > 0;
      this.durum = ok ? 'açık (EMA + OpenVoice)' : 'yerel ses üretilemedi';
      is.bitir(ok ? { dosyalar: ['/ses/yerel-' + yanit.id + '.wav'], sure: yanit.sure } : null);
    });
    return worker;
  }

  uret({ kim, metin }) {
    const surum = ['muhtar', 'bakkal'].includes(kim) ? 'ema-ov-v1' : 'ema-ov-v2';
    const sesProfili = kim === 'anlatici' ? 'ema-orijinal-v1' : surum;
    const id = createHash('sha256').update(JSON.stringify([sesProfili, kim, metin])).digest('hex');
    if (this.pending.has(id)) return this.pending.get(id).sonuc;
    if (this.pending.size >= 12) return Promise.resolve(null);
    const worker = this.worker || this.baslat();
    let bitir;
    const sonuc = new Promise(resolve => { bitir = resolve; });
    const timer = setTimeout(() => worker.kill(), 30000);
    this.pending.set(id, { sonuc, bitir: ses => { clearTimeout(timer); bitir(ses); } });
    worker.stdin.write(JSON.stringify({ id, kim, metin }) + '\n');
    return sonuc;
  }
}

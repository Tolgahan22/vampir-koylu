// .env dosyasını okur (ek paket gerekmesin diye)
import fs from 'node:fs';
import path from 'node:path';
export function envOku(kok) {
  const env = { ...process.env };
  try {
    for (const satir of fs.readFileSync(path.join(kok, '.env'), 'utf8').split(/\r?\n/)) {
      const m = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !satir.trim().startsWith('#') && m[2] !== '') env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* .env yok */ }
  return env;
}
export const ROLLER = ['anlatici', 'muhtar', 'bakkal', 'ebe', 'coban', 'ogretmen', 'demirci'];
export const sesAyarlari = env => Object.fromEntries(ROLLER.map(r => [r, env['ELEVEN_SES_' + r.toUpperCase()]]).filter(([, v]) => v));

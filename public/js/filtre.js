// Küfür / uygunsuz içerik filtresi ve isim temizleme
// Yanlış pozitif çıkabilir (bir soru düşer, isim "Köylü#1234" olur), bu kabul edilebilir.

const TAM_KELIME = new Set([
  'amk', 'aq', 'amq', 'amına', 'amina', 'aminakoyim', 'amcık', 'amcik', 'oç', 'oc', 'piç', 'pic', 'göt', 'götü', 'götün',
  'götveren', 'götlek', 'ibne', 'ipne', 'gavat', 'kaltak', 'yavşak', 'yavsak', 'şerefsiz', 'serefsiz', 'pezevenk', 'kahpe',
  'fahişe', 'fahise', 'orospu', 'orosbu', 'orspu', 'sürtük', 'surtuk', 'dalyarak', 'yarrak', 'yarak', 'yarram', 'taşak', 'tasak',
  'am', 'amı', 'sex', 'seks', 'porno', 'porn', 'nude', 'fuck', 'fck', 'shit', 'bitch', 'dick', 'pussy', 'cunt', 'whore', 'slut',
  'nigger', 'nigga', 'puşt', 'pust', 'kancık', 'kancik', 'ananı', 'anani', 'avradını', 'bacını', 'sikik', 'sokuk', 'meme',
]);
const ON_EK = ['sik', 'amına', 'amina', 'orospu', 'orosbu', 'yarra', 'fuck', 'porn', 'sikt', 'pezeven', 'ibneli', 'götveren', 'ananı', 'anani', 'amcı', 'amcı'];
const ICINDE = ['orospu', 'siktir', 'sikerim', 'sikeyim', 'amınakoy', 'aminakoy', 'yarrak', 'fuck', 'porno', 'pezevenk', 'nigger'];

function normal(s) {
  return String(s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's')
    .replace(/(.)\1{2,}/g, '$1$1');
}

export function kotuMu(metin) {
  const n = normal(metin);
  const sik = n.replace(/[^a-zçğıöşü]/g, '');
  for (const p of ICINDE) if (sik.includes(p)) return true;
  const kelimeler = n.split(/[^a-zçğıöşü]+/).filter(Boolean);
  for (const k of kelimeler) {
    if (TAM_KELIME.has(k)) return true;
    for (const p of ON_EK) if (k.startsWith(p)) return true;
  }
  if (/https?:\/\/|www\.|\.com\b/.test(n)) return true;
  return false;
}

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return h;
}

// Ekranda görünen ve sesli okunan isim
export function temizIsim(ad, kimlik) {
  let s = String(ad || kimlik || '').normalize('NFKC');
  s = s.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/[_.]+/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/[^\p{L}\p{N} ']/gu, '').trim();
  if (s.length > 16) s = s.slice(0, 16).trim();
  if (!s || s.length < 2 || kotuMu(s) || kotuMu(kimlik)) return 'Köylü' + (hash(kimlik || ad) % 9000 + 1000);
  return s;
}

// ───────── Sesli okunacak isim ─────────
// TikTok isimleri "xX_kral_34_Xx", "𝓐𝔂𝓼𝓮 🌸", "user8473629" gibi olabiliyor.
// Okunabilir bir ilk isim çıkarmaya çalışır, çıkaramazsa null döner (o zaman isimsiz cümle söylenir).
const TR_ISIM = Object.fromEntries(`ayse:ayşe aysegul:ayşegül aysenur:ayşenur ozge:özge ozlem:özlem ozgur:özgür ozan:ozan oguz:oğuz oguzhan:oğuzhan
dogan:doğan dogukan:doğukan cagri:çağrı cagla:çağla cagatay:çağatay ugur:uğur ugurcan:uğurcan umit:ümit omer:ömer sule:şule seyma:şeyma
busra:büşra kubra:kübra cigdem:çiğdem gokhan:gökhan gokce:gökçe goksu:göksu gozde:gözde tugba:tuğba tugce:tuğçe gulay:gülay gulsah:gülşah
gulsen:gülşen gul:gül gulsum:gülsüm guler:güler gunes:güneş gonul:gönül muge:müge mujde:müjde turkan:türkan sukran:şükran sukru:şükrü
sukriye:şükriye hulya:hülya huseyin:hüseyin husnu:hüsnü sevval:şevval zubeyde:zübeyde nazli:nazlı akin:akın tulay:tülay sahin:şahin
serif:şerif sener:şener sumeyye:sümeyye baris:barış kivanc:kıvanç kagan:kağan yagiz:yağız yagmur:yağmur ozden:özden oznur:öznur
eylul:eylül isik:ışık ciler:çiler cicek:çiçek gulizar:gülizar ilkay:ilkay sevgul:sevgül dilsad:dilşad ercument:ercüment ozkan:özkan
nur:nur elif:elif zeynep:zeynep emre:emre mert:mert burak:burak tolga:tolga mehmet:mehmet ahmet:ahmet ali:ali veli:veli can:can cem:cem
selin:selin irem:irem ece:ece nisa:nisa deniz:deniz onur:onur kaan:kaan berk:berk hakan:hakan serkan:serkan murat:murat fatma:fatma
emine:emine hatice:hatice merve:merve esra:esra ebru:ebru seda:seda sinem:sinem gizem:gizem dilara:dilara melis:melis yusuf:yusuf
mustafa:mustafa ibrahim:ibrahim ismail:ismail halil:halil fatih:fatih kemal:kemal hasan:hasan huseyn:hüseyin enes:enes furkan:furkan
tolgahan:tolgahan mertcan:mertcan emircan:emircan alican:alican berkay:berkay arda:arda efe:efe eren:eren emir:emir yigit:yiğit cagan:çağan asli:aslı asya:asya duru:duru defne:defne ela:ela`
  .split(/\s+/).filter(Boolean).map(x => x.split(':')));
const GENEL_KELIME = new Set(['user', 'kullanici', 'kullanıcı', 'tiktok', 'official', 'resmi', 'the', 'xx', 'live', 'tv', 'real', 'its', 'im', 'mr',
  'mrs', 'bay', 'bayan', 'gaming', 'game', 'games', 'oyun', 'yt', 'ig', 'insta', 'channel', 'kanal', 'fan', 'fans', 'by', 'and', 've', 'ben', 'benim']);

function isimKoku(k) {
  if (TR_ISIM[k]) return TR_ISIM[k];
  // "aysekaya" -> "ayşe" (bilinen bir ismin önek olarak geçtiği durum)
  let en = '';
  if (k.length >= 8) for (const a of Object.keys(TR_ISIM)) if (a.length >= 3 && a.length > en.length && k.startsWith(a) && k.length - a.length >= 4) en = a;
  return en ? TR_ISIM[en] : null;
}

export function okunabilirMi(k) {
  if (k.length < 2 || k.length > 12) return false;
  if (!/^[a-zçğıöşüâîû']+$/.test(k)) return false;
  if (!/[aeıioöuüâîû]/.test(k)) return false;
  if (/[^aeıioöuüâîû']{4,}/.test(k)) return false;
  if (/(.)\1\1/.test(k)) return false;
  return !kotuMu(k);
}

export function okunurIsim(ham) {
  let s = String(ham || '').normalize('NFKC');
  s = s.replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, ' ').replace(/[_.\-|~*#@+]+/g, ' ');
  s = s.replace(/([a-zçğıöşü])([A-ZÇĞİÖŞÜ])/g, '$1 $2');
  s = s.replace(/[0-9]+/g, ' ').replace(/[^\p{L}\s']/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  for (const w of s.split(' ')) {
    const k = w.toLocaleLowerCase('tr-TR');
    if (GENEL_KELIME.has(k)) continue;
    const kok = isimKoku(k);
    const aday = kok || k;
    if (!okunabilirMi(aday)) continue;
    return aday[0].toLocaleUpperCase('tr-TR') + aday.slice(1);
  }
  return null;
}

// İzleyicinin "adım Tolga" diye kendi yazdığı isim
export function ozelIsim(metin) {
  const m = String(metin || '').normalize('NFKC').trim().match(/^!?(?:adım|adim|ismim)\s*[:=]?\s*([\p{L}']{2,12})\s*$/iu);
  if (!m) return undefined;
  const k = m[1].toLocaleLowerCase('tr-TR');
  if (!okunabilirMi(k) || GENEL_KELIME.has(k)) return null;
  return k[0].toLocaleUpperCase('tr-TR') + k.slice(1);
}

export function temizSoru(metin) {
  let s = String(metin || '').replace(/\s+/g, ' ').trim();
  if (s.length > 110) s = s.slice(0, 110).trim() + '…';
  return s;
}

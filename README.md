# 🦇 Vampir Köylü — TikTok LIVE interaktif oyun

Köyde 6 köylü var, biri gizlice vampir. İzleyiciler yorumla köye katılıyor, köylüleri sorguya çekiyor ve oylamayla vampiri arıyor.

**[Tarayıcıda ücretsiz oyna](https://tolgahan22.github.io/vampir-koylu/)** · [Yayıncı paketini ZIP olarak indir](https://github.com/Tolgahan22/vampir-koylu/archive/refs/heads/main.zip)

Demoda izleyicileri oyun canlandırır. Başlat’a tıkla. İlk olay yerini ekrandan seçebilirsin. Bilgisayarda `D` tuşuyla test panelini açıp yorum yazabilir, oylama sırasında bir köylüye oy verebilirsin.

## Kendi yayınında kullan

Node.js 22 veya üzerini kur. ZIP’i açıp proje klasöründe şu komutları çalıştır.

```sh
npm ci
npm start
```

[Oyun ekranını aç](http://localhost:3000). Yayında kullanmak için önce `.env.example` dosyasını `.env` adıyla kopyala, `TIKTOK_KULLANICI` alanına yayın hesabının adını yaz ve sunucuyu yeniden başlat. Terminalde çıkan özel panel bağlantısını aynı Wi-Fi üzerinden telefonunda açabilirsin. OBS veya TikTok LIVE Studio’da oyun penceresini yakala (9:16).

Oyunu ücretsiz indirip kendi yayınında kullanabilirsin. Standart kurulum hazır senaryo cevaplarını ve cihazdaki tarayıcı seslerini kullanır. ElevenLabs ve OpenAI isteğe bağlıdır ve kendi hesabında ücrete tabi olabilir.

## Akış

1. **Olay yeri (20 sn):** Olayı oku, iki yerden birini seçmek için 1 veya 2 yaz. Her kişinin son seçimi sayılır. Çoğunluğun seçtiği yerden gelen kanıt panoya geçer. Eşitlikte veya kimse katılmazsa oyun yer seçer.
2. **Gece:** Vampir birini ısırır.
3. **Sabah:** Kurban açıklanır, günün ipucu panoya düşer ve sesli okunur.
4. **Sorgu (50 sn):** Soru yazmak için en fazla 10 saniye vardır. 8. saniyede ilk geçerli soru seçilir. Henüz soru yoksa son iki saniyede gelen ilk soru seçilir. Her sorguda tek köylü cevap verir, ardından köy ipuçlarını tartışır.
5. **Oylama (35 sn):** Yalnızca bu sırada yazılan yorumlar sayılır. Tek başına numara (`3`), isim (`Fatma`) veya açık oy komutu (`oy Fatma`) yazılabilir, son yazılan oy geçerlidir. Ekranın üstünde önde olan, altında kalan süre görünür.
6. **Kule:** En çok oyu alan kilitlenir ve son sözünü söyler.
7. **Akşam:** Kilitlenen köyden sürülür ama kimliği açıklanmaz. Ekranda "VAMPİR HÂLÂ KÖYDE Mİ?" yazar.
8. **Gece:** Isırık olursa vampir hâlâ köydedir, yeni gün başlar. Gece sessiz geçerse köy kazanmıştır... ya da değildir 😈 Bazı senaryolarda "sahte zafer" var: köy kutlama yaparken çan çalar.
9. **Final:** Vampir açıklanır. **Turun galibi, o turda en çok doğru oyu veren izleyicidir.** Eşitlikte vampiri ilk bulan kazanır. Anlatıcı galibi adıyla ilan eder ve ekranda taç çıkar. Puan tablosu ("Gecenin Dedektifleri") yayınlar arasında saklanır (`data/skor.json`).
10. **Yeni tur:** "Acaba vampiri bulabilecek misin?" diye açılır, geçen turun galibi anılır.

11 dosya ve 22 çözüm var. Her dosyanın iki farklı suçlusu ve her suçluya özel tanıkları, kanıtları ve finali var. Otomatik seçimde dosyalar dönüşümlü gelir. Perdedeki İkinci Gölge, Gece Frekansı ve Yarın Gelen Mektup dosyalarında ilk gün sorgunun başında 20 saniye boyunca A/B ile bir kanıt incelemesi de seçilir. Demo ekranında iki seçim kutusuna tıklanabilir. Örneğin `/?demo&dosya=anons` ile radyo vakasının rastgele bir çözümü açılır.

## Sessizlik yok

Konuşma bitince 2 saniye içinde yeni bir şey söylenir:
- Köylüler birbirini öfkeyle suçlar, suçlanan hiddetle savunur, sakin olan araya girer.
- Anlatıcı izleyiciyi yorum yazmaya, soru sormaya, beğeni atmaya çağırır. Yeni geleni adıyla karşılar.
- Oylamada önde olanı duyurur, son 10 ve son 5 saniyeyi sayar.
- **Duruma göre çağrı yapar:** Yorumlarda en çok adı geçeni savunmaya çağırır. Son ipucunu hatırlatır. Oylamada oy vermeyeni adıyla çağırır, başa baş giden yarışı duyurur.

Gerilim müziği kodla üretiliyor, telif derdi yok. Oylamanın sonuna doğru hızlanıyor, gece kalp atışına dönüyor, biri konuşurken kısılıyor.

## İzleyici isimleri

- Ekranda kullanıcı adı olduğu gibi görünür. Sesli okunan isim ise ayrı hesaplanır:
  - Süslü yazılar düz harfe çevrilir.
  - Rakamlar, emojiler, alt çizgiler atılır.
  - İlk okunabilir kelime alınır. `ayse_34` → "Ayşe", `xX_kral_34_Xx` → "Kral".
  - Türkçe harfleri olmayan yaygın isimler düzeltilir (ayse → Ayşe, oguzhan → Oğuzhan).
- Okunamayan isim hiç okunmaz: `user8473629`, `🔥🔥`, Kiril ya da Arap harfli isimler. Oyun o kişi için isimsiz cümle kurar ("Köye yeni komşular geldi!").
- İzleyici yorumlara `adım Tolga` yazarsa oyun ona o isimle seslenir. Anlatıcı bunu ara ara hatırlatıyor. Küfürlü isimler kabul edilmez.
- Panelden isim okumayı tamamen kapatabilirsin.

## Yayındaki etkileşimler

İzleyiciler yorumlarla kanıt seçer ve oy verir. Beğeniler fenerleri doldurunca ek ipucu açılır. Hediyeler görsel efekt ve teşekkür oluşturur, oy sayılarını etkilemez.

## Panel (telefon)

- **Soru kuyruğu:** "?" ile gelen sorular. **Seç** ile işaretlenen soru 8. saniyeden itibaren işlenir, anlatıcı soruyu okur, köylü cevaplar. ✕ siler, 🔇 kullanıcıyı susturur.
- **Otomatik soru:** Sen seçmezsen oyun ilk geçerli soruyu seçer. Kalan sorular silinir. Bu modda soruyu anlatıcı okumaz, sadece ekranda görünür (troll koruması).
- **Vampir kim?** (basılı tut): Gerilimi sen yönetmek istersen.
- **Anlatıcıya söylet:** Yazdığın cümleyi anlatıcı okur.
- **Sonraki / +30 sn / Durdur**, senaryo seçimi, sahte izleyicilerle test.

## Seslendirme

İlk kurulumda tarayıcının sunduğu Türkçe ses kullanılır. Ses seçimi cihaza ve tarayıcıya bağlıdır. İleri düzey EMA/OpenVoice seçeneği kendi model ve referans dosyalarını gerektirir.

## ElevenLabs

- Ses kimliklerini `.env` dosyasına yazabilirsin. Boş bırakırsan oyun hesabındaki seslerden cinsiyet ve yaşa göre seçer, seçtiklerini terminale yazar.
- `eleven_v3` modeli duygu etiketlerini kullanıyor: öfkeli, bağırarak, fısıltıyla, sakin, korkmuş.
- Her cümle bir kez üretilip `data/ses/` klasörüne kaydediliyor. Aynı cümle tekrar kredi yemiyor.
- **İsimli cümleler parça parça üretiliyor.** "Ayşe! Hoş geldin, köye yeni bir komşu geldi!" cümlesi iki dosyadan oluşuyor: "Ayşe!" ve sabit kısım. İkisi de aynı karakterin sesiyle art arda çalınıyor. Sabit kısım bir kere üretiliyor, yayında sadece isim (birkaç harf) yeni üretiliyor. İsim, izleyici köye girdiği anda önceden hazırlanıyor, sıra ona geldiğinde bekleme olmuyor.
- **Yayından önce bir kere çalıştır:**
  - `npm run sesler-tahmin`: kaç karakter gideceğini gösterir, hiçbir şey üretmez. Güncel miktar seçili ses ayarlarıyla hesaplanır.
  - `npm run sesler`: bütün sabit cümleleri üretip kaydeder.
  - Bundan sonra yayında kredi neredeyse sadece isimlere gider. Sayı geçen birkaç cümle ("7 kişi oy verdi") ve GPT cevapları da yayında üretilir, sonra onlar da kayıtlı kalır.
- Panelde bu oturumda harcanan karakter görünür.
- Kredi biterse ya da hata olursa oyun durmaz, Mac'in Türkçe sesine geçer.

## Klavye (yayın ekranında)

- `D`: test paneli (sahte yorum, beğeni, hediye)
- `F`: tam ekran
- `M`: müziği kapat/aç

`http://localhost:3000/?demo` adresi TikTok'a bağlanmadan sahte izleyicilerle oynar.

# Vampir Köylü

Köyde altı kişi var. Biri vampir. TikTok canlı yayınında izleyiciler yorum yazarak olay yerini seçer, köylüleri sorgular ve kimi köyden süreceklerine oy verir. Oyunda 11 vaka var. Her vakanın iki farklı çözümü olduğu için aynı hikâyede başka bir köylü vampir çıkabilir.

**[Tarayıcıda ücretsiz oyna](https://tolgahan22.github.io/vampir-koylu/)** · [Yayıncı paketini indir (ZIP)](https://github.com/Tolgahan22/vampir-koylu/archive/refs/heads/main.zip)

## Önce bir tur dene

Demoyu açıp **Başlat**’a dokun. Oyun diğer izleyicileri canlandırır. İlk iki olay yerinden birini ekrana dokunarak seçebilirsin. Bilgisayarda kendi yorumunu da gönderebilirsin. Bunun için `D` tuşuyla deneme panelini aç, yorumunu yaz ve **Yorum** düğmesine bas.

## İzleyiciler nasıl oynar?

| Ne zaman? | Yoruma ne yazılır? | Ne olur? |
| --- | --- | --- |
| Olay yeri seçilirken | `1` veya `2` | En çok seçilen yerden bir kanıt açılır. |
| Sorgu sırasında | `?Hasan neredeydin?` | Soru sıraya girer. Seçilen soruyu köylülerden biri cevaplar. |
| Oylama sırasında | `oy Fatma` | Oy Fatma’ya gider. Süre dolmadan fikrini değiştirirsen son oyun sayılır. |

En çok oy alan köylü son sözünü söyler ve köyden sürülür. Kimliği hemen açıklanmaz. Gece bir köylü daha ısırılırsa vampir hâlâ aranızdadır. Tur sonunda vampir ve ona en çok doğru oyu veren izleyici açıklanır.

## Kendi yayınında kullan

1. Bilgisayarına **Node.js 22 veya üzerini** kur. Yukarıdaki yayıncı paketini indir ve ZIP dosyasını aç.
2. Proje klasöründeki `.env.example` dosyasının bir kopyasını oluştur ve kopyaya `.env` adını ver. İçindeki `TIKTOK_KULLANICI=` satırında eşittir işaretinden sonra kendi TikTok kullanıcı adını **@ işareti olmadan** yaz.
3. Proje klasöründe bir terminal aç. İlk kurulum için `npm ci`, ardından oyunu başlatmak için `npm start` çalıştır. Sonraki yayınlarında `npm start` yeterli.
4. Bilgisayarında [oyun ekranını aç](http://localhost:3000) ve **Başlat**’a tıkla. OBS veya TikTok LIVE Studio’da bu pencereyi seçip dikey (9:16) olarak yayına ver.

Oyun hazır senaryo cevaplarını kullanır. Cihazında Türkçe bir tarayıcı sesi varsa replikleri sesli dinleyebilirsin.

## Yayıncı paneli

Oyun başlayınca terminalde sana özel bir panel bağlantısı görünür. Aynı Wi-Fi ağına bağlı telefonunda bu bağlantıyı aç. Buradan gelen soruları seçebilir, turu duraklatabilir, süreye 30 saniye ekleyebilir veya bir sonraki aşamaya geçebilirsin. Panel bağlantısını yalnızca yayıncı görmeli.

Bilgisayarda oyun ekranı açıkken `F` tam ekrana geçirir, `M` müziği açıp kapatır.

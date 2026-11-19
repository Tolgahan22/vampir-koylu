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

## TikTok ve API bağlantıları

GitHub’daki demo kendi başına çalışır. Kendi canlı yayının, karakter seslerin ve yapay zekâ ayarların için bilgisayarındaki yayıncı paketini kullan. Aşağıdaki alanları yalnızca kendi `.env` dosyanda doldur. Her değişiklikten sonra terminalde oyunu `Ctrl+C` ile durdurup `npm start` ile yeniden başlat.

**TikTok yorumlarını oyuna bağlamak için** `TIKTOK_KULLANICI` alanına yayın hesabını yaz ve o hesapta canlı yayını aç. Yayıncı panelinde **TikTok** durumunun **bağlı** olduğunu kontrol et. Olay yeri seçimi açıkken bir izleyici `1` veya `2` yazdığında seçimi ekrana yansır. Oyun yorumları üçüncü taraf `tiktok-live-connector` kütüphanesiyle alır. Bağlantı hizmeti anahtar isterse kendi Euler Stream hesabından oluşturduğun anahtarı `EULER_API_KEY` alanına gir. [Euler Stream](https://www.eulerstream.com/)

**Köylülerin izleyici sorularına yapay zekâyla cevap vermesi için** kendi OpenAI projenin API anahtarını oluşturup `OPENAI_API_KEY` alanına yapıştır. Oyunu yeniden başlattığında yayıncı panelinde **GPT** satırında model adını görürsün. Sorguda seçilen soru ve oyun içindeki ipuçları OpenAI’a gönderilir. Yanıt alınamazsa karakter senaryodaki cevabı kullanır. Kullanım kendi API hesabına yansır. [OpenAI API anahtarlarını yönet](https://platform.openai.com/api-keys)

## Karakterlere ses ver

**Ücretsiz tarayıcı sesi.** Oyun ekranında **Başlat**’a tıkla. Tarayıcı, cihazdaki Türkçe konuşma seslerini kullanır. Müzik geliyor ama konuşma duyulmuyorsa cihazında Türkçe bir konuşma sesinin yüklü olduğunu ve yayıncı panelindeki **Mac sesi (ElevenLabs yoksa)** seçeneğinin açık olduğunu kontrol et. Ses bilgisayarında duyuluyor ama yayına gitmiyorsa OBS veya TikTok LIVE Studio’da tarayıcının sesini yakalayan kaynağı etkinleştir. Bir replik sırasında yayın mikserindeki ses göstergesi hareket etmelidir.

**ElevenLabs ile anlatıcıya ve köylülere ayrı sesler vermek için**

1. ElevenLabs hesabında **Developers → API Keys** bölümünden bir anahtar oluştur. Metni sese dönüştürme ve otomatik ses seçimi için ses listesini okuma izinlerini aç. Anahtarı kendi `.env` dosyandaki `ELEVENLABS_API_KEY` alanına yapıştır. [ElevenLabs anahtar oluşturma rehberi](https://elevenlabs.io/docs/help-center/technical/how-do-i-authorize-myself-using-an-api-key)
2. Otomatik seçim için `ELEVEN_SES_…` alanlarını boş bırak. Belirli bir ses istiyorsan ElevenLabs’ta hesabından erişebildiğin sesi açıp **Voice ID** değerini kopyala. Örneğin anlatıcı için `ELEVEN_SES_ANLATICI`, muhtar için `ELEVEN_SES_MUHTAR` alanına yapıştır. Yedi rolün tamamı örnek ayar dosyasında yer alır.
3. Sunucuyu yeniden başlat ve bilgisayarındaki [yayın ekranını aç](http://localhost:3000). **Başlat**’a tıkla. Panelde **Ses** satırında **açık** durumunu, ardından ilk repliği kontrol et. Replikler ve seslendirilen izleyici adları ElevenLabs’a gönderilir. Üretilen sesler bilgisayarında `data/ses/` klasöründe saklanır.

Yayından önce sabit replikleri hazırlamak istersen önce `npm run sesler-tahmin` ile karakter tahminini gör. Ardından `npm run sesler` eksik sesleri üretir ve ElevenLabs hesabından kredi kullanabilir. Normal oyun için bu adım isteğe bağlıdır.

**Kendi yerel ses modelini kullanıyorsan** EMA ve OpenVoice kurulu Python yorumlayıcısının yolunu `YEREL_SES_PYTHON` alanına yaz ve `SES_MOTORU=yerel` ayarını yap. Bu seçenek FFmpeg, EMA model dosyaları ve `data/openvoice/` içinde uyumlu OpenVoice kodu, model ağırlıkları ve karakter referansları gerektirir. Yayıncı paketi bu özel ses dosyalarını içermez. [Yerel ses işçisinin beklediği dosyalar](lib/yerel_ses.py)

## Yayıncı paneli

Oyun başlayınca terminalde sana özel bir panel bağlantısı görünür. Aynı Wi-Fi ağına bağlı telefonunda bu bağlantıyı aç. Buradan gelen soruları seçebilir, turu duraklatabilir, süreye 30 saniye ekleyebilir veya bir sonraki aşamaya geçebilirsin. Panel bağlantısını yalnızca yayıncı görmeli.

Bilgisayarda oyun ekranı açıkken `F` tam ekrana geçirir, `M` müziği açıp kapatır.

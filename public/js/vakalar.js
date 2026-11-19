// Her dosyada yer adları iki çözümde de aynıdır. Her çözüm kendi delillerini ve tanıklarını taşır.
const yerler = {
  degirmen: ['Değirmen', 'Kömürlük'], can: ['Çan kulesi', 'Bekçi kulübesi'],
  elma: ['Bahçe çiti', 'Posta yolu'], demir: ['Kahve ocağı', 'Arka kapı'],
  zil: ['Derslik', 'Zil ipi'], kaval: ['Dere', 'Ağıl'],
  alarm: ['Fırın', 'Kahvehane'], saat: ['Saat kulesi', 'Mezarlık'],
  perde: ['Perde arkası', 'Işık masası'], anons: ['Radyo odası', 'Pazar yeri'],
  mektup: ['Posta kutusu', 'Dağıtım çantası'],
};
const eskiBulgular = {
  degirmen: ['Un çuvalının ağzında tek bir yağ damlası parlıyor.', 'Kömür çuvalı sürüklenmemiş. Bir avuç alıp götürmüşler.'],
  can: ['İpin ucu lif lif açılmamış. Temiz bir kesik var.', 'Rıfat’ın fincanının dibinde tek bir ıhlamur yaprağı var.'],
  elma: ['Çitteki dala bir elma kabuğu takılmış.', 'Yusuf’un çantası kapalı. Mektuplar hâlâ içinde.'],
  demir: ['Nazım’ın çayında kül yok. İs sonradan bulaşmış.', 'Kapıdaki is lekesi tek elde, dış tarafta.'],
  zil: ['Tahta silgisi nemli, oysa derslik bütün gün kapalıymış.', 'İpin kıvrımında kırmızı bir damla kurumuş.'],
  kaval: ['Sazların arasında saman kırıntıları var.', 'Sürgü kapalı ama içerideki hayvanlar ürkmüş.'],
  alarm: ['Cemal’in yanındaki pulun kenarında çizik yok.', 'Masadaki tavla pullarının kenarları aşınmış.'],
  saat: ['Saatin yayı sağlam. Çarkların arasına bir şey girmiş.', 'Küçük ayakkabı izlerinin yanında ezilmemiş çiçekler var.'],
};
const meslek = {
  muhtar: ['Muhtarlıkta dilekçeleri ayırdım.', 'İfade defterini saklayın.'],
  bakkal: ['Dükkânda akşam hesabını kapattım.', 'Veresiye defterim tezgâhın altında.'],
  ebe: ['Evde temiz sargıları katlıyordum evladım.', 'Üşüyen olursa şalımı verin.'],
  coban: ['Kuzuların yemini dağıtıyordum.', 'Mandallı kapıyı kapatın, kuzular çıkar.'],
  ogretmen: ['Okulda defterleri topladım.', 'Gördüğünüzle duyduğunuzu ayrı yazın.'],
  demirci: ['Ocak sönünce aletleri topladım.', 'Örsün üstündeki işi sabaha bırakın.'],
};

// İki bağımsız tanık için ilk ve sonraki gün ifadeleri, suçlu için ayrı bir yalan.
function cozum(v) {
  const k = {};
  for (const [id, [gece, sonSoz]] of Object.entries(meslek)) {
    const tanik = v.taniklar[id];
    k[id] = {
      gece: id === v.vampir ? v.yalan : gece,
      gordu: tanik || (id === v.vampir ? [v.saptirma] : ['O sırada olay yerinde değildim.']),
      suphe: id === v.vampir ? v.saptirma : tanik ? tanik[0] : 'Kimseyi görmedim. Orada olanlara sorun.',
      sonSoz,
    };
  }
  return { ...v, k, final: { koy: v.aciklama, vampir: v.aciklama } };
}

const alternatif = {
  degirmen: {
    vampir: 'coban', ters: 'Ters yönde iz', yalan: 'Koyunlar bütün gece ağıldaydı. Ben de öyle.',
    saptirma: 'Kömür izi var. Kemal’in eline bakın.',
    bulgular: ['Unlu zeminde baston delikleri kapıya kadar gidiyor.', 'Kömürün altında beyaz yün var. Üstüne sonradan bastırılmış.'],
    ipuclari: ['Kara el izinin ortasından beyaz yün çıkıyor.', 'Yerdeki yuvarlak delikler çoban değneğinin nalçesi kadar.', 'Osman gözünü açtı. “Ali, kuzunu buldun mu?” dediği anı hatırladı.'],
    bonus: ['Sürü sayımında bir kuzu eksik.', 'Değnek izleri un çuvallarının arkasında bitiyor.'],
    taniklar: { demirci: ['İzde yün var. Eldivenim deriden.', 'Ali’nin değneğine yuvarlak nalçeyi ben taktım.'], ebe: ['Gece bir kuzu sesi duydum.', 'Osman birine kayıp kuzuyu soruyordu.'] },
    aciklama: 'Vampir Ali’ydi. Osman’ı kayıp kuzu bahanesiyle çağırdı. Kemal suçlansın diye kömürü yün eldiveniyle sürdü. Beyaz lifler ve değnek izi kaldı.',
  },
  can: {
    vampir: 'demirci', ters: 'Kesildi sanılan ip', yalan: 'Çanın sesini ben de bekledim, hiç çalmadı.',
    saptirma: 'Rıfat uyuduysa fincanını inceleyin.',
    bulgular: ['İp sağlam, çanın dili eksik.', 'Boş fincanın üstünde gece boyu bozulmamış bir örümcek ağı var.'],
    ipuclari: ['Çanın altında üç damla siyah yağ var.', 'Çanın dili yeni açılmış bir somunla sökülmüş.', 'Kulenin tozunda Kemal’in kırık topuğunun yarım ay izi var.'],
    bonus: ['Rıfat o gece çay içmemiş.', 'Kuleye çıkan kişi ağır bir parça taşımış.'],
    taniklar: { ebe: ['Fincanı dün ben yıkadım.', 'Gece kimse ondan içmemiş evladım.'], coban: ['Gece bir demir parçası yere düştü.', 'Kemal’in önlüğünden çanın dilini gördüm.'] },
    aciklama: 'Vampir Kemal’di. Çanın dilini söküp Rıfat’ın yardım çağrısını susturdu. Fincan dünden kalmıştı. Kırık topuğu onu kuleye bağladı.',
  },
  elma: {
    vampir: 'ogretmen', ters: 'Yanlış tarih', yalan: 'Çocukların gezi kâğıtlarını dün dağıttım. Bugün bahçeye gitmedim.',
    saptirma: 'Çarığı olan biri Yusuf’u izlemiş.',
    bulgular: ['Çarık izinin içi kuru. Gece yağmur yağmıştı.', 'Yusuf’un son zarfı mor kalemle düzeltilmiş.'],
    ipuclari: ['Çarık izi dün öğleden önceye ait.', 'Yusuf’a verilen gezi kâğıdında bugünün tarihi var.', 'Kâğıdın yırtık köşesi Selin’in yoklama defterindeki parçaya oturuyor.'],
    bonus: ['Yağmur başlayınca Ali köyden ayrılmış.', 'Zarfın içinde okul gezisi için teslim çağrısı var.'],
    taniklar: { coban: ['Elmaları dün öğlen topladım.', 'Yağmur yağınca ben çoktan yayladaydım.'], bakkal: ['Yusuf elinde mor yazılı bir kâğıtla geçti.', 'O mor kalemi dün öğretmene sattım.'] },
    aciklama: 'Vampir Selin’di. Yusuf’u sahte okul teslimatıyla çağırdı. Ali’nin eski çarık izini kullanmak istedi. Yağmurun saati ve yırtık sayfa yalanını bozdu.',
  },
  demir: {
    vampir: 'ebe', ters: 'Gerçek yara, yanlış gece', yalan: 'Nazım çağırınca geldim. Daha önce uğramadım.',
    saptirma: 'İlk bulduğumda kapıda is vardı. Kemal’e sorun.',
    bulgular: ['Kül yalnızca sargının dış tarafında.', 'Kapının arkasında yarısı eksik mavi bir düğme var.'],
    ipuclari: ['Kemal’in yarası kapanmış. Bu geceden eski.', 'Nazım’ın sıktığı mavi düğmenin yarısı avucunda.', 'İki parça Fatma’nın önlüğündeki kırık düğmeyi tamamlıyor.'],
    bonus: ['Kemal geçen hafta ocakta yaralanmış.', 'Nazım’ın defterinde o gece için bir sargı randevusu var.'],
    taniklar: { demirci: ['Sargım eski. Fatma bana geçen hafta sardı.', 'Nazım’ı görmeye çağrılmadım.'], ogretmen: ['Nazım bir düğmeyi sıkmış.', 'Fatma’nın önlüğünde yarım mavi düğme gördüm.'] },
    aciklama: 'Vampir Fatma’ydı. Nazım’ı sargı randevusunda ısırdı. Kemal’in eski yarası inandırıcı bir sahte izdi. Nazım düğmeyi koparınca gerçek ziyaretçi ortaya çıktı.',
  },
  zil: {
    vampir: 'muhtar', ters: 'Ödünç anahtar', yalan: 'Okulun kapısını yalnız öğretmen açar.',
    saptirma: 'Zil çaldıysa öğretmene sorun.',
    bulgular: ['Tahtadaki tarih iki gün eski.', 'İpte kırmızı balmumu var. Bastırınca yumuşuyor.'],
    ipuclari: ['İpteki kırmızı leke mürekkep gibi kâğıda geçmiyor.', 'Okulun yedek anahtarı belediye zarfında tutuluyor. Zarf açık.', 'Zilde kalan mumda muhtar mührünün yarım hilali seçiliyor.'],
    bonus: ['Selin kendi anahtarını hiç vermemiş.', 'Yedek anahtar zarfına gece yeni mum dökülmüş.'],
    taniklar: { ogretmen: ['Tahtayı cuma günü ben yazdım.', 'Benim anahtarımda balmumu yok.'], ebe: ['Zilin dibinde kırmızı bir kırıntı buldum.', 'Rıza’nın mühür bastığı mum böyle kokar.'] },
    aciklama: 'Vampir Rıza’ydı. Mühürlü zarfı açıp yedek anahtarı aldı. Zili çalarak Melek’i çağırdı. İpteki mumun üstünde kendi mührü kaldı.',
  },
  kaval: {
    vampir: 'bakkal', ters: 'Taklit ses', yalan: 'Ali çaldı. O ezgiyi başka kimse bilmez.',
    saptirma: 'Sesi hepimiz duyduk. Kaval Ali’nin.',
    bulgular: ['Ezgiden hemen önce bir tık sesi duyulmuş.', 'Ali’nin kavalındaki kamış gece boyunca ıslak bezde durmuş.'],
    ipuclari: ['Ezgi üç kez aynı yerde takılmış.', 'Dere kenarında kurmalı bir müzik kutusunun boş kılıfı var.', 'Kılıftaki fiyat etiketi Hasan’ın defterindeki tek müzik kutusuyla eşleşiyor.'],
    bonus: ['Kutunun yayı üç dönüşte duruyor.', 'Hasan’ın vitrinindeki boşluk hâlâ tozsuz.'],
    taniklar: { coban: ['Kavalımın kamışını dün çıkardım.', 'Bir insan her seferinde aynı yerde aynı süre takılmaz.'], demirci: ['Bu sesi tanırım. Kurma yayı.', 'Hasan’ın müzik kutusunun yayını dün gerdim.'] },
    aciklama: 'Vampir Hasan’dı. Ali’nin ezgisini çalan kurmalı kutuyu dereye koydu. Ayşe sese geldi. Her seferinde aynı notada takılan yay Hasan’ın taklidini ele verdi.',
  },
  alarm: {
    vampir: 'ogretmen', ters: 'Dürüst ilk tanık', yalan: 'Ben dersi hazırlarken çığlığı duydum.',
    saptirma: 'Her yere ilk Hasan koşuyor. Bu nasıl rastlantı?',
    bulgular: ['Fırının camında içeriden tebeşirle çizilmiş bir ok var.', 'Tavla pulunda ince bir ip deliği var.'],
    ipuclari: ['Pul oyun setinden büyük. Bir sayma boncuğu olabilir.', 'Cemal’in unlu tezgâhında bir sınıf cetvelinin izi var.', 'Hasan yardım çağırırken Selin’in fırının arkasından çıktığını iki kişi görmüş.'],
    bonus: ['Okulun sayı dizisinde bir pul eksik.', 'Hasan’ın terlikleri fırın önünde. Arkaya hiç geçmemiş.'],
    taniklar: { bakkal: ['Camdaki oku görünce fırına koştum.', 'Cemal zaten yerdeydi. Yardım diye bağırdım.'], muhtar: ['Okulun sayma boncukları deliklidir.', 'Selin’in önlüğünün dirseği o sabah unluydu.'] },
    aciklama: 'Vampir Selin’di. Hasan’ın Cemal’i bulmasını istediği için cama ok çizdi. Şüpheyi kahveye çekecek pulu okulun sayma dizisinden koparmıştı.',
  },
  saat: {
    vampir: 'demirci', ters: 'Bozuk saat, doğru tanık', yalan: 'Kule anahtarı muhtarda. İçeri girmem mümkün mü?',
    saptirma: 'Üçte kuleye giren muhtardır.',
    bulgular: ['Dişli duruyor ama bakım kapağı dışarı açılıyor.', 'Çiçeklerin sapı gece yağmurunda eğilmiş. İzler daha eski.'],
    ipuclari: ['Saat üçü gösteriyor. Bekçinin defterinde son vuruş iki buçuk.', 'Dış bakım kapağında kırık bir eğe ucu var.', 'Eğe ucu Kemal’in tezgâhındaki kırık sapla birleşiyor.'],
    bonus: ['Ana kapı mühürlü ve mühür sağlam.', 'Mezardaki çiçekleri Fatma dün bırakmış.'],
    taniklar: { muhtar: ['Kapının mührü bozulmamış.', 'Usta dışarıdaki kapaktan çalışır.'], ebe: ['Çiçekleri dün öğleden önce bıraktım.', 'O kapaktan geceleri metal sesi geliyordu.'] },
    aciklama: 'Vampir Kemal’di. Saati dış kapaktan üçe kurup durdurdu. Rıza’nın anahtarını hiç kullanmadı. İçeride kalan kırık eğe ucu gerçek zamanı da yalanını da açığa çıkardı.',
  },
};

const yeniDosyalar = [
  {
    id: 'perde', baslik: 'Perdedeki İkinci Gölge', giris: 'Melek ışığı söndürdü. Kukla perdesinde iki gölge daha selam verdi. Işık açıldığında Melek yerdeydi.',
    kurbanlar: ['melek', 'rifat', 'osman', 'nazim'],
    islem: ['Işığı yak', 'Perdeyi çevir'], soru: 'Sahneyi nasıl canlandıralım?',
    cozumler: [
      { vampir: 'coban', ters: 'Tek kişi, iki gölge', yalan: 'Gösteri bitmeden sürüye döndüm.', saptirma: 'Sahneden iki kişi geçmiş. Ben yalnız gezerim.',
        bulgular: ['Perdede bir çift çarık izi var.', 'Masada iki küçük kandil yan yana duruyor.'],
        deney: ['İki kandil yanınca tek kukladan iki gölge çıkıyor.', 'Perdenin arkasında bir değneğe bal mumu ile tutturulmuş kukla var.'],
        ipuclari: ['Melek iki gölge gördü ama tek ayak sesi duydu.', 'Kuklanın sapındaki yün yakın zamanda kırkılmış.', 'Ali’nin değneğinin ucundaki mumda kuklanın oyuk yüzü kalıplaşmış.'],
        bonus: ['Kandiller aynı boyda.', 'Bir gölge ötekinden hep biraz büyükmüş.'],
        taniklar: { ogretmen: ['İki gölge aynı anda eğildi.', 'İki ışık tek cismi iki kez gösterir.'], demirci: ['Yerde tek çift iz var.', 'Ali bana değneğindeki mumu kazıtmak istedi.'] },
        aciklama: 'Vampir Ali’ydi. İki kandille tek kuklayı iki kişi gibi gösterdi. Melek perde arkasına geldiğinde orada yalnız Ali vardı. Değnekteki mum kuklanın kalıbını sakladı.' },
      { vampir: 'ebe', ters: 'Önceden kesilmiş gölge', yalan: 'Gösteri boyunca en önde oturdum evladım.', saptirma: 'O gölgeler yürüyordu, perdeye bir şey asılmamıştı.',
        bulgular: ['Perdenin kenarında iki iğne deliği var.', 'İkinci kandilin fitili tertemiz. Hiç yanmamış.'],
        deney: ['Tek kandil yanınca ikinci gölge sabit kalıyor.', 'Perdeyi çevirince siyah kumaştan kesilmiş bir profil düşüyor.'],
        ipuclari: ['Görgü tanığı ikinci gölgenin ayaklarının hiç kımıldamadığını söylüyor.', 'Siyah kumaşın kenarı mor iplikle bastırılmış.', 'Kumaş Fatma’nın yırtık şalına uyuyor. Melek onun eksik iğnesini tutuyor.'],
        bonus: ['Ön sıradaki sandalyede katlanmış bir palto var.', 'Kandil sönünce biri en önden kalkmış.'],
        taniklar: { coban: ['İkinci gölgenin ayakları yoktu.', 'Sandalyede oturuyor sandığım şey paltomuş.'], bakkal: ['Fatma benden mor iplik aldı.', 'Şalının kenarından insan profili kadar parça eksik.'] },
        aciklama: 'Vampir Fatma’ydı. Şalından kestiği profili perdeye iğneledi, paltosunu ön sıraya bıraktı. Kımıldamayan gölge ile boş sandalye aynı hilenin iki yarısıydı.' },
    ],
  },
  {
    id: 'anons', baslik: 'Gece Frekansı', giris: 'Gece yarısı hoparlörden “Yusuf, meydana gel” diye bir ses yükseldi. Sabah postacının çantası açık mikrofonun dibindeydi.',
    kurbanlar: ['yusuf', 'ayse', 'rifat', 'osman'],
    islem: ['Kaydı başa sar', 'Dip sesi dinle'], soru: 'Anonsu nasıl inceleyelim?',
    cozumler: [
      { vampir: 'muhtar', ters: 'Kesilip birleştirilmiş anons', yalan: 'Cihaz bütün gece kilitliydi. Ben yalnız sabah duyurusu yaparım.', saptirma: 'Duyduğunuz ses Hasan’ın sesi.',
        bulgular: ['Makarada iki ek yeri var.', 'Pazarın hoparlörü radyo odasına bağlı.'],
        deney: ['Başa sarınca “Yusuf” üç kez aynı öksürükle başlıyor.', 'Cümlenin ortasında pazar uğultusu bir anda kesiliyor.'],
        ipuclari: ['Anonsun iki yarısında arka plan sesi farklı.', '“Meydana gel” geçen haftaki kayıp eşya duyurusundan alınmış.', 'Ana makaranın kesilen parçası Rıza’nın mühürlü duyuru zarfından çıktı.'],
        bonus: ['Hasan eski duyuruda kendi adını okumuştu.', 'Makası kullanan sol elle kesmiş.'],
        taniklar: { bakkal: ['O öksürük benim ama geçen haftadan.', 'Yusuf’un adını kayıp çantasını duyururken okudum.'], ogretmen: ['İki kelime arasında sessizlik değişiyor.', 'Eski duyurular muhtarın dolabında durur.'] },
        aciklama: 'Vampir Rıza’ydı. Hasan’ın eski duyurusunu kesip birleştirerek Yusuf’u meydana çağırdı. Hasan’ın sesi gerçekti, cümle o gece hiç söylenmemişti.' },
      { vampir: 'bakkal', ters: 'Canlı taklit', yalan: 'Radyo kapalıysa ben nasıl anons yapayım?', saptirma: 'Muhtarın kaydını duydunuz. O yapmıştır.',
        bulgular: ['Ana makaranın üstünde bozulmamış toz var.', 'Tezgâhların altından hoparlöre bir kablo gidiyor.'],
        deney: ['Makarayı başa sarınca yalnız dünkü hava durumu çıkıyor.', 'Seste iki metal kefenin birbirine vurması duyuluyor.'],
        ipuclari: ['Duyuruyu kaydettiği sanılan makara boş.', 'Hoparlörün ikinci girişi terazinin altına uzanıyor.', 'Hasan’ın tezgâhındaki mikrofon açılınca aynı kefe sesi bütün meydana yayılıyor.'],
        bonus: ['Seyyar mikrofonun kablosunda un var.', 'Rıza duyuru sırasında başka bir köylüyle konuşuyormuş.'],
        taniklar: { demirci: ['Ses başlamadan iki kefe çınladı.', 'Kablo radyo odasından değil tezgâhtan geçiyor.'], muhtar: ['O ses benim gibi konuştu ama nefesi farklıydı.', 'Dün yalnız hava durumunu kaydettim.'] },
        aciklama: 'Vampir Hasan’dı. Muhtarın konuşmasını taklit edip tezgâhının altından canlı anons yaptı. Boş makara ve terazinin çınlaması sesin nereden geldiğini gösterdi.' },
    ],
  },
  {
    id: 'mektup', baslik: 'Yarın Gelen Mektup', giris: 'Hüsnü Dede sabaha karşı posta kutusunun yanında bulundu. Avucunda yarının damgasını taşıyan bir zarf vardı.',
    kurbanlar: ['husnu', 'cemal', 'ayse', 'melek'],
    islem: ['Damgayı karşılaştır', 'Zarfı ışığa tut'], soru: 'Mektuba hangi inceleme yapılsın?',
    cozumler: [
      { vampir: 'ogretmen', ters: 'Aynalı baskı', yalan: 'Okulda baskı dersi bitti. Bütün kalıplar dolapta.', saptirma: 'Tarihi yanlış basan postacıyı bulun.',
        bulgular: ['Damgadaki yedinin kuyruğu sola dönüyor.', 'Yusuf’un gerçek damgasındaki yedi sağa bakıyor.'],
        deney: ['İki baskı üst üste gelince sahte yedi ters kalıyor.', 'Zarfın içinde bir baskı denemesi görünüyor. Aynı ters yedi var.'],
        ipuclari: ['Zarfın üzerinde posta pulunun izi bile yok.', 'Ters yedi okulun patates baskısı ödevinde de var.', 'Selin’in masasında Dede’nin ismiyle iki başarısız baskı bulundu.'],
        bonus: ['Kalıp silgi gibi yumuşak iz bırakmış.', 'Yusuf o mahalleye öğleden sonra gidiyor.'],
        taniklar: { bakkal: ['Zarfa pul satılmamış.', 'Öğretmen dün baskı boyası aldı.'], ebe: ['Dede mektubu bizzat alacağını söyledi.', 'Ona sabaha karşı gelmesini söyleyen okuldan biriymiş.'] },
        aciklama: 'Vampir Selin’di. Gelecek tarihli damgayla Dede’yi erkenden posta kutusuna çekti. El yapımı kalıpta yediyi ters oymuştu. Deneme kâğıtları okulda kaldı.' },
      { vampir: 'demirci', ters: 'Gerçek damga, eski zarf', yalan: 'Postayla işim olmaz. Kutunun kilidine geçen ay baktım.', saptirma: 'Yarının mührü postacıdan başka kimde olur?',
        bulgular: ['Kutunun kilidinde taze pirinç talaşı var.', 'Çantadaki tamir fişinde bir zarf eksik.'],
        deney: ['Damga gerçek. Büyüteçte yılın geçen yıla ait olduğu okunuyor.', 'Işıkta silinmiş eski adres görünüyor. Kâğıt ikinci kez kullanılmış.'],
        ipuclari: ['Damga yeni görünse de zarf çoktan sararmış.', 'Eski adres köyün demirhanesi.', 'Kutudaki yeni kilidin eğe izi Kemal’in dün kestiği anahtara uyuyor.'],
        bonus: ['Gün ve ay tutuyor ama yıl farklı.', 'Yusuf arızalı kilidi kimseye teslim etmemiş.'],
        taniklar: { muhtar: ['Tamir fişini geçen yıl ben imzaladım.', 'Zarfı o zaman demirhaneye yollamıştım.'], coban: ['Dün posta kutusundan eğe sesi geldi.', 'Kemal yeni anahtarı cebine koyuyordu.'] },
        aciklama: 'Vampir Kemal’di. Geçen yıl aldığı zarfın adresini sildi ve Dede’ye bıraktı. Tarih yarın gibi görünüyordu. Eski yıl ve kilitteki taze talaş iki ayrı zamanı birleştirdi.' },
    ],
  },
];

export function dosyalariHazirla(eskiler) {
  const hepsi = [];
  for (const s of eskiler) {
    const ortak = { dosya: s.id, yerler: yerler[s.id], baslik: s.baslik, giris: s.giris, kurbanlar: s.kurbanlar };
    hepsi.push({ ...s, ...ortak, bulgular: eskiBulgular[s.id] });
    hepsi.push({ ...ortak, ...cozum(alternatif[s.id]), id: s.id + '-ikinci' });
  }
  for (const { id, cozumler, ...ortak } of yeniDosyalar) {
    cozumler.forEach((v, i) => hepsi.push({ ...ortak, dosya: id, yerler: yerler[id], ...cozum(v), id: id + '-' + (i + 1) }));
  }
  return hepsi;
}

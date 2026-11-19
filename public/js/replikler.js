// Sessizlik olmasın diye: anlatıcının davetleri ve köylülerin kendi aralarındaki laf atışmaları.
// d = duygu: heyecan, sakin, ofke, bagir, fisilti, korku, alay, uzgun, normal
// Hediye istemek YOK. Sadece yorum, soru, beğeni, takip ve paylaşım teşvik edilir.

export const YONELME = { muhtar: "Rıza'ya", bakkal: "Hasan'a", ebe: "Fatma'ya", coban: "Ali'ye", ogretmen: "Selin'e", demirci: "Kemal'e" };
export const BELIRTME = { muhtar: "Rıza'yı", bakkal: "Hasan'ı", ebe: "Fatma'yı", coban: "Ali'yi", ogretmen: "Selin'i", demirci: "Kemal'i" };

const r = (m, d = 'normal') => ({ m, d });

export const ANLATICI = {
  davet: [
    r('Köye yeni gelenler! Yorumlara bir şey yazın, köyde kendi evinizi kurun!', 'heyecan'),
    r('Soru sormak bedava! Soru işaretiyle başlayın ve köylünün adını yazın. Mesela: soru işareti Hasan, dün gece neredeydin?', 'heyecan'),
    r('Beğeni atın, köyün fenerleri yansın! Fenerler dolunca yeni bir ipucu düşecek!', 'heyecan'),
    r('Vampiri yakalamak sizin elinizde köylüler!', 'heyecan'),
    r('Sessiz kalmayın! Vampir sessizliği sever!', 'heyecan'),
    r('Kimden şüpheleniyorsunuz? Yorumlara yazın bakalım!', 'heyecan'),
    r('Arkadaşını da çağır! Köyde ne kadar çok göz olursa, vampir o kadar zor saklanır!', 'heyecan'),
    r('Takip etmeyi unutmayın, her gece yeni bir hikâye var!', 'normal'),
    r('Köyün dedektifleri nerede? Tabloya adını yazdırmak isteyen var mı?', 'heyecan'),
    r('Yorum yazan herkes köye taşınıyor. Ama dikkat edin, vampir yeni komşuları sever!', 'alay'),
    r('Adını yanlış okursam yorumlara "adım" yaz, yanına da adını. Mesela: adım Tolga!', 'heyecan'),
  ],
  sorgu: [
    r('Sorgu devam ediyor! Bir köylüye soru sorun!', 'heyecan'),
    r('İpucunu okudunuz mu? Kimin hikâyesi tutmuyor?', 'normal'),
    r('Bakın bakalım, bu köyde biri yalan söylüyor...', 'fisilti'),
    r('Herkes bir şey saklıyor. Ama sadece biri vampir!', 'normal'),
    r('Soruların cevabını iyi dinleyin. Vampir yalan söyler ama yalan bir yerden çatlar!', 'normal'),
    r('Az sonra oylama var! Kararınızı vermeden önce sorun, sorgulayın!', 'heyecan'),
  ],
  oylama: [
    r('Oylama zamanı! Yoruma şüphelinin numarasını ya da adını yazın!', 'heyecan'),
    r('Daha oy vermeyen var mı? Hadi, bir numara yazmak yeter!', 'heyecan'),
    r('Fikrini değiştirdin mi? Yeniden yaz, son yazdığın sayılır!', 'normal'),
    r('Köyün kaderi sizin elinizde! Oy verin!', 'heyecan'),
  ],
  oyAz: [r('Daha çok az oy var! Bir numara ya da bir isim yazın, yeter!', 'heyecan')],
  son10: [r('Son on saniye! Oyunu vermeyen kalmasın!', 'bagir')],
  son5: [r('Son beş saniye!', 'bagir')],
  gece: [
    r('Şşş... köy uyuyor...', 'fisilti'),
    r('Kapılarınızı kilitleyin... pencerelerinizi kapatın...', 'fisilti'),
    r('Bir kanat sesi duydunuz mu?', 'fisilti'),
    r('Bu gece kimin kapısı çalınacak?', 'fisilti'),
    r('Karanlıkta iki kırmızı göz... köyü izliyor...', 'fisilti'),
  ],
  bekleme: [
    r('Yeni bir hikâye başlamak üzere! Köye katılmak için yorum yazın!', 'heyecan'),
    r('Geçen turun dedektifleri tabloda! Bu sefer sıra sende!', 'heyecan'),
    r('Kim hazır? Yorumlara "hazırım" yazın!', 'heyecan'),
  ],
  karsila1: [
    r('{ad}! Hoş geldin, köye yeni bir komşu geldi!', 'heyecan'),
    r('{ad}! Köye hoş geldin! Dikkat et, geceleri kapını kilitle!', 'alay'),
    r('{ad}! Hoş geldin! Hadi bir soru sor, köylüleri sıkıştır!', 'heyecan'),
  ],
  karsilaCok: [r('{a}! {b}! Hoş geldiniz, köy kalabalıklaşıyor!', 'heyecan')],
  karsilaAnonim: [r('Köye yeni komşular geldi! Hoş geldiniz! Bir soru sorarak başlayın!', 'heyecan'), r('Köy kalabalıklaşıyor! Yeni gelenler, hoş geldiniz!', 'heyecan')],
  hediyeAnonim: [r('Köye fener asan komşumuz, sağ ol!', 'heyecan')],
  takipAnonim: [r('Köye yeni bir komşu taşındı! Hoş geldin!', 'heyecan')],
  paylasAnonim: [r('Haberi köy köy yayan komşumuz, sağ ol!', 'heyecan')],
  adim: [r('{ad}! Tamam, artık sana böyle sesleneceğim!', 'heyecan'), r('{ad}! Not ettim, hoş geldin!', 'heyecan')],
  izleyiciIsirildiAnonim: [r('Ve bir köylümüz daha ısırıldı! Artık bir hayalet ama hâlâ oy verebilir!', 'korku')],
  kilpayiAnonim: [r('Vampir gece bir köylünün kapısına kadar geldi... ama fener yanıyordu, geri döndü!', 'fisilti')],
  hediye: [
    r('{ad}! Köye fener astın, sağ ol!', 'heyecan'),
    r('{ad}! Sağ ol, köyün meydanı aydınlandı!', 'heyecan'),
  ],
  takip: [r('{ad}! Köye taşındın, hoş geldin komşu!', 'heyecan')],
  paylas: [r('{ad}! Haberi köy köy yaydın, sağ ol!', 'heyecan')],
  fener: [r('Fenerler yandı! Yeni bir ipucu düştü!', 'heyecan')],
  kilpayi: [r('Vampir gece bir kapıya kadar geldi... {ad}! Senin kapına! Ama fener yanıyordu, geri döndü!', 'fisilti')],
  izleyiciIsirildi: [r('Ve bir köylü daha ısırıldı... {ad}! Artık bir hayaletsin, ama hâlâ oy verebilirsin!', 'korku')],
  soruOku: [r('Soru geliyor! {ad}! Soruyor ki: {soru}', 'normal')],
  ipucuOku: [r('{gun}. gün ipucu: {ipucu}', 'normal')],
  fenerIpucu: [r('Fener ipucu: {ipucu}', 'normal')],
  galip: [r('{ad}! {n} doğru oyla turun galibi! Tebrikler!', 'bagir')],
  galipEkranda: [r('İşte ekranda! {n} doğru oyla turun galibi! Tebrikler!', 'bagir')],
  lider: [
    r('{kisi} önde!', 'heyecan'),
    r('Şu an {kisi} önde! Kurtarmak isteyen var mı?', 'heyecan'),
    r('{kisi} kuleye bir adım daha yaklaştı!', 'heyecan'),
  ],
  berabere: [r('Oylar berabere! Kararı siz vereceksiniz, yazmaya devam!', 'heyecan')],
};

// Köylülerin kendi aralarındaki konuşmaları. {hedef} = diğer köylünün kısa adı
export const SOHBET = {
  muhtar: {
    davet: [r('Köylülerim! Muhtarınız olarak emrediyorum: soru sorun!', 'bagir'), r('Bu köyde söz hakkı herkese var! Yazın bakalım!', 'heyecan'), r('Muhtarınıza güvenin ve oyunuzu doğru kullanın!', 'normal')],
    sakin: [r('Herkes sakin olsun. Muhtarınız burada.', 'sakin'), r('Panik yok. Kanun var, düzen var.', 'sakin')],
    korku: [r('Bu gece muhtarlığın kapısını iki kere kilitleyeceğim...', 'korku'), r('Muhtarı ısırmaya kimse cesaret edemez... değil mi?', 'korku')],
    suclama: [r('{hedef}! Bana bak! Dün gece neredeydin sen?!', 'ofke'), r('{hedef}, senin hikâyen hiç tutmuyor!', 'ofke'), r('Ben söylüyorum: {hedef} bir şey saklıyor!', 'bagir')],
    savunma: [r('Ben mi?! Ben bu köyün muhtarıyım! Haddinizi bilin!', 'bagir'), r('Muhtara iftira atmak suçtur, kayda geçsin!', 'ofke')],
  },
  bakkal: {
    davet: [r('Hadi hadi, soru sormak bedava! Benim dükkândaki gibi değil!', 'heyecan'), r('Bana da sorun, bende dedikodu çok!', 'heyecan'), r('Fenerleri yakın da dükkânın önü aydınlansın!', 'heyecan')],
    sakin: [r('Tamam tamam, bağırmayalım, müşteri kaçıyor.', 'sakin'), r('Hesap kitap yapalım, aceleye gerek yok.', 'sakin')],
    korku: [r('Dükkânın kepengini üç kere kilitledim, yine de uyuyamıyorum!', 'korku'), r('Ya sıradaki ben olursam? Veresiyelerim ne olacak?', 'korku')],
    suclama: [r('{hedef}! Senin gözlerin niye kıpkırmızı?!', 'ofke'), r('Ben {hedef} diyorum, başka bir şey demiyorum!', 'bagir'), r('{hedef} dün gece dükkânın önünden geçti, ben gördüm!', 'ofke')],
    savunma: [r('Ben mi?! Ben dükkândan çıkmam ki! İftira bu!', 'bagir'), r('Bana bakmayın! Ben sadece bakkalım!', 'ofke')],
  },
  ebe: {
    davet: [r('Evlatlarım, korkmayın, sorun bakalım.', 'sakin'), r('Gelin evlatlarım, yanıma oturun, soru sorun.', 'sakin')],
    sakin: [r('Sakin olun evlatlarım, korku kötü danışmandır.', 'sakin'), r('Birbirinizi yemeyin evladım, vampir zaten bunu istiyor.', 'sakin')],
    korku: [r('Bu gece kapıya sarımsak asacağım evladım...', 'korku'), r('Yaşlı başımla bu korkuyu mu görecektim...', 'uzgun')],
    suclama: [r('{hedef}, evladım, bana doğruyu söyle!', 'ofke'), r('{hedef} evladım, senin hâlin hiç hayra alamet değil!', 'ofke')],
    savunma: [r('Ben mi evladım?! Bu köyün yarısını ben doğurttum!', 'bagir'), r('Ayıp evladım, ayıp! Benden mi şüpheleniyorsunuz?', 'ofke')],
  },
  coban: {
    davet: [r('Bana da soru sorabilirsiniz... korkmayın.', 'sakin'), r('Ben az konuşurum ama... sorarsanız söylerim.', 'sakin')],
    sakin: [r('Kuzular sakin olunca ben de sakinim...', 'sakin')],
    korku: [r('Koyunlarım çok korkuyor... ben de...', 'korku'), r('Gece ağılda yalnız kalmak istemiyorum...', 'korku')],
    suclama: [r('{hedef}... gece seni gördüm sanki...', 'korku'), r('{hedef}... neden bana öyle bakıyorsun?', 'korku')],
    savunma: [r('Ben değilim! Ben sadece çobanım!', 'bagir'), r('Ne olur inanın bana... ben bir şey yapmadım!', 'uzgun')],
  },
  ogretmen: {
    davet: [r('Kanıtları okuyun, sonra soru sorun. Mantık kazandırır.', 'sakin'), r('İyi bir soru, yarı cevaptır. Haydi sorun.', 'sakin')],
    sakin: [r('Sakin olalım. Kanıtlara bakalım.', 'sakin'), r('Bağırarak vampir bulunmaz. Düşünerek bulunur.', 'sakin')],
    korku: [r('Mantıklı olmaya çalışıyorum ama... bu gece uyuyamayacağım.', 'korku')],
    suclama: [r('{hedef}, anlattıkların birbirini tutmuyor.', 'sakin'), r('{hedef}, kanıtlar senin aleyhine.', 'ofke')],
    savunma: [r('Kanıtınız var mı? Yoksa susun!', 'ofke'), r('Ben öğretmenim, yalan söylemem! Kanıt getirin!', 'bagir')],
  },
  demirci: {
    davet: [r('Sorun. Cevap veririm. Kısa.', 'normal'), r('Lafı uzatmayın. Sorun.', 'normal')],
    sakin: [r('Bağırmayın. Kafam şişti.', 'sakin'), r('Sakin. Demir sabırla dövülür.', 'sakin')],
    korku: [r('Korkmam. Ama kapıyı kilitlerim.', 'normal')],
    suclama: [r('{hedef}. Sen. Şüphelisin.', 'ofke'), r('{hedef}, bana yalan söyleme!', 'bagir')],
    savunma: [r('Ben değilim! Çekicimi görmek isteyen gelsin!', 'bagir'), r('Hayır! Yanlış adam!', 'ofke')],
  },
};

export const ILGI = { muhtar: "Rıza'nın", bakkal: "Hasan'ın", ebe: "Fatma'nın", coban: "Ali'nin", ogretmen: "Selin'in", demirci: "Kemal'in" };

// Duruma göre yapılan çağrılar: kimin sorulmadığı, yorumlarda kimin adının geçtiği, kimin oy vermediği...
export const CAGRI = {
  soruYok: [
    r('Daha kimse soru sormadı! Bir köylünün adını yazıp sonuna soru işareti koyun. Mesela: Hasan dün gece neredeydin?', 'heyecan'),
    r('Birinin anlattığı sana uymadı mı? Adını yaz, sonra sor: Bunu kendi gözünle mi gördün, birinden mi duydun?', 'heyecan'),
  ],
  azSorulan: [
    r('{kime} bugün kimse bir şey sormadı... Belki de en çok o bir şey saklıyor!', 'fisilti'),
    r('{kisi} henüz ifade vermedi. Sorun bakalım: Dün gece seni orada gören kim vardı?', 'heyecan'),
  ],
  anilan: [
    r('Yorumlarda en çok {ilgi} adı geçiyor! Ne diyeceksin {kisa}?', 'heyecan'),
    r('Köy {kisi} diyor! {kisa}, kendini savun!', 'bagir'),
  ],
  ipucu: [
    r('Son ipucunu düşünün: {ipucu} Bu kime uyuyor? Yorumlara yazın!', 'normal'),
    r('İpucu ortada: {ipucu} Kimin hikâyesi buna uymuyor?', 'normal'),
  ],
  izleyiciSor: [
    r('{ad}! Sen kimden şüpheleniyorsun? Yaz bakalım!', 'heyecan'),
    r('{ad}, kimi suçluyorsun? Hangi sözü panodaki ipucuyla çelişiyor?', 'heyecan'),
    r('{ad}! Seni görüyorum! Hadi bir köylüyü sorguya çek!', 'alay'),
  ],
  sessizKalabalik: [r('Köyde {n} kişi var ama çoğu sessiz! Sessiz kalan vampirin yemi olur!', 'alay')],
  hayalet: [r('Hayaletler! Siz de soru sorabilir, oy verebilirsiniz. İntikamınızı alın!', 'heyecan')],
  sorgu30: [r('Sorguya otuz saniye kaldı! Son sorularınızı sorun, sonra oylama var!', 'heyecan')],
  sorgu10: [r('Oylama geliyor! Kararınızı verin!', 'bagir')],
  oyVermeyen: [
    r('{ad}! Oyunu bekliyoruz, bir numara yazman yeter!', 'heyecan'),
    r('{ad}! Sen kime oy veriyorsun? Hemen yaz!', 'heyecan'),
    r('{ad}! Doğru oy verirsen turun galibi sen olabilirsin!', 'heyecan'),
  ],
  oyDurum: [r('{oy} kişi oy verdi! En çok doğru oyu veren turun galibi olacak, senin oyun da sayılsın!', 'heyecan')],
  basabas: [r('Başa baş! {a} ile {b} arasında tek oy var!', 'bagir')],
  emin: [r('{kisi} önde... ama emin misiniz? İpuçlarına bir daha bakın!', 'fisilti')],
  lobi: [
    r('Acaba bu sefer vampiri bulabilecek misin? Köye katılmak için yorum yaz!', 'heyecan'),
    r('En çok doğru oyu veren turun galibi olur! Bu sefer sen olabilir misin?', 'heyecan'),
  ],
  lobiGalip: [r('Geçen turun galibi... {ad}! Bakalım bu turda tahtını koruyabilecek mi?', 'heyecan')],
  lobiLider: [r('Gecenin lideri... {ad}! Tam {n} doğru oy! Onu geçebilecek misin?', 'heyecan')],
  sabah: [r('İpucunu iyi okuyun... vampir bir hata yaptı!', 'fisilti'), r('Bugün vampiri bulabilecek misiniz?', 'heyecan')],
  kilitTepki: [
    r('Doğru karar! Ben baştan söylemiştim!', 'ofke'),
    r('Ya masumsa... ya vampir hâlâ aramızdaysa?', 'korku'),
    r('Hak etti!', 'ofke'),
    r('Yazık... ama karar karar.', 'uzgun'),
  ],
};

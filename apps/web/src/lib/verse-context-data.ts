/**
 * Ayet Baglami - yaygın yanlış anlaşılan ayetler için tarihsel baglamı,
 * klasik tefsir görüşleri ve akademik yanıtlar.
 */

export interface VerseMisconception {
  claim: string;
  response: string;
}

export interface RelatedVerseNote {
  verseKey: string;
  surahName: string;
  ayahNumber: number;
  note: string;
}

export interface ComparativeLawRow {
  system: string;
  ruling: string;
  protection: string;
}

export interface VerseContext {
  verseKey: string;
  surahName: string;
  category: string;
  topic: string;
  revelationContext: string;
  historicalNote: string;
  misconceptions: VerseMisconception[];
  legalNote?: string;
  comparativeLaw?: ComparativeLawRow[];
  relatedVerses: RelatedVerseNote[];
  sources?: string[];
}

export interface VerseCategory {
  id: string;
  label: string;
  icon: string;
}

export const VERSE_CATEGORIES: VerseCategory[] = [
  { id: "siddet", label: "Silahlı Çatışma ve Savaş", icon: "⚔️" },
  { id: "kadin", label: "Kadın Hakları", icon: "👩" },
  { id: "cinsellik", label: "Evlilik ve Cinsellik", icon: "💍" },
  { id: "ceza", label: "Ceza Hukuku", icon: "⚖️" },
  { id: "din", label: "Dini Özgürlük", icon: "🕊️" },
  { id: "kolelik", label: "Kölelik ve Özgürlük", icon: "🔓" },
  { id: "cennet", label: "Ahiret Tasvirleri", icon: "🌿" },
];

const VERSE_CONTEXTS: VerseContext[] = [

  // ── ŞİDDET / SAVAŞ ────────────────────────────────────────────────────────

  {
    verseKey: "9:5",
    surahName: "Tevbe",
    category: "siddet",
    topic: "Kılıç Ayeti: Antlaşma İhlalcilerine Hüküm",
    revelationContext:
      "Hicretin 9. yılında (630 CE) Tebük seferi dönüşünde, Hac mevsiminde nazil olmuştur. " +
      "Doğrudan arka plan, Mekke müşriklerinin Kudeyd Antlaşması'nı bozarak Müslümanların " +
      "müttefiki Beni Khuza'a'ya saldırmasıdır. Hemen öncesindeki 9:1-4 ayetleri antlaşmayı " +
      "koruyanlara dört aylık süre tanıyarak onları açıkça muaf tutar.",
    historicalNote:
      "9:5, tek başına okunduğunda evrensel bir 'her yerde öldür' emri gibi görünebilir. " +
      "Oysa 9:1-15 arası bir pasajın parçasıdır: antlaşma bildirisi (9:1-2), dört aylık süre " +
      "(9:3-4), antlaşma sadıklarına muafiyet (9:4), ihlalcilere hüküm (9:5), ardından aman " +
      "dileyen düşmana güvenli geçiş (9:6-7). Abdel Haleem ve pek çok modern akademisyen " +
      "bu ayetin savaş hukuku hükmü olduğunu, evrensel bir politika değil, belirli bir tarihsel " +
      "olaya verilen yanıt olduğunu göstermektedir.",
    misconceptions: [
      {
        claim: "Bu ayet tüm önceki barış ayetlerini neshetmiş ve Müslümanlara herkesi öldürme emri vermiştir.",
        response:
          "Nesh iddiası büyük ölçüde daha sonraki dönem âlimlerine aittir ve erken dönemde tartışmalıydı. " +
          "Abdel Haleem: Kur'an'daki yaklaşık 140 barış ve af ayetinin tek bir ayet tarafından " +
          "neshedildiği düşünülemez. Tevbe 9:6 ve 9:7, bizzat aynı pasajda, aman dileyen ve " +
          "güvenli geçiş isteyen düşmana koruma sağlanmasını emreder.",
      },
      {
        claim: "İslam'ın gayrimüslimlere genel savaş politikası bu ayette ortaya konulmuştur.",
        response:
          "Khaled Abou El Fadl: 'Kur'an'da gayrimüslimlere karşı niteliksiz ve koşulsuz savaşı " +
          "emreden tek bir ayet yoktur.' Ayet, antlaşmayı çiğneyen belirli gruplara yönelik bir " +
          "savaş hukuku hükmüdür. Antlaşmasını koruyan kabileler Tevbe 9:4'te açıkça istisna tutulur.",
      },
      {
        claim: "Peygamber bu ayeti Arabistan'daki tüm gayrimüslimlere karşı uyguladı.",
        response:
          "Tarihî kayıtlar, antlaşmasını koruyan kabilelerin dokunulmadığını göstermektedir. " +
          "Mekke'nin fethinde (630 CE) genel af ilan edilmiş, şehir sakinlerinin büyük çoğunluğu " +
          "serbest bırakılmıştır. Bu tablo, ayetin genel değil özel ve koşullu bir hüküm olduğunu ortaya koyar.",
      },
    ],
    relatedVerses: [
      { verseKey: "9:4", surahName: "Tevbe", ayahNumber: 4, note: "Antlaşmasını koruyanlar açıkça muaf tutulur." },
      { verseKey: "9:6", surahName: "Tevbe", ayahNumber: 6, note: "Aman dileyen düşmana güvenli geçiş emri; aynı pasaj." },
      { verseKey: "2:190", surahName: "Bakara", ayahNumber: 190, note: "Savaşı başlatma yasağı: 'Sınırı aşmayın.'" },
      { verseKey: "60:8", surahName: "Mümtehine", ayahNumber: 8, note: "Savaşmayan gayrimüslimlere adil ve iyi davranma emri." },
    ],
    sources: [
      "İbn Kesir, Tefsiru'l-Kur'ani'l-Azim, Tevbe 9:5",
      "Taberi, Câmiu'l-Beyan, Tevbe 9:5",
      "Muhammad Abdel Haleem, The Qur'an (Oxford UP, 2004)",
      "Khaled Abou El Fadl, The Great Theft (HarperOne, 2005)",
    ],
  },

  {
    verseKey: "9:29",
    surahName: "Tevbe",
    category: "siddet",
    topic: "Cizye ve Ehl-i Kitab ile İlişkiler",
    revelationContext:
      "Hicretin 9. yılında (630 CE), Tebük Seferi öncesinde nazil olmuştur. " +
      "Doğrudan bağlam, Bizans İmparatorluğu'nun Müslüman topraklarına yönelik saldırı " +
      "girişimine dair haberler ve bu ittifaka katılan Hristiyan Arap kabilelerle ilgili " +
      "savaş politikasının belirlenmesidir.",
    historicalNote:
      "Cizye, İslam devletinin koruması altında yaşayan gayrimüslim erkeklerin ödediği " +
      "vergidir; karşılığında yaşam, mülkiyet ve inanç güvencesi verilir. Müslümanlar " +
      "ise zekât öder ve askerlik yapar. Hz. Ömer'in bir Hristiyan kabileden cizye " +
      "topladıktan sonra onları koruyamayınca vergiyi iade ettiğine dair rivayet, " +
      "sistemin öncelikle karşılıklı yükümlülük üzerine kurulduğunu gösterir.",
    misconceptions: [
      {
        claim: "'Küçülmüş/zelil olarak' ibaresi gayrimüslimlere hakareti meşrulaştırır.",
        response:
          "Klasik Arapça'da 'an yadin ve hüm sagirun' ifadesi, Bizans döneminin tabi statüsüne " +
          "verilen diplomatik bir addır. Emevi dönemi vergi kayıtları, cizye toplamanın normal " +
          "bir mali prosedür olduğunu gösterir. W. Cleveland ve M. Bunton: 'Zimmet statüsü, " +
          "dönemin koşullarına göre olağanüstü hoşgörülüydü ve Bizans uygulamalarıyla " +
          "taban tabana zıttı.'",
      },
      {
        claim: "Cizye zorla din değiştirmeye yönelik bir baskı aracıdır.",
        response:
          "Cizye ödeyen zimmilere dini özerklik, mülkiyet güvencesi ve özel ibadet hakkı " +
          "tanınmıştır. Orta Çağ boyunca İslam coğrafyasında Yahudi, Hristiyan ve Zerdüşt " +
          "toplulukların varlığını sürdürmesi, sistemin din değiştirme baskısı oluşturmadığını " +
          "tarihsel olarak kanıtlar.",
      },
    ],
    comparativeLaw: [
      { system: "Bizans İmparatorluğu (7. yy.)", ruling: "Zerdüşt ve putperestlere neredeyse hiç koruma yok", protection: "Yok" },
      { system: "Sasani İmparatorluğu", ruling: "Zerdüşt olmayanlar ikinci sınıf", protection: "Minimal" },
      { system: "İslam Zimmet Sistemi", ruling: "Vergi karşılığı tam dini özerklik ve can güvencesi", protection: "Yazılı sözleşme" },
    ],
    relatedVerses: [
      { verseKey: "9:4", surahName: "Tevbe", ayahNumber: 4, note: "Antlaşmasını koruyanlarla ilişki devam eder." },
      { verseKey: "60:8", surahName: "Mümtehine", ayahNumber: 8, note: "Savaşmayan gayrimüslimlere adil davranma." },
      { verseKey: "2:256", surahName: "Bakara", ayahNumber: 256, note: "Dinde zorlama yoktur." },
    ],
    sources: [
      "İbn Kesir, Tevbe 9:29 tefsiri",
      "W. Cleveland ve M. Bunton, A History of the Modern Middle East (Westview, 2009)",
      "Academia.edu, Fighting the Unbelievers: Various Perspectives on Qur'an 9:29",
    ],
  },

  {
    verseKey: "2:191",
    surahName: "Bakara",
    category: "siddet",
    topic: "Savunma Savaşının Sınırları",
    revelationContext:
      "Hicretin 6. yılı civarında, Hudeybiye Antlaşması sürecinde nazil olduğu " +
      "kabul edilmektedir. Müslümanlar Kabe'yi ziyaret etmek istemiş, Kureyş engellemiştir. " +
      "Sahabeler, müşriklerin antlaşmayı bozarak Müslümanları Hac sırasında öldürmesi " +
      "ihtimalini sormuş; pasaj bu korkuya yanıt olarak inmiştir.",
    historicalNote:
      "2:191, 2:190-194'ten oluşan bir pasajın ortasındadır. 2:190, savaşı saldırıya " +
      "cevapla sınırlar: 'Sınırı aşmayın.' 2:192-193, düşman geri adım atarsa savaşın " +
      "derhal sonlandırılmasını emreder. Ayeti ortasından alıp 2:190 ve 2:192'yi " +
      "görmezden gelmek, metnin iç tutarlılığını bozmaktır.",
    misconceptions: [
      {
        claim: "Ayet Müslümanlara herkesi ve her yerde öldürme izni vermektedir.",
        response:
          "2:190, hemen öncesinde açık bir kısıtlama koyar: 'Sizinle savaşanlara karşı " +
          "savaşın; sınırı aşmayın.' Ayet, saldırıya verilen savunma yanıtını düzenler, " +
          "proaktif şiddeti değil.",
      },
      {
        claim: "'Fitne katl'dan büyüktür' cümlesi şiddeti meşrulaştırır.",
        response:
          "Buradaki 'fitne', bu bağlamda sistematik dini zulüm ve zorla din değiştirme " +
          "baskısı anlamına gelir. İnsanlara inançları yüzünden baskı uygulamanın savunma " +
          "amaçlı silahlı mücadeleden daha büyük bir zarar olduğu ifade edilmektedir. " +
          "Bu bir şiddet ruhsatı değil, zulmü durdurmak için koşullu bir izindir.",
      },
    ],
    relatedVerses: [
      { verseKey: "2:190", surahName: "Bakara", ayahNumber: 190, note: "Savaşı saldırıyla sınırlayan ayet; hemen öncesi." },
      { verseKey: "2:192", surahName: "Bakara", ayahNumber: 192, note: "Düşman vazgeçerse savaş sona erer." },
      { verseKey: "8:61", surahName: "Enfal", ayahNumber: 61, note: "Düşman barışa yönelirse Müslümanlar da yönelmelidir." },
    ],
    sources: [
      "Taberi, Câmiu'l-Beyan, Bakara 2:190-194",
      "Maududi, Tefhimu'l-Kur'an, Bakara 2:191",
      "İbn Kesir, Tefsir",
    ],
  },

  // ── KADIN HAKLARI ─────────────────────────────────────────────────────────

  {
    verseKey: "4:34",
    surahName: "Nisa",
    category: "kadin",
    topic: "Kavvamun ve Daraba: Aile Otoritesi ve Disiplin",
    revelationContext:
      "Rivayetlere göre (Ebu Davud, Nesai) bir kadın kocası tarafından yüzüne " +
      "vurulduktan sonra Peygamber'e gelerek kısas talep etti. Peygamber başlangıçta " +
      "kısas yönünde eğilim gösterdi; bu ayet indi ve meselenin aile içinde çözülmesini " +
      "emretti. Farklı rivayetlerde ise Ensar'dan bir kadının kocanın otoritesine dair " +
      "soru sorması üzerine indiği nakledilir.",
    historicalNote:
      "Kavvamun kavramı Taberi'ye göre iki temele dayanır: Allah'ın verdiği üstünlük " +
      "ve nafaka yükümlülüğü. İkinci gerekçe şartlıdır; erkeğin mali yükümlülüğünü " +
      "yerine getirmediği durumlarda bu statünün düşeceğini Maududi de kabul eder. " +
      "İbn Hacer, ayetin tümünü incelediğinde eşi dövmenin 'kerahaten mekruh'a yakın " +
      "değerlendirildiğinin şüphe götürmez olduğunu söyler.",
    misconceptions: [
      {
        claim: "Ayet erkeklere kadınları dövme yetkisi açıkça vermektedir.",
        response:
          "Kur'an'daki üçlü süreç (öğüt, ayrı yatma, daraba) tırmanmayı önlemek için " +
          "tasarlanmıştır. Peygamber'in bizzat eşlerine hiç vurmadığı ve 'Allah'ın " +
          "cariyelerini dövmeyin' dediği sahih kaynaklarda sabittir (Ebu Davud, İbn Mace). " +
          "Laleh Bakhtiar ve pek çok dilbilimci, 'daraba' kelimesinin bu bağlamda " +
          "'onlardan uzak durmak' anlamına geldiğini savunur.",
      },
      {
        claim: "Kavvamun kavramı kadını sürekli ve mutlak bir vesayet altına alır.",
        response:
          "Kavvam kavramı Kur'an'da şartlıdır: 'nafaka harcadıkları için.' Aynı " +
          "ayette kadınların kendi koruma, onur ve hakları açıkça yer alır. " +
          "Amina Wadud ve Khaled Abou El Fadl, pasajın ataerkil bir pratiği " +
          "onaylamadığını; aksine üzerinde reformcu kısıtlama getirdiğini savunur.",
      },
      {
        claim: "Bu sistem İslam'ın temel kadın anlayışını yansıtmaktadır.",
        response:
          "Kecia Ali (Marriage and Slavery in Early Islam, Harvard 2010), klasik " +
          "tefsirin Abbasi döneminin Bizans ve Sasani toplumsal yapılarından derin " +
          "biçimde etkilendiğini gösterir. Kur'an metni ile sonraki fıkhi " +
          "gelenek arasında dikkatli bir ayrım yapmak gerekir.",
      },
    ],
    relatedVerses: [
      { verseKey: "2:228", surahName: "Bakara", ayahNumber: 228, note: "Kadınların hakları yükümlülükleriyle eşdeğerdir." },
      { verseKey: "4:19", surahName: "Nisa", ayahNumber: 19, note: "Kadınlarla güzel geçinme emri." },
      { verseKey: "30:21", surahName: "Rum", ayahNumber: 21, note: "Eşler arasında sevgi ve merhamet Allah'ın ayetlerindendir." },
    ],
    sources: [
      "İbn Kesir, Nisa 4:34",
      "Taberi, Câmiu'l-Beyan",
      "İbn Hacer el-Askalani, Fethu'l-Bari",
      "Laleh Bakhtiar, The Sublime Quran (Kazi, 2007)",
      "Amina Wadud, Qur'an and Woman (Oxford UP, 1999)",
      "Kecia Ali, Marriage and Slavery in Early Islam (Harvard UP, 2010)",
    ],
  },

  {
    verseKey: "2:282",
    surahName: "Bakara",
    category: "kadin",
    topic: "Ticari Sözleşmelerde Tanıklık Düzenlemesi",
    revelationContext:
      "Kur'an'ın en uzun ayeti olan 2:282, ticari borç sözleşmelerinin yazılı " +
      "kaydedilmesini düzenler. Medine döneminin ticaret hukukuna ilişkin sorulara " +
      "yanıt olarak inmiştir. Ayet, kadın tanıklığını yalnızca ticari borç sözleşmeleri " +
      "bağlamında ele alır; evlilik, boşanma, ceza davaları veya diğer alanlarda " +
      "genel bir hüküm içermez.",
    historicalNote:
      "Ayetin 'iki kadın tanık' düzenlemesi, 7. yüzyılda ticari işlemlere az " +
      "katılan kadınların tanık olarak çağrılmasını kolaylaştırmak için önerilmiş " +
      "pratik bir mekanizmadır. Taha Jabir el-Alwani: 'Ayet bir fırsat kısıtlaması " +
      "değil, bir kolaylık sağlıyor.' İbn Teymiye ve İbn el-Kayyim, tanıklık " +
      "eşitsizliğini bu ayete dayandırma argümanını güçlü bulmaz.",
    misconceptions: [
      {
        claim: "Bu ayet kadının erkekten yarım akıllı olduğunu ilan eder.",
        response:
          "'Yarım akıl' ifadesi bu ayette değil, bir hadiste geçer (Buhari) ve bağlamı " +
          "zekat alıcı kadınlara yönelik bir dini yükümlülük karşılaştırmasıdır. " +
          "Epistemik ya da entelektüel bir hiyerarşi kurmaz.",
      },
      {
        claim: "Bu hüküm İslam hukukunun tüm alanlarında kadın tanıklığını yarıma indirir.",
        response:
          "Klasik İslam hukukunda bile bu hüküm farklı yorumlanmıştır. Bazı Hanefi " +
          "fakihleri cezai davalarda kadın tanıklığını kabul etmiştir. Ayet bağlamı " +
          "açıktır: 'edane' (borç sözleşmesi). Ghamidi, kapsamı yalnızca bu alana sınırlar.",
      },
    ],
    relatedVerses: [
      { verseKey: "2:256", surahName: "Bakara", ayahNumber: 256, note: "Dinde zorlama yoktur; aynı surede özgürlük ilkesi." },
      { verseKey: "2:228", surahName: "Bakara", ayahNumber: 228, note: "Kadınların hakları yükümlülükleriyle eşdeğerdir." },
      { verseKey: "65:2", surahName: "Talak", ayahNumber: 2, note: "Aile hukukunda adil tanıklık; kadın tanıklığı kabul edilir." },
    ],
    sources: [
      "İbn Kesir, Bakara 2:282",
      "Ghamidi, Meezan",
      "Taha Jabir el-Alwani, The Testimony of Women in Islamic Law",
    ],
  },

  {
    verseKey: "4:11",
    surahName: "Nisa",
    category: "kadin",
    topic: "Miras Paylaşımı ve Denge Modeli",
    revelationContext:
      "Kız çocuklarına ve kadınlara hiç miras hakkı tanımayan cahiliye geleneğine " +
      "doğrudan bir müdahale olarak nazil olmuştur. Rivayete göre Sa'd ibn Ebi Vakkas " +
      "öldükten sonra dul eşi ve kızları, amcalarının mirasın tamamına el koyduğunu " +
      "Peygamber'e şikâyet etti; ayet bu şikâyet üzerine indi.",
    historicalNote:
      "İslam miras sistemi bir denge modeli kurar: erkek mehr ödemek, karısının geçimini " +
      "sağlamak ve aile masraflarını üstlenmek zorundadır. Kadın aldığı mirası tamamen " +
      "kendi tasarrufunda tutar; harcama yükümlülüğü yoktur. Bazı senaryolarda kadın, " +
      "toplam devredilen servetten orantısal olarak daha büyük pay alabilir. " +
      "Taberi, ayetin öncesinde kızlara hiç miras verilmediğini aktararak 4:11'i " +
      "tarihsel bir reformun belgesi olarak sunar.",
    misconceptions: [
      {
        claim: "Kadın her zaman erkekten yarım miras alır, bu eşitsizliktir.",
        response:
          "Erkek mehr öder, eşinin ve ailesinin nafakasını karşılar; kadın ise aldığı " +
          "mirası hiçbir harcama yükümlülüğü olmaksızın biriktirebilir. Net ekonomik " +
          "tablo hesaplandığında kadın bazı senaryolarda daha avantajlıdır. " +
          "Ayrıca ayet bu kuralı tüm durumlara uygulamaz: baba-anne senaryosunda " +
          "her ikisi de eşit pay alır (4:11 ikinci senaryo).",
      },
      {
        claim: "Bu hüküm İslam'ın kadını ikincil görmesinin kanıtıdır.",
        response:
          "Aynı surenin 4:7 ayeti kadınların miras hakkını ilkesel olarak güvence altına " +
          "alır: 'Erkeklerin de kadınların da ana-baba ve yakınlarının bıraktıklarından " +
          "hissesi vardır.' Cahiliye Arabistan'ında kadınlara sıfır miras verilirken " +
          "Kur'an'ın yasal pay getirmesi döneminin çok ötesinde bir reformdur.",
      },
    ],
    relatedVerses: [
      { verseKey: "4:7", surahName: "Nisa", ayahNumber: 7, note: "Kadınların miras hakkını ilkesel olarak güvence altına alan ayet." },
      { verseKey: "4:19", surahName: "Nisa", ayahNumber: 19, note: "Kadın mülkü zorla almak yasaktır." },
      { verseKey: "2:228", surahName: "Bakara", ayahNumber: 228, note: "Karşılıklı haklar eşdeğerdir." },
    ],
    sources: [
      "Taberi, Nisa 4:11",
      "Maududi, Tefhimu'l-Kur'an",
    ],
  },

  {
    verseKey: "2:223",
    surahName: "Bakara",
    category: "kadin",
    topic: "Tarla Metaforu: Eşler Arasındaki Cinsel Etik",
    revelationContext:
      "İki rivayet aktarılmaktadır. Birincisi: Medine Yahudileri Müslümanlara, " +
      "karıyla arkadan birlikteliğin gözü şaşı çocuğa yol açacağını söyledi; " +
      "bu inanç yayılınca Müslümanlar Peygamber'e sordu, ayet bu konuda aydınlatma " +
      "olarak indi. İkincisi: Ensar'dan bir grup bu konuyu Peygamber'e doğrudan sordu.",
    historicalNote:
      "İbn Kesir ve İbn Abbas, ayetin kastının yalnızca vajinal ilişki olduğunu açıkça " +
      "belirtir; anal ilişkiyi ise kesin haram sayar. 'Hars' (tarla) metaforu Arap " +
      "dilinde üreme, süreklilik ve bereket anlamlarını taşır. Aynı surenin 2:187 " +
      "ayeti eşleri birbirinin 'libası' (elbisesi) olarak tanımlar; bu, ilişkide " +
      "karşılıklılığı güçlü biçimde vurgular.",
    misconceptions: [
      {
        claim: "Tarla metaforu kadını bir nesne ve üreme aracı olarak konumlandırır.",
        response:
          "'Dilediğiniz gibi' cümleciğinin hemen ardından 'kendiniz için iyiyi önceden " +
          "hazırlayın, Allah'a karşı gelmekten sakının' der. Bu ek, ayeti cinsel " +
          "haktan ziyade manevi sorumluluk çerçevesine yerleştirir.",
      },
      {
        claim: "Bu ayet erkek egemenliğini cinsel alanda meşrulaştırır.",
        response:
          "2:222-223 birlikte okunmalıdır: 2:222 âdet hâlindeki kadından uzak durmayı " +
          "emreder ve bu emir kadının bedensel özerkliğini korur. 2:223, bu geçici " +
          "ayrılık sonrasını düzenler. 2:187, eşleri birbirinin 'elbisesi' sayar; " +
          "bu karşılıklılık ilkesi tek taraflı bir yetki anlayışını dışlar.",
      },
    ],
    relatedVerses: [
      { verseKey: "2:222", surahName: "Bakara", ayahNumber: 222, note: "Âdet hâlindeki kadından uzak durma emri; hemen öncesi." },
      { verseKey: "2:187", surahName: "Bakara", ayahNumber: 187, note: "Eşler birbirinin 'elbisesi'dir; karşılıklılık ilkesi." },
      { verseKey: "30:21", surahName: "Rum", ayahNumber: 21, note: "Eşler arasında sevgi ve rahmet Allah'ın ayetlerindendir." },
    ],
    sources: [
      "İbn Kesir, Bakara 2:223",
      "İbn Abbas tefsiri",
    ],
  },

  // ── CİNSELLİK / EVLİLİK ──────────────────────────────────────────────────

  {
    verseKey: "4:3",
    surahName: "Nisa",
    category: "cinsellik",
    topic: "Çok Eşlilik: Kısıtlama mı, İzin mi?",
    revelationContext:
      "Uhud Savaşı'nın (625 CE) hemen ardından nazil olmuştur. Savaşta pek çok " +
      "Müslüman erkek hayatını kaybetmiş; geride dul kadınlar ve yetim çocuklar " +
      "kalmıştır. Nüzul sebebi olarak yetim kız çocuklarının velilerinin onları " +
      "haksız biçimde yönetmesi gösterilir: veliler bu kızların servetini kontrol " +
      "etmek için onlarla evlenmek istiyordu fakat adaletli davranmıyordu.",
    historicalNote:
      "İbn Abbas ve İkrime, cahiliyede erkeklerin on veya daha fazla eşe " +
      "sahip olabildiğini aktarır; ayet bunu dörtle sınırladı ve 'adaleti " +
      "yerine getirememe' koşulunu ekledi. Nisa 4:129 ('Eşler arasında tam " +
      "adalet etmeniz mümkün değildir') ile birlikte okunduğunda ikinci evlilik " +
      "son derece yüksek bir eşiğe bağlanmış olur.",
    misconceptions: [
      {
        claim: "Çok eşlilik kadına zarar verir ve İslam bunu teşvik eder.",
        response:
          "Ayet, çok eşliliğe izin verdiği kadar onu kısıtlar: 'Adaleti yerine " +
          "getiremeyeceğinden korkarsan tek eşle kal.' Nisa 4:129, eşler arasında " +
          "tam adaletin pratik olarak imkânsız olduğunu söyler; bu, çok eşliliği " +
          "son derece nadir bir istisna konumuna getirir.",
      },
      {
        claim: "Bu hüküm İslam'ın kadın eşitsizliğine dayalı yapısını gösterir.",
        response:
          "Tarihi bağlamda Arabistan'da sınırsız çok eşlilik yaygındı. Bu ayet onu " +
          "reformist biçimde dörtle sınırlandırdı ve adaleti zorunlu şart haline " +
          "getirdi. Tunus (1956) ve Türkiye gibi Müslüman çoğunluklu ülkeler bunu " +
          "yasal olarak yasaklamıştır; reform tartışmaları İslam içinde canlıdır.",
      },
    ],
    relatedVerses: [
      { verseKey: "4:129", surahName: "Nisa", ayahNumber: 129, note: "Eşler arasında tam adalet mümkün değildir; tek eşlilik yönünde güçlü bir yönlendirme." },
      { verseKey: "4:1", surahName: "Nisa", ayahNumber: 1, note: "Surenin başında tüm insanların tek özden yaratıldığı; eşitlik ilkesi." },
    ],
    sources: [
      "İbn Kesir, Nisa 4:3",
      "Taberi",
      "Maududi, Tefhimu'l-Kur'an",
    ],
  },

  {
    verseKey: "4:24",
    surahName: "Nisa",
    category: "cinsellik",
    topic: "Savaş Esirleri ve Tarihsel Sınırlar",
    revelationContext:
      "Evrensel olarak kabul gören nüzul sebebi, Ebu Said el-Hudri'den nakledilen " +
      "Evtas Muharebesi rivayetidir (Sahih Muslim): Müslümanlar galip geldi ve " +
      "evli kadınları esir aldı. Sahabeler bu esir evli kadınlarla ilişkinin " +
      "caiz olup olmadığını sordu; ayet bu soruya yanıt olarak indi.",
    historicalNote:
      "Klasik fıkıh, istibra (tek adet dönemi bekleme), esir kadının hamile " +
      "olmadığının teyidi ve meşru savaş kapsamı gibi ciddi önleyici şartlar " +
      "koyar. 2014'te IŞİD'in bu ayete dayanarak Ezidi kadınları köleleştirmesi " +
      "üzerine 126 İslam âlimi müşterek açık mektupla bu yorumu reddetti ve " +
      "İslam âlimler topluluğunun köleliğe karşı oluşturduğu konsensüse " +
      "aykırı olduğunu ilan etti.",
    misconceptions: [
      {
        claim: "Bu ayet tecavüzü meşrulaştırır.",
        response:
          "Klasik fıkıh, istibra ve hamilelik kontrolü gibi ciddi ön şartlar koyar. " +
          "126 İslam âliminin 2014'te IŞİD'e yazdığı açık mektupta bu yorum " +
          "açıkça reddedilmiştir. 20. yüzyıl ortasından itibaren Müslüman " +
          "âlimlerin büyük çoğunluğu, tüm Müslüman devletlerin köleliği yasal " +
          "olarak yasaklamasıyla bu hükmün uygulanamaz olduğunu kabul eder.",
      },
      {
        claim: "IŞİD bu ayeti Ezidi kadınlara karşı doğru uyguladı.",
        response:
          "IŞİD'in eylemi dünya genelinde İslam âlimlerinin ezici çoğunluğu tarafından " +
          "reddedilmiştir. Jonathan Brown (Slavery and Islam, 2019), savaş esaretinin " +
          "İslam hukuku kapsamında artık geçerliliği olmayan tarihsel bir kategori " +
          "olduğunu ve bu hükmün modern bağlamda uygulanamayacağını belgeler.",
      },
    ],
    relatedVerses: [
      { verseKey: "24:33", surahName: "Nur", ayahNumber: 33, note: "Cariyeyi fuhşa zorlamak kesin haram; kölelik sistemine sert sınır." },
      { verseKey: "4:25", surahName: "Nisa", ayahNumber: 25, note: "Evlenemeyen için cariyelerle evlilik düzenlemesi; insan onurunu koruma." },
      { verseKey: "9:60", surahName: "Tevbe", ayahNumber: 60, note: "Zekattan köle azatlamak için pay." },
    ],
    sources: [
      "Sahih Muslim, Evtas rivayeti",
      "İbn Kesir, Nisa 4:24",
      "Jonathan Brown, Slavery and Islam (Oneworld, 2019)",
    ],
  },

  {
    verseKey: "33:50",
    surahName: "Ahzab",
    category: "cinsellik",
    topic: "Peygamber'in Özel Evlilik Statüsü",
    revelationContext:
      "Müslümanların Peygamber'in dört eş sınırını neden aştığını sorgulamasına " +
      "yanıt olarak inmiştir. Ayet bu özel statünün yalnızca Peygamber'e mahsus " +
      "olduğunu ve diğer müminlere uygulanamayacağını açıkça ilan eder: " +
      "'Bu yalnızca sana mahsustur, diğer müminlere değil.'",
    historicalNote:
      "Maududi, Peygamber'in evliliklerinin stratejik ve toplumsal birlik işlevi " +
      "gördüğünü; pek çok evliliğin ittifak kurma, düşmanlıkları sona erdirme ve " +
      "dul kadınları koruma amacı taşıdığını açıklar. Lesley Hazleton (After the " +
      "Prophet, 2009), Peygamber'in evliliklerinin büyük çoğunluğunun dul ve boşanmış " +
      "kadınlarla yapıldığını ve siyasi ittifak işlevi gördüğünü belgeler. " +
      "33:52 ilerleyen ayetlerde yeni evlilik yasağı getirir; bu, 'sınırsız " +
      "ayrıcalık' iddiasını tartışmalı kılar.",
    misconceptions: [
      {
        claim: "Peygamber kendisi için özel kurallar yazdı.",
        response:
          "Ayet tam tersini ortaya koyar: kuralı koyan Allah'tır ve aynı ayet bu " +
          "özel statüyü 'yalnızca sana' diye sınırlandırır. 33:52, ilerleyen " +
          "ayette yeni evlilik ve mevcut eşleri değiştirme yasağını getirir; " +
          "bu, iddia edilen 'sınırsız ayrıcalık' argümanını doğrudan çürütür.",
      },
      {
        claim: "Zeynep binti Cahş ile evlilik kişisel çıkar içindi.",
        response:
          "Çağdaş tarih yazımı bu evliliğin, evlatlık ile öz oğlun eşdeğer " +
          "tutulduğu cahiliye anlayışını kırmak için İslam'ın açık bir hukuki " +
          "emri olduğunu öne çıkarır. 33:37, bu gerekçeyi bizzat zikreder.",
      },
    ],
    relatedVerses: [
      { verseKey: "33:52", surahName: "Ahzab", ayahNumber: 52, note: "Peygamber'e daha fazla evlilik yasağı; 'sınırsız ayrıcalık' iddiasını çürütür." },
      { verseKey: "33:37", surahName: "Ahzab", ayahNumber: 37, note: "Zeynep evliliğinin gerekçesi: evlatlık kurumunu kaldırma." },
    ],
    sources: [
      "İbn Kesir, Ahzab 33:50",
      "Maududi, Tefhimu'l-Kur'an",
      "Lesley Hazleton, After the Prophet (2009)",
    ],
  },

  // ── CEZA HUKUKU ───────────────────────────────────────────────────────────

  {
    verseKey: "5:38",
    surahName: "Maide",
    category: "ceza",
    topic: "Hırsızlıkta El Kesme: Şartlar ve Sınırlar",
    revelationContext:
      "Medine döneminin sonlarında, toplumsal düzenin inşası sürecinde nazil olmuştur. " +
      "Rivayetlerde mümtaz bir aileden (Mahzumoğulları'ndan) birinin hırsızlık yapması " +
      "üzerine Peygamber'in şefaat taleplerini reddederek cezayı uyguladığı aktarılır; " +
      "bu olay hukuk önünde eşitliğe dair güçlü bir mesaj içerir.",
    historicalNote:
      "Kurtubi ve İbn Kesir on küsur ön koşul sayar: nisab (asgari değer), hirz " +
      "(güvenli yerden çalınmış olma), herhangi bir şüphenin yokluğu, zorunluluğun " +
      "bulunmaması. Hz. Ömer kıtlık döneminde el kesme cezasını askıya almıştır; " +
      "bu, devletin adil dağılımı sağlamadığı durumlarda hadd cezasının " +
      "uygulanamayacağını ortaya koyan emsal bir karardır.",
    misconceptions: [
      {
        claim: "Bu ceza barbarca ve orantısızdır.",
        response:
          "Klasik fakihlerin koyduğu şartlar bu cezayı uygulamada son derece sınırlı " +
          "tutmuştur. Hz. Ömer'in kıtlık istisnası, sosyal adaletin hadd cezasından " +
          "önce gelmesi gerektiğini tesis eder. Muhammed Shahrur ve pek çok çağdaş " +
          "âlim, hadd cezalarının ancak sıfır yoksulluk ve kapsamlı sosyal güvenlik " +
          "ağı kurulduktan sonra uygulanabileceğini savunur.",
      },
      {
        claim: "Suudi Arabistan uygulaması İslam'ın bu hükme bakışını yansıtır.",
        response:
          "Modern devlet uygulamalarını Kur'an hükmünden ayırt etmek gerekir. " +
          "Hüküm, tarihsel klasik fıkıhta bile son derece ağır ispat şartlarına " +
          "bağlıdır ve Hz. Ömer'in kıtlık istisnası, sosyal adaletin " +
          "ön koşul olduğunu emsal olarak belirlemiştir.",
      },
    ],
    relatedVerses: [
      { verseKey: "5:39", surahName: "Maide", ayahNumber: 39, note: "Tövbe ve ıslah: ceza manevi dönüşümün önüne geçmez." },
      { verseKey: "5:33", surahName: "Maide", ayahNumber: 33, note: "Eşkıyalık için farklı derecede ceza; bağlam önemli." },
    ],
    sources: [
      "İbn Kesir, Maide 5:38",
      "Kurtubi, el-Câmi",
    ],
  },

  {
    verseKey: "24:2",
    surahName: "Nur",
    category: "ceza",
    topic: "Zinaya 100 Sopa: İspat Yükü ve Caydırıcılık",
    revelationContext:
      "Sure-i Nur, Hz. Aişe'ye yapılan iftira olayının (hadisetu'l-ifk, 627-628 CE) " +
      "ardından nazil olmuştur. Bu olay, asılsız zina suçlamasının topluma ne kadar " +
      "derin zarar verebileceğini ortaya koymuş; 24:4-9, iffete iftira atanlar için " +
      "ağır ceza getirmiştir. 24:2 bu bağlamda yalnızca suçun cezasını değil, " +
      "ispat güçlüğünü de ortaya koyar.",
    historicalNote:
      "Dört görgü tanığı şartı, mahkûmiyeti pratikte imkânsız düzeye " +
      "yaklaştırmıştır. Kurtubi bunu açıkça not eder. Maududi: 'Temel işlev " +
      "caydırıcılıktır; dört tanık şartı cezayı yalnızca alenen ve utanmazca " +
      "işlenen vakalarla sınırlar.' Ghamidi, surenin asıl mesajının mahkûmiyeti " +
      "kolaylaştırmak değil, iftira suçunu önlemek olduğunu savunur.",
    misconceptions: [
      {
        claim: "Bu ceza aşırıdır ve özellikle kadınlara karşı kullanılır.",
        response:
          "Ayet erkek ve kadını eşit biçimde hedef alır: 'Zina eden kadın ve zina " +
          "eden erkek...' Her ikisi için aynı ceza ve aynı ispat şartı geçerlidir. " +
          "Dört tanık şartı bu cezayı tarihsel olarak son derece nadir kılar. " +
          "Uygulama eşitsizliği varsa sorun Kur'an metninde değil, " +
          "tarihsel erkek egemen yargı uygulamalarındadır.",
      },
      {
        claim: "Tecavüz mağduru zina suçlamasıyla karşılaşabilir.",
        response:
          "Bu, belirli fıkhi yorumlarda ortaya çıkan ciddi bir uygulama sorunudur; " +
          "ancak Kur'an metninde doğrudan bir dayanak yoktur. 24:4-5, " +
          "iftiracıyı ağır biçimde cezalandırır. İbn Aşur, tecavüzün " +
          "zina kapsamına girmediğini açıkça belirtir.",
      },
    ],
    relatedVerses: [
      { verseKey: "24:4", surahName: "Nur", ayahNumber: 4, note: "İffete iftira atanlar için 80 sopa; yanlış suçlamanın cezası." },
      { verseKey: "24:6", surahName: "Nur", ayahNumber: 6, note: "Li'an: eşler arasındaki iddiayı dört tanık olmaksızın çözme mekanizması." },
    ],
    sources: [
      "İbn Kesir, Nur 24:2",
      "Kurtubi, el-Câmi",
      "Maududi, Tefhimu'l-Kur'an",
      "İbn Aşur, et-Tahrir ve't-Tenvir",
    ],
  },

  // ── DİNİ ÖZGÜRLÜK ─────────────────────────────────────────────────────────

  {
    verseKey: "4:89",
    surahName: "Nisa",
    category: "din",
    topic: "İrtidat mı, Siyasi İhanet mi?",
    revelationContext:
      "Uhud Savaşı öncesinde veya sırasında münafıkların bir grubu Müslüman " +
      "saflarından ayrılarak Mekke'ye geçmiş; Müslümanlar geri dönenlerle nasıl " +
      "ilişki kurulacağını sormuştur. Bu kişiler, salt dini inancı değiştiren " +
      "mürtetler değil, İslam devletini terk edip düşman safına aktif olarak " +
      "katılan siyasi hainlerdir.",
    historicalNote:
      "Kur'an'ın hiçbir ayeti irtidat için dünyevi ölüm cezası öngörmez. " +
      "Maududi bunu açıkça kabul eder: 'Kur'an, irtidat için herhangi bir " +
      "dünyevi ceza belirlememiştir.' 2:256 ('Dinde zorlama yoktur'), 10:99 " +
      "ve 18:29 doğrudan din özgürlüğünü güvence altına alır. " +
      "Kur'an, manevi irtidat için ahiret azabını zikreder (2:217, 3:86-91) " +
      "ancak dünyevi bir ceza belirlemez.",
    misconceptions: [
      {
        claim: "İslam irtidat için ölüm cezası öngörmektedir ve bu Kur'an'a dayanır.",
        response:
          "Kur'an'ın hiçbir ayeti irtidat için dünyevi ölüm cezası öngörmez. " +
          "'İrtidat' hadisleri Kur'an değil hadis literatürüne dayanır ve " +
          "bu hadislerin tarihsel bağlamı da savaş dönemi ihanetine işaret " +
          "eder. Şeyh el-Ezher Ali Cuma ve Abdullahi Ahmed en-Naim gibi çağdaş " +
          "âlimler, ölüm cezasının herhangi bir Kur'an dayanağından yoksun " +
          "olduğunu savunmaktadır.",
      },
      {
        claim: "4:89'daki 'öldürün' emri dini değiştirenlere yöneliktir.",
        response:
          "4:89'u çevreleyen pasaj (4:88-91) münafıklardan söz eder, mürtetlerden değil. " +
          "4:90, hemen ardından, eman dileyen veya her iki tarafla barışık olan " +
          "kişilerle savaşmayı yasaklar. Konusu dini değişiklik değil, " +
          "savaş zamanı aktif düşmanlık ve ihanettir.",
      },
    ],
    relatedVerses: [
      { verseKey: "2:256", surahName: "Bakara", ayahNumber: 256, note: "Dinde zorlama yoktur; din özgürlüğünün temel ayeti." },
      { verseKey: "10:99", surahName: "Yunus", ayahNumber: 99, note: "Allah dileseydi herkes iman ederdi; zorlama yok." },
      { verseKey: "18:29", surahName: "Kehf", ayahNumber: 29, note: "Dileyen inansın, dileyen inkâr etsin." },
      { verseKey: "4:90", surahName: "Nisa", ayahNumber: 90, note: "Eman dileyen veya barışık olanla savaşma; hemen ardından gelen ayet." },
    ],
    sources: [
      "İbn Kesir, Nisa 4:89",
      "Maududi, Tefhimu'l-Kur'an",
      "Abdullahi Ahmed en-Naim, Toward an Islamic Reformation (Syracuse UP, 1990)",
    ],
  },

  // ── KÖLELİK VE ÖZGÜRLÜK ───────────────────────────────────────────────────

  {
    verseKey: "24:33",
    surahName: "Nur",
    category: "kolelik",
    topic: "Mükâtebe, İffet ve Kölelik Kurumunun Dönüşümü",
    revelationContext:
      "Sahih Muslim'de (3029b) Câbir ibn Abdillah'tan nakledilen rivayete göre " +
      "Medine münafıklarının reisi Abdullah ibn Übeyy ibn Selûl'ün, aralarında " +
      "Müseyka ve Mu'adha'nın da bulunduğu cariyelerini zorla fuhşa çalıştırdığı " +
      "aktarılmaktadır. Mu'adha İslam'ı kabul edince özgürlük istedi; İbn Übeyy " +
      "reddedip ona işkence etti. Kadın Hz. Ebubekir aracılığıyla Peygamber'e " +
      "şikâyette bulundu ve bu olayın ardından ayet indi.",
    historicalNote:
      "7. yüzyıl Arabistan'ında cariyenin fuhşa çalıştırılması kurumsallaşmış " +
      "bir uygulamaydı. Roma, Bizans ve cahiliye hukukunun tamamı buna izin " +
      "veriyordu. Bu ayet sistemi onaylamaz; dönemin en yaygın sömürü biçimine " +
      "kesin bir yasak getirerek eşi görülmemiş bir koruma normu oluşturur.",
    misconceptions: [
      {
        claim: "Bu ayet köleliği ve cariye sömürüsünü İslam adına meşrulaştırıyor.",
        response:
          "Ayet, efendilere yeni bir hak vermez; var olan ve kurumsallaşmış bir " +
          "pratiği kesin olarak yasaklar. Roma, Bizans ve cahiliye hukukunun " +
          "tamamı buna izin verirken Kur'an bunu mutlak biçimde haram kıldı. " +
          "Murray Gordon: 'Bu yasağın önemi küçümsenemez.'",
      },
      {
        claim: "'Namuslu kalmak istedikleri hâlde' ifadesi, isteksiz olmayan cariyenin sömürülmesine izin verir.",
        response:
          "Maududi bu noktayı açıkça ele alır: 'Zorlamak' kelimesi tanım gereği " +
          "karşı tarafın istemedigi bir şeyi yapmasını ifade eder. Dolayısıyla " +
          "bu kayıt bir istisna değil, yasağın ne kadar ağır bir suçu kapsadığını " +
          "vurgulayan retorik bir pekiştirmedir. Yasak mutlak ve koşulsuzdur.",
      },
      {
        claim: "Mükâtebe tavsiye düzeyindedir; köleyi gerçekten özgürleştirmez.",
        response:
          "Erken dönem Medine geleneğinde mükâtebenin vacip olduğu görüşü hâkimdi. " +
          "Hz. Ömer, mükâtebe talebini reddeden Enes ibn Mâlik'i kırbaçlayıp " +
          "'Allah'ın emrini uygula' dediğine dair rivayet bu anlayışı yansıtır. " +
          "Üstelik ayet efendiye kendi malından köleye destek vermesini de emreder.",
      },
    ],
    legalNote:
      "Mükâtebenin hükmü fakihler arasında tartışmalıdır. Zahirîler ve " +
      "Şafiî'nin eski görüşü (kavl-i kadim) vacip, Hanefî, Mâlikî ve " +
      "Hanbelî mezhepleri mendub der. Taberi, erken Medine geleneğinde " +
      "vacip görüşünün hâkim olduğunu aktarır.",
    comparativeLaw: [
      { system: "Roma Hukuku (klasik)", ruling: "Cariyeyi fuhşa vermek tamamen serbest", protection: "Yok" },
      { system: "Roma Hukuku (Hadrian sonrası)", ruling: "'Makul neden olmadan' kısıtlama", protection: "Minimal" },
      { system: "Bizans Hukuku (7.-8. yy.)", ruling: "Yasal, geniş ölçüde serbest", protection: "Yok" },
      { system: "Cahiliye Arabistan", ruling: "Yaygın ve kurumsallaşmış ('bayraklı fuhuş')", protection: "Yok" },
      { system: "İslam (24:33 sonrası)", ruling: "Kesin yasak, şartsız", protection: "Açık Kur'an hükmü" },
    ],
    relatedVerses: [
      { verseKey: "90:13", surahName: "Beled", ayahNumber: 13, note: "Köle azat etmek en büyük iyilik (akabe) olarak tanımlanır." },
      { verseKey: "58:3", surahName: "Mücadele", ayahNumber: 3, note: "Zıhar yemininin kefareti olarak köle azatlamak zorunlu kılınır." },
      { verseKey: "4:92", surahName: "Nisa", ayahNumber: 92, note: "Yanlışlıkla öldürmede kefaret olarak köle azatlamak." },
      { verseKey: "9:60", surahName: "Tevbe", ayahNumber: 60, note: "Zekatın sekiz sarf yerinden biri 'rikab': köle azatlamak için devlet fonu." },
      { verseKey: "24:32", surahName: "Nur", ayahNumber: 32, note: "Hemen önceki ayet: köle ve cariyeler de evlendirilmelidir." },
    ],
    sources: [
      "Sahih Muslim 3029b (Câbir ibn Abdillah rivayeti)",
      "Taberi, Câmiu'l-Beyan",
      "İbn Kesir, Tefsiru'l-Kur'ani'l-Azim, Nur 33",
      "Kecia Ali, Marriage and Slavery in Early Islam (Harvard UP, 2010)",
      "Jonathan Brown, Slavery and Islam (Oneworld, 2019)",
      "Murray Gordon, Slavery in the Arab World (1989)",
    ],
  },

  // ── CENNET TASVİRLERİ ─────────────────────────────────────────────────────

  {
    verseKey: "78:33",
    surahName: "Nebe",
    category: "cennet",
    topic: "Cennet Tasvirlerinin Dili: Huri ve Literal Okuma Sorunu",
    revelationContext:
      "Sure-i Nebe, Mekke döneminin erken aşamalarında, müşriklerin kıyameti " +
      "inkâr eden itirazlarına karşı, kıyamet ve ahiretin gerçekliğini tasvir " +
      "eden kapsamlı bir anlatı olarak nazil olmuştur. Ayet, 78:31-36 arasındaki " +
      "cennet tasvirlerinin bir parçasıdır; özgün bir nüzul sebebi aktarılmamıştır.",
    historicalNote:
      "İbn Abbas ve İbn Kesir, kavaaib kelimesini 'yuvarlak, genç göğüsler' " +
      "olarak çevirirken Taberi görece daha mecazi bir dil kullanır. " +
      "Gazzali ve Rumi başta olmak üzere İslam mistik geleneği, cennet " +
      "tasvirlerini ruhani mükemmeliyetin mecazları olarak yorumlamıştır. " +
      "'72 huri' ifadesi Kur'an'da değil, sıhhati tartışmalı hadis " +
      "rivayetlerinde geçmektedir.",
    misconceptions: [
      {
        claim: "Bu ayet cinsel cennet anlayışını ortaya koyar ve İslam'ın materyalist dünya görüşünü yansıtır.",
        response:
          "Cennet tasvirlerini literal okumak, Kur'an'ın üslup özelliklerine aykırıdır. " +
          "Gazzali ve Rumi, bu tasvirleri ruhani mükemmeliyetin mecazları olarak " +
          "yorumlar. Kur'an'ın pek çok ayetinde cennet vaadi cinsiyetten bağımsız " +
          "biçimde tüm inananları kapsar (3:195, 4:124, 40:40).",
      },
      {
        claim: "Bu erkek merkezli bir cennet anlayışıdır; kadınlara hitap etmez.",
        response:
          "Amina Wadud ve modern İslam ilahiyatçılarının yorumuna göre cennet " +
          "ödülleri hem erkeklere hem de kadınlara eşit biçimde vaad edilmiştir. " +
          "3:195: 'Erkek olsun kadın olsun, hiçbir çalışanın emeğini zayi etmeyeceğim.' " +
          "Kadınlara özgü cennet tasvirleri de Kur'an'da mevcuttur (55:70-72).",
      },
      {
        claim: "Christoph Luxenberg'e göre 'huri' aslında üzüm anlamına gelir.",
        response:
          "Luxenberg'in Süryanice tezi (2000) dilbilimciler arasında tartışmalıdır " +
          "ve ana akım İslam akademisi tarafından kabul görmemektedir. Kur'an'ın " +
          "Arapça yapısı ve bağlamsal kullanım bu okumayı desteklememektedir.",
      },
    ],
    relatedVerses: [
      { verseKey: "3:195", surahName: "Al-i İmran", ayahNumber: 195, note: "Cennet vaadi erkek ve kadın için eşittir." },
      { verseKey: "4:124", surahName: "Nisa", ayahNumber: 124, note: "İman eden ve amel işleyen kadın da cennete girer." },
      { verseKey: "55:70", surahName: "Rahman", ayahNumber: 70, note: "Cennetteki güzel eşler; bağlamsal cennet tasviri." },
    ],
    sources: [
      "İbn Kesir, Nebe 78:33",
      "Taberi, Câmiu'l-Beyan",
      "Gazzali, İhyau Ulumu'd-Din, Ahiret Kitabı",
      "Christoph Luxenberg, The Syro-Aramaic Reading of the Koran (2000, tartışmalı)",
    ],
  },
];

// ── Export fonksiyonları ───────────────────────────────────────────────────

export function getVerseContext(verseKey: string): VerseContext | null {
  return VERSE_CONTEXTS.find((v) => v.verseKey === verseKey) ?? null;
}

export function getAllVerseContexts(): VerseContext[] {
  return VERSE_CONTEXTS;
}

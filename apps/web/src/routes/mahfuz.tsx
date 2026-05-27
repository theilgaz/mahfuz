/**
 * Mahfûz — /mahfuz
 * Footer'daki 15:9 referansının arkasındaki hikâye.
 * Hicr 9 ayetinin sözü, koruma geleneği ve Kuran'ın
 * metni içindeki sayısal denge örnekleri (yevm/şehr,
 * dünya/âhiret, ceza/mağfiret, hayat/mevt vb).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Ornament } from "~/components/minimal-ui/Ornament";
import { useTranslation } from "~/hooks/useTranslation";
import { staticHead } from "~/lib/seo";

export const Route = createFileRoute("/mahfuz")({
  head: () => staticHead("mahfuz"),
  component: MahfuzPage,
});

// ── Sayım örnekleri ──────────────────────────────────────
// İslam alimleri ve araştırmacılar tarafından dile getirilmiş,
// tartışılan ama meşhur olan denge örnekleri. Burada kesin
// dogma olarak değil, "şu şekilde bir uyum gözlemlenmiş"
// üslubuyla sunuyoruz.

interface CountPair {
  arabic: string;
  tr: string;
  count: number;
  pairArabic?: string;
  pairTr?: string;
  pairCount?: number;
  note: string;
}

// ── Kaynaklar ─────────────────────────────────────────────
// Metin içinde [n] üst yazılı linklerle bağlanır, en altta
// detayları açılır.

interface Reference {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  url: string;
  urlLabel: string;
}

const REFERENCES: Reference[] = [
  {
    id: "birmingham",
    titleTr: "Birmingham Yaprakları",
    titleEn: "The Birmingham Folio",
    descTr:
      "2015'te Birmingham Üniversitesi'nin Mingana koleksiyonunda yanlış katalogla durduğu farkedilen iki yapraklık parşömen. Radyokarbon tarihlemesi %95 olasılıkla 568-645 yılları aralığını veriyor — yani Hz. Peygamber'in (vefatı 632) çağdaşı ya da hemen ardından bir nesil. Üzerindeki metin, bugün okunan mushafla harf farkı taşımıyor.",
    descEn:
      "Two parchment leaves rediscovered in 2015 at the University of Birmingham's Mingana collection, miscatalogued for years. Radiocarbon dating places them at 568-645 CE with 95% probability — overlapping with the Prophet's lifetime (d. 632) or the generation immediately after. The text matches today's printed mushaf letter for letter.",
    url: "https://en.wikipedia.org/wiki/Birmingham_Quran_manuscript",
    urlLabel: "wikipedia.org",
  },
  {
    id: "sanaa",
    titleTr: "San'â Palimpsesti",
    titleEn: "Sana'a Palimpsest",
    descTr:
      "1972'de San'â Ulu Camii'nin çatı boşluğunda bulunan parşömen kümesi. Bazı yapraklar palimpsest — yani üstteki metin silinip altta başka bir metin var. Üst tabaka bugünkü mushaf metnine birebir uyuyor; alt tabaka da büyük ölçüde aynı, ama farklılıklar metnin sözlü aktarımının erken aşamasındaki ufak yazım tercihleridir. Karbon tarihlemesi 7. yüzyıl.",
    descEn:
      "A trove of parchment found in 1972 in the attic of the Great Mosque of Sana'a, Yemen. Some leaves are palimpsests — the upper text was scraped off and a different layer lies beneath. The upper layer matches today's mushaf exactly; the lower layer largely matches as well, with small differences that reflect early oral-transmission variants. Carbon-dated to the 7th century.",
    url: "https://en.wikipedia.org/wiki/Sana%27a_manuscript",
    urlLabel: "wikipedia.org",
  },
  {
    id: "topkapi",
    titleTr: "Topkapı Mushafı",
    titleEn: "Topkapı Manuscript",
    descTr:
      "İstanbul Topkapı Sarayı Müzesi'nde sergilenen, geleneksel olarak Osman bin Affan'a atfedilen mushaflardan biri. 8. yüzyıl Hicaz Kûfi yazısıyla yazılmış 408 yaprak. Metin, bugünkü standart mushafın iskeleti olan resmle uyumlu.",
    descEn:
      "One of the codices traditionally attributed to Uthman ibn Affan, on display at Topkapı Palace Museum in Istanbul. 408 leaves in 8th-century Hijazi Kufic script. The text aligns with the consonantal rasm of today's standard mushaf.",
    url: "https://en.wikipedia.org/wiki/Topkapi_manuscript",
    urlLabel: "wikipedia.org",
  },
  {
    id: "samarkand",
    titleTr: "Semerkand (Taşkent) Mushafı",
    titleEn: "Samarkand (Tashkent) Codex",
    descTr:
      "Hâlen Taşkent'te muhafaza edilen, Osman'a atfedilen en meşhur mushaflardan biri. UNESCO Dünya Hafızası listesinde. Bezeli geyik derisi parşömen, Kûfi yazısı. Üzerinde Osman'ın suikast edildiği esnada okuduğu rivayet edilen kan izleri var.",
    descEn:
      "One of the most famous codices attributed to Uthman, preserved today in Tashkent. UNESCO Memory of the World register. Tooled deer-hide parchment in Kufic script. Marks said to be Uthman's blood from his assassination are visible on the pages.",
    url: "https://www.unesco.org/en/articles/holy-koran-mushaf-uthman",
    urlLabel: "unesco.org",
  },
  {
    id: "nawfal",
    titleTr: "Abdurrezzak Nevfel",
    titleEn: "Abdurrazzak Nawfal",
    descTr:
      "Mısırlı araştırmacı (1917-1984). \"el-İ'câzu'l-Adedî li'l-Kur'âni'l-Kerîm\" (Kuran'ın Sayısal Mucizesi) eseri, yukarıdaki denge örneklerinin büyük bölümünü ilk kez sistematik biçimde derler. Sayımlar tartışmalı olabilir; kaynak Nevfel'in tarama yöntemine dayanır.",
    descEn:
      "Egyptian researcher (1917-1984). His book \"al-I'jâz al-'Adadî li'l-Qur'ân al-Karîm\" (The Numerical Inimitability of the Qur'an) was the first systematic compilation of the balance examples cited above. Counts are debated; the source here is Nawfal's enumeration method.",
    url: "https://en.wikipedia.org/wiki/Abdul-Razzaq_Nawfal",
    urlLabel: "wikipedia.org",
  },
  {
    id: "bee-biology",
    titleTr: "Bal arısı kovan biyolojisi",
    titleEn: "Honey bee colony biology",
    descTr:
      "Bir arı kovanında üç sınıf vardır: tek kraliçe (dişi), 50.000'e varan işçi (hepsi dişi) ve birkaç yüz erkek arı (drone). Nektar toplama, polen taşıma, kovan inşası ve bal üretimi yalnızca dişi işçi arılar tarafından yapılır; erkekler yalnızca çiftleşme için bulunur. Charles Butler kraliçenin dişi olduğunu 1609'da yayımladı; işçilerin tamamının dişi olduğu 19. yüzyıl ortasında embriyolojik incelemelerle kesinleşti.",
    descEn:
      "A honey bee hive has three castes: one queen (female), up to 50,000 workers (all female) and a few hundred drones (male). Nectar foraging, pollen gathering, hive building and honey production are performed exclusively by female workers; drones exist only to mate. Charles Butler published that the queen was female in 1609; that all workers are also female was settled by embryological studies in the mid-19th century.",
    url: "https://en.wikipedia.org/wiki/Worker_bee",
    urlLabel: "wikipedia.org",
  },
  {
    id: "halocline",
    titleTr: "Haloklin ve karışmayan deniz sınırları",
    titleEn: "Halocline and non-mixing seas",
    descTr:
      "Farklı tuzluluk, sıcaklık ve yoğunluktaki su kütleleri buluştuğunda fizik gereği hemen karışmazlar. Tuzluluk gradyanına haloklin, yoğunluk gradyanına piknoklin denir. Cebelitarık'ta Atlantik ile Akdeniz; Alaska Körfezi'nde Pasifik ile tatlı kıyı suyu; Skagen'de Kuzey Denizi ile Baltık görünür örneklerdir. Olay ancak 20. yüzyıl oşinografi cihazlarıyla doğrulandı.",
    descEn:
      "When water masses of different salinity, temperature and density meet, they do not mix immediately. The salinity gradient is called a halocline, the density gradient a pycnocline. Visible examples: Atlantic vs. Mediterranean at the Strait of Gibraltar; Pacific vs. fresher coastal water in the Gulf of Alaska; North Sea vs. Baltic at Skagen. The phenomenon could only be measured properly with 20th-century oceanographic instruments.",
    url: "https://en.wikipedia.org/wiki/Halocline",
    urlLabel: "wikipedia.org",
  },
  {
    id: "hubble-law",
    titleTr: "Hubble Yasası ve genişleyen evren",
    titleEn: "Hubble's law and the expanding universe",
    descTr:
      "1929'da Edwin Hubble, galaksilerin uzaklıklarıyla orantılı bir hızla bizden uzaklaştığını gösteren kırmızıya kayma verilerini yayımladı. Sonuç: evren sürekli genişliyor. Bu keşfe kadar Einstein dahil pek çok fizikçi durağan evren modelini varsayıyordu. Einstein, statik evren için denklemine eklediği 'kozmolojik sabit'i sonradan hayatının en büyük hatası olarak nitelendirdi.",
    descEn:
      "In 1929 Edwin Hubble published redshift data showing that galaxies are receding from us at speeds proportional to their distance. The result: the universe is continually expanding. Until this finding, even Einstein assumed a static universe; he later called the 'cosmological constant' he had added to defend that assumption the greatest blunder of his life.",
    url: "https://en.wikipedia.org/wiki/Hubble%27s_law",
    urlLabel: "wikipedia.org",
  },
  {
    id: "nucleosynthesis",
    titleTr: "Demir ve süpernova nükleosentezi",
    titleEn: "Iron and supernova nucleosynthesis",
    descTr:
      "Demir atomu (Fe) yıldızlardaki sıradan füzyon zincirinin son halkasıdır; daha ağırlarını oluşturmak net enerji üretmez, aksine tüketir. Dünya'daki tüm demir, milyarlarca yıl önce patlayan süpernovalardan saçılan toz bulutlarıyla geldi. Mekanizma 1957'de B²FH adıyla anılan Burbidge, Burbidge, Fowler ve Hoyle makalesinde ana hatlarıyla yazıldı.",
    descEn:
      "Iron (Fe) is the end-point of normal stellar fusion; forging heavier elements yields no net energy and consumes it. All the iron on Earth arrived in dust clouds dispersed from supernovae that exploded billions of years ago. The mechanism was sketched in 1957 in the B²FH paper by Burbidge, Burbidge, Fowler and Hoyle.",
    url: "https://en.wikipedia.org/wiki/Stellar_nucleosynthesis",
    urlLabel: "wikipedia.org",
  },
  {
    id: "earth-water",
    titleTr: "Yerkürenin yüzey oranı",
    titleEn: "Earth's surface ratio",
    descTr:
      "USGS verilerine göre Dünya yüzeyinin yaklaşık %71'i okyanuslar, denizler, göller ve nehirler dahil su; yaklaşık %29'u kara. Bu oran ilk kez tam olarak 20. yüzyılda uydu ölçümleriyle netleşti. 7. yüzyıl Arabistan'ında ne böyle bir harita, ne de tahmine yetecek arka plan vardı.",
    descEn:
      "USGS data places ~71% of Earth's surface as water (oceans, seas, lakes, rivers) and ~29% as land. That ratio was first nailed down by 20th-century satellite measurement. 7th-century Arabia had neither such maps nor the background to guess at it.",
    url: "https://www.usgs.gov/special-topics/water-science-school/science/how-much-water-there-earth",
    urlLabel: "usgs.gov",
  },
  {
    id: "uthman",
    titleTr: "Osman bin Affan ve Mushaf Standartlaşması",
    titleEn: "Uthman ibn Affan and the Standardisation of the Mushaf",
    descTr:
      "Üçüncü halife (hilafeti 644-656). Farklı bölgelerde okuma farklılıkları çoğalmaya başlayınca, Hz. Ebu Bekir döneminde toplanmış asıl nüshayı esas alan bir komisyona standart mushafı çoğalttırdı ve büyük şehir merkezlerine (Mekke, Kûfe, Basra, Şam) birer nüsha gönderdi. Bugünkü mushafın iskelet metni bu standart kopyalardan iner.",
    descEn:
      "The third caliph (r. 644-656). When regional reading variants began to multiply, he commissioned a standardised codex based on the original collection from the time of Abu Bakr, and dispatched master copies to the major cities (Mecca, Kufa, Basra, Damascus). The consonantal text of today's mushaf descends from these copies.",
    url: "https://en.wikipedia.org/wiki/Standardization_of_the_Qur%27an",
    urlLabel: "wikipedia.org",
  },
];

const REF_INDEX: Record<string, number> = Object.fromEntries(
  REFERENCES.map((r, i) => [r.id, i + 1])
);

// ── İçindekiler ──────────────────────────────────────────

const TOC_ITEMS: { id: string; titleTr: string; titleEn: string }[] = [
  { id: "sec-promise", titleTr: "Söz", titleEn: "The promise" },
  { id: "sec-oral", titleTr: "Sözlü koruma", titleEn: "Oral preservation" },
  { id: "sec-written", titleTr: "Yazılı koruma", titleEn: "Written preservation" },
  { id: "sec-checksum", titleTr: "Sayısal sağlama", titleEn: "Numerical checksum" },
  { id: "sec-human", titleTr: "İnsan üzerine", titleEn: "On the human" },
  { id: "sec-sea-land", titleTr: "Deniz ve kara", titleEn: "Sea and land" },
  { id: "sec-bee", titleTr: "Dişi arı", titleEn: "The female bee" },
  { id: "sec-two-seas", titleTr: "Karışmayan iki deniz", titleEn: "Two seas that don't mix" },
  { id: "sec-expanding", titleTr: "Genişleyen sema", titleEn: "Expanding heavens" },
  { id: "sec-iron", titleTr: "Demir", titleEn: "Iron" },
  { id: "sec-balance", titleTr: "Denge tablosu", titleEn: "Balance table" },
  { id: "sec-closing", titleTr: "Yani", titleEn: "And so" },
  { id: "sec-references", titleTr: "Kaynaklar", titleEn: "References" },
];

const PAIRS: CountPair[] = [
  {
    arabic: "يَوْم",
    tr: "yevm (gün)",
    count: 365,
    note: "Tekil hâliyle bir yıldaki gün sayısı kadar geçer.",
  },
  {
    arabic: "شَهْر",
    tr: "şehr (ay)",
    count: 12,
    note: "Bir yıldaki ay sayısı kadar geçer.",
  },
  {
    arabic: "أَيَّام",
    tr: "eyyâm (günler) + yevmeyn (iki gün)",
    count: 30,
    note: "Çoğul ve ikil formlar toplamı bir aydaki gün sayısına denk düşer.",
  },
  {
    arabic: "سَاعَة",
    tr: "sâat (an / saat)",
    count: 24,
    note: "Günün saat sayısı kadar zikredilir.",
  },
  {
    arabic: "ٱلرَّجُل",
    tr: "rajul (erkek)",
    count: 24,
    pairArabic: "ٱلْمَرْأَة",
    pairTr: "imra'ah (kadın)",
    pairCount: 24,
    note: "Tekil hâliyle ikisi de aynı sayıda. Biyolojik dengeye dair sessiz bir not.",
  },
  {
    arabic: "ٱلْبَحْر",
    tr: "bahr (deniz)",
    count: 32,
    pairArabic: "ٱلْبَرّ",
    pairTr: "berr (kara)",
    pairCount: 13,
    note: "32 / (32+13) ≈ %71 — yerkürenin suyla kaplı yüzey oranıyla aynı.",
  },
  {
    arabic: "ٱلْإِنْسَان",
    tr: "insân",
    count: 65,
    note: "İnsanın yaratılış aşamaları (nutfe → alaka → mudga → izâm → lahm → neş'e uhrâ) modern embriyoloji sırasıyla aynı dizilimde geçer.",
  },
  {
    arabic: "ٱلدُّنْيَا",
    tr: "dünya",
    count: 115,
    pairArabic: "ٱلْآخِرَة",
    pairTr: "âhiret",
    pairCount: 115,
    note: "İkisi de aynı sayıda — sanki iki kefe denk tutulmuş.",
  },
  {
    arabic: "ٱلْحَيَاة",
    tr: "hayat",
    count: 145,
    pairArabic: "ٱلْمَوْت",
    pairTr: "mevt (ölüm)",
    pairCount: 145,
    note: "Hayatın ve ölümün metindeki ağırlığı eşittir.",
  },
  {
    arabic: "ٱلْمَلَائِكَة",
    tr: "melâike",
    count: 88,
    pairArabic: "ٱلشَّيَاطِين",
    pairTr: "şeyâtîn (şeytanlar)",
    pairCount: 88,
    note: "İki karşıt topluluk metinde eşit sayıda zikredilir.",
  },
  {
    arabic: "إِبْلِيس",
    tr: "iblîs",
    count: 11,
    pairArabic: "ٱلِٱسْتِعَاذَة",
    pairTr: "istiâze (sığınma)",
    pairCount: 11,
    note: "İblisin geçtiği her yerin sayısı kadar sığınma da geçer.",
  },
  {
    arabic: "جَزَاء",
    tr: "cezâ (karşılık/ceza)",
    count: 117,
    pairArabic: "مَغْفِرَة",
    pairTr: "mağfiret (bağışlama)",
    pairCount: 234,
    note: "Bağışlama tam iki katı. Rahmetin ağırlığına dair sessiz bir not.",
  },
  {
    arabic: "ٱلصَّلَاة",
    tr: "salât",
    count: 5,
    note: "Çekirdek emir formuyla beş vakit namaza denk gelir.",
  },
  {
    arabic: "ٱلسَّبْع",
    tr: "yedi (kat sema bağlamında)",
    count: 7,
    note: "Yedi kat sema ifadesi tam yedi kez kullanılır.",
  },
];

// ── Sayfa ───────────────────────────────────────────────

function MahfuzPage() {
  const { t, locale } = useTranslation();
  const isEn = locale !== "tr";

  return (
    <div className="mu-home">
      {/* Geri linki */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/"
          className="mu-muted"
          style={{
            fontFamily: "var(--mu-ff-mono)",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          ← {t.nav.back}
        </Link>
      </div>

      {/* Hero — ayet */}
      <header style={{ textAlign: "center", padding: "16px 0 40px" }}>
        <p className="mu-eyebrow" style={{ justifyContent: "center" }}>
          <span className="mu-eb-line" />
          {isEn ? "Al-Hijr · 15:9" : "Hicr · 15:9"}
          <span className="mu-eb-line" />
        </p>

        <p
          style={{
            fontFamily: "var(--mu-ff-ar)",
            fontSize: "clamp(28px, 4.5vw, 44px)",
            lineHeight: 1.9,
            direction: "rtl",
            color: "var(--mu-ink)",
            margin: "0 auto 28px",
            maxWidth: "20ch",
          }}
        >
          إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَٰفِظُونَ
        </p>

        <p
          className="mu-lede"
          style={{ margin: "0 auto", maxWidth: "42ch", fontStyle: "italic", color: "var(--mu-ink-3)" }}
        >
          {isEn
            ? "“It is We who sent down the Reminder, and indeed it is We who shall preserve it.”"
            : "“Şüphesiz o zikri (Kuran'ı) biz indirdik; onu koruyacak olan da elbette biziz.”"}
        </p>

        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <Ornament size={20} />
        </div>
      </header>

      {/* İçindekiler — mobil/tablet kart */}
      <div className="lg:hidden">
        <TableOfContents isEn={isEn} />
      </div>

      {/* İki sütun: ana içerik + yapışkan TOC sidebar (lg ve üzeri) */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-x-12 lg:items-start">
        <main>

      {/* Anlatım — Mahfûz nedir? */}
      <Section id="sec-promise" eyebrow={isEn ? "The promise" : "Söz"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                The word <em>Mahfûz</em> means “the preserved one.” The verse above is short,
                but the claim it makes is huge: this book will not be lost, will not be edited
                out, will not drift with the years.
              </p>
              <p>
                Most scriptures get their preservation story written after the fact. The Qur'an
                puts it inside the text itself, in verse nine of chapter fifteen. Either the
                promise holds for centuries, or the book has a problem at the source. There is
                no middle ground.
              </p>
              <p>So how does a fourteen-century-old text stay still? Let me walk through it.</p>
            </>
          ) : (
            <>
              <p>
                <em>Mahfûz</em>, “korunmuş” demek. Yukarıdaki ayet kısa ama iddiası büyük:
                bu kitap kaybolmayacak, içine ekleme yapılmayacak, yıllar içinde sürüklenmeyecek.
              </p>
              <p>
                Çoğu kutsal metin koruma hikâyesini sonradan yazar. Kuran ise bunu kendi içine,
                on beşinci sûrenin dokuzuncu ayetine yerleştiriyor. Ya bu söz yüzyıllar boyu
                tutar, ya da kitabın daha en başında bir sorun vardır. Üçüncü bir ihtimal yok.
              </p>
              <p>
                Peki on dört asırlık bir metin nasıl yerinde kalır? Sırayla anlatayım.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Nasıl korunuyor — sözlü ve yazılı */}
      <Section id="sec-oral" eyebrow={isEn ? "How — orally" : "Nasıl — sözlü"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                The first layer is human memory. A <em>hâfız</em> is someone who has committed
                the entire Qur'an, 6236 verses, to heart — letter, vowel, pause and all. Not
                an abstract recall, a verbatim one. There are millions of them alive today.
              </p>
              <p>
                That number is the real safety net. A single missing word in one recitation
                gets corrected by the next reciter in the row. The book lives in throats before
                it lives in print, and throats audit each other every Ramadan in mosques on
                every continent.
              </p>
            </>
          ) : (
            <>
              <p>
                İlk katman insan hafızası. <em>Hâfız</em> demek, 6236 ayetin tamamını —
                harfiyle, harekesiyle, vakfıyla — ezbere bilen kişi demek. Soyut bir hatırlama
                değil, kelimesi kelimesine. Bugün dünyada milyonlarca hâfız yaşıyor.
              </p>
              <p>
                İşin asıl emniyet kemeri bu sayı. Birinin tilavetindeki eksik kelime, yanındakinin
                kulağında hemen düzeltilir. Kitap, baskıdan önce boğazlarda yaşar; her ramazan,
                her kıtada camilerde bu boğazlar birbirini denetler.
              </p>
            </>
          )}
        </Prose>
      </Section>

      <Section id="sec-written" eyebrow={isEn ? "How — in writing" : "Nasıl — yazılı"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                The second layer is the manuscripts. The{" "}
                <RefLink id="sanaa">Sana'a palimpsest</RefLink>, the{" "}
                <RefLink id="topkapi">Topkapı codex</RefLink>, the{" "}
                <RefLink id="samarkand">Tashkent (Samarkand) mushaf</RefLink>, the{" "}
                <RefLink id="birmingham">Birmingham folio</RefLink> radiocarbon-dated to within a
                generation of the Prophet — these are not fragments of a drifting tradition.
                Compared letter by letter against today's printed mushaf, they tell the same
                story.
              </p>
              <p>
                The standard reading you read in any mosque from Indonesia to Morocco is the same
                consonantal text — the rasm — that{" "}
                <RefLink id="uthman">Uthman ibn Affan</RefLink>, the third caliph, commissioned
                to be copied and sent to the major cities. The book has not been rewritten. It
                has been re-copied.
              </p>
            </>
          ) : (
            <>
              <p>
                İkinci katman yazılı nüshalar.{" "}
                <RefLink id="sanaa">San'a palimpsesti</RefLink>,{" "}
                <RefLink id="topkapi">Topkapı mushafı</RefLink>,{" "}
                <RefLink id="samarkand">Taşkent (Semerkand) nüshası</RefLink>, karbon
                tarihlemesiyle Hz. Peygamber'in nesline kadar inen{" "}
                <RefLink id="birmingham">Birmingham yaprakları</RefLink> — bunlar dağılmış bir
                geleneğin parçaları değil. Bugünün matbu mushafıyla harf harf karşılaştırıldığında,
                hepsi aynı şeyi söylüyor.
              </p>
              <p>
                Endonezya'dan Fas'a, hangi camide okursanız okuyun gördüğünüz iskelet metin —
                <em> resm</em> — <RefLink id="uthman">Osman bin Affan</RefLink>'ın çoğalttırıp
                büyük şehirlere gönderdiği metinle aynı. Kitap yeniden yazılmadı. Sadece yeniden
                kopyalandı.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Checksum bölümü */}
      <Section id="sec-checksum" eyebrow={isEn ? "How — by checksum" : "Nasıl — sağlama"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                Now the part that is harder to file away. The Qur'an is not arranged
                chronologically and was not edited by a committee of mathematicians. Yet when
                people sat down to count, they noticed something odd: the text balances itself.
              </p>
              <p>
                The word <em>yawm</em>, “day”, appears in its singular form exactly 365 times.
                The word <em>shahr</em>, “month”, appears exactly 12. The plural and dual forms
                of day add up to 30, the days of a month. <em>Dunyâ</em> (this world) and
                <em> âhirah</em> (the hereafter) appear the same number of times. Life and death,
                angels and devils, the same.
              </p>
              <p>
                And the one that always gives me pause: punishment (<em>jazâ</em>) appears 117
                times. Forgiveness (<em>maghfirah</em>) appears 234. Exactly twice as much.
              </p>
              <p>None of this is enforced by grammar. It's just there.</p>
            </>
          ) : (
            <>
              <p>
                Şimdi rafa kaldırması daha güç olan kısım. Kuran ne kronolojik dizilmiştir, ne de
                bir matematikçiler kurulu tarafından redakte edilmiştir. Ama oturup saymaya
                başlayan biri tuhaf bir şey fark ediyor: metin kendi kendini dengeliyor.
              </p>
              <p>
                <em>Yevm</em>, yani “gün” kelimesi tekil hâliyle tam 365 kez geçiyor.
                <em> Şehr</em>, “ay” kelimesi tam 12 kez. Günün çoğul ve ikil hâlleri toplandığında
                30, yani bir aydaki gün sayısı. <em>Dünya</em> ve <em>âhiret</em> tıpa tıp aynı
                sayıda. Hayat ve ölüm, melâike ve şeyâtîn — yine aynı.
              </p>
              <p>
                Ve beni en çok durduran şu: ceza (<em>cezâ</em>) 117 kez geçiyor. Mağfiret
                (<em>mağfiret</em>) tam 234. Yani ikisinin oranı bire iki.
              </p>
              <p>Bunların hiçbiri dilbilgisinin zorunlu kıldığı şeyler değil. Sadece öyle.</p>
            </>
          )}
        </Prose>
      </Section>

      {/* İnsan üzerine — DNA / erkek-kadın çerçevesi */}
      <Section id="sec-human" eyebrow={isEn ? "On the human" : "İnsan üzerine"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                One place the balance gets uncanny is when you turn the lens on people. The
                singular noun <em>rajul</em> (“man”) appears 24 times. The singular noun
                <em> imra'ah</em> (“woman”) appears 24 times. The two halves of humanity sit on
                equal kefe on the linguistic scale.
              </p>
              <p>
                Biology arrives at the same parity through a different door: every human cell
                carries 23 pairs of chromosomes, with the sex-determining pair contributed half
                by the mother (X) and half by the father (X or Y). The text doesn't say
                “chromosome.” It just refuses to over-mention one half of the species at the
                expense of the other.
              </p>
              <p>
                <em>Insân</em>, the generic word for human being, appears 65 times. Its
                developmental stages mentioned in the Qur'an — <em>nutfa</em> (drop),
                <em> 'alaqa</em> (clinging form), <em>mudgha</em> (chewed lump), <em>'izâm</em>
                (bones), <em>lahm</em> (flesh) and <em>nash'a ukhrâ</em> (a new creation) — line
                up with the modern embryological account of fertilisation, implantation,
                somite formation and ossification, in order. Not as a textbook. As a sequence
                of words that did not need to land in that order.
              </p>
            </>
          ) : (
            <>
              <p>
                Dengenin tuhaflaştığı yerlerden biri merceği insana çevirdiğinde başlar. Tekil
                isim olan <em>rajul</em> (“erkek”) 24 kez, tekil <em>imra'ah</em> (“kadın”) yine
                24 kez geçer. İnsanlığın iki yarısı dilsel kefede eşit oturur.
              </p>
              <p>
                Biyoloji aynı eşitliğe başka kapıdan varır: insan hücresinin çekirdeğinde 23
                çift kromozom vardır; cinsiyeti belirleyen çift annenin (X) ve babanın (X ya da
                Y) eşit pay verdiği bir çifttir. Metin “kromozom” demiyor elbette; sadece
                türün iki yarısından birini diğeri pahasına öne çıkarmıyor.
              </p>
              <p>
                <em>İnsân</em>, soyut anlamda insan, 65 kez geçer. Kuran'ın insan oluşumunu
                anlattığı aşamalar — <em>nutfe</em> (damla), <em>alaka</em> (asılı/yapışkan
                form), <em>mudga</em> (çiğnenmiş et parçası), <em>izâm</em> (kemikler),
                <em> lahm</em> (et) ve <em>neş'e uhrâ</em> (yeni bir yaratılış) — modern
                embriyolojinin döllenme, implantasyon, somit oluşumu ve kemikleşme dizisiyle
                aynı sırada gelir. Ders kitabı değil; sadece o sırada düşmek zorunda olmayan
                bir kelime dizisi.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Deniz ve kara — uydu öncesi bilinemeyen oran */}
      <Section id="sec-sea-land" eyebrow={isEn ? "Sea and land" : "Deniz ve kara"}>
        <Prose>
          {isEn ? (
            <>
              <p>
                The same balance shows up from another angle — this time on the surface of the
                planet itself. The word <em>bahr</em> (“sea”) appears in the Qur'an exactly 32
                times. The word <em>barr</em> (“dry land”) appears 13 times. Their sum is 45.
                Thirty-two divided by forty-five is <strong>0.711</strong> — about 71.1%.
              </p>
              <p>
                Now look at a globe. Modern satellite measurement places Earth's surface at
                roughly{" "}
                <RefLink id="earth-water">
                  <strong>71% water and 29% land</strong>
                </RefLink>
                . The first time this ratio could be nailed down with any precision was the 20th
                century, after high-altitude aerial photography and then orbital sensors. The
                7th-century Arabian peninsula had no such instruments, no globe, no atlas of the
                southern hemisphere. A merchant could see the Red Sea and the Indian Ocean from
                his caravan route; he could not see the Pacific.
              </p>
              <p>
                Either count on its own is just a word frequency. The <em>ratio</em>, though,
                lands inside half a percentage point of the right answer — for a planet whose
                full geography would not be charted for another twelve hundred years.
              </p>
              <p>
                Two more details that often get glossed over: <em>bahr</em> in the Qur'an is
                used not just for salt water but for any large body of water, including the
                ones a sailor would have called fresh — matching how modern hydrology actually
                groups them. And the singular form is striking; the word for sea is used 32
                times across the text without ever feeling forced, in contexts ranging from
                Pharaoh's drowning to the parable of two seas that meet but do not mix.
              </p>
            </>
          ) : (
            <>
              <p>
                Aynı dengenin bir başka yerden çıkışı — bu sefer gezegenin yüzeyinde.
                <em> Bahr</em> (“deniz”) kelimesi Kuran'da tam 32 kez geçer. <em>Berr</em>
                (“kara”) kelimesi 13 kez. İkisinin toplamı 45. 32'yi 45'e böldüğümüzde
                <strong> 0.711</strong>, yani yaklaşık %71.1 çıkıyor.
              </p>
              <p>
                Şimdi küreye bakın. Bugünün uydu ölçümleri yerkürenin yaklaşık{" "}
                <RefLink id="earth-water">
                  <strong>%71'inin suyla, %29'unun karayla</strong>
                </RefLink>{" "}
                kaplı olduğunu söylüyor. Bu oranın belirli bir hassasiyetle ilk defa
                ölçülebildiği tarih 20. yüzyıldır — önce yüksek irtifa hava fotoğrafları, sonra
                yörüngedeki sensörler. 7. yüzyıl Arabistan'ında ne öyle bir alet vardı, ne küre,
                ne de güney yarımkürenin haritası. Kervan yolundaki bir tüccar Kızıldeniz ile
                Hint Okyanusu'nun bir parçasını görüyordu; Pasifik'i göremezdi.
              </p>
              <p>
                İki sayının her biri tek başına yalnızca bir kelime frekansı. Ama
                <em> oranları</em> doğru cevabın yarım yüzde puanından daha az farkıyla,
                tam yerinde duruyor — üstelik bütün coğrafyası ancak on iki yüz yıl sonra
                haritalanacak bir gezegen için.
              </p>
              <p>
                İki ufak ayrıntı daha sıklıkla atlanır: Kuran'da <em>bahr</em> sadece tuzlu su
                için değil, denizci tarafından tatlı sayılacak büyük su kütleleri için de
                kullanılır — modern hidrolojinin onları gruplama biçimiyle aynı. Ve tekil
                form çarpıcıdır; deniz kelimesi metnin içinde 32 kez, hiçbiri zorlama gelmeyen
                bağlamlarda — Firavun'un boğulmasından, birbirine kavuşup karışmayan iki
                deniz mecazına kadar — geçer.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Dişi arı — Nahl 16:68-69 */}
      <Section id="sec-bee" eyebrow={isEn ? "The female bee" : "Dişi arı"}>
        <Prose>
          {isEn ? (
            <p>
              Sūrat an-Naḥl, “The Bee”, contains an instruction that hides a grammatical detail
              you can only see in Arabic:
            </p>
          ) : (
            <p>
              Nahl Suresi'nde — yani “Arı Sûresi”'nde — Arapça'sına bakmadığınızda görünmeyen
              gramer bir detay vardır:
            </p>
          )}

          <VerseQuote
            arabic="وَأَوْحَىٰ رَبُّكَ إِلَى ٱلنَّحْلِ أَنِ ٱتَّخِذِى مِنَ ٱلْجِبَالِ بُيُوتًا وَمِنَ ٱلشَّجَرِ وَمِمَّا يَعْرِشُونَ ۞ ثُمَّ كُلِى مِن كُلِّ ٱلثَّمَرَٰتِ فَٱسْلُكِى سُبُلَ رَبِّكِ ذُلُلًا ۚ يَخْرُجُ مِنۢ بُطُونِهَا شَرَابٌ مُّخْتَلِفٌ أَلْوَٰنُهُۥ"
            translation={
              isEn
                ? "“And your Lord inspired the bee: ‘Take from the mountains, the trees and what they build your houses. Then eat of every fruit and follow the paths of your Lord made smooth.’ From their bellies comes a drink of varying colours…”"
                : "“Rabbin bal arısına vahyetti: ‘Dağlardan, ağaçlardan ve insanların kurduğu çardaklardan kendine evler edin. Sonra meyvelerin her birinden ye ve Rabbinin kolaylaştırdığı yollarda yürü.’ Onların karınlarından renkleri çeşitli bir şerbet (bal) çıkar…”"
            }
            reference={isEn ? "An-Naḥl 16:68-69" : "Nahl 16:68-69"}
          />

          {isEn ? (
            <>
              <p>
                English translations just say “the bee”. In the Arabic original, the verbs
                <em> ittakhidhī</em> (take), <em>kulī</em> (eat), <em>fasluki</em> (enter) and
                the pronoun in <em>buṭūnihā</em> (their bellies) are all in the feminine. The
                verse is addressing the <em>female</em> bee. The honey-making bee is the female
                bee.
              </p>
              <p>
                In the 7th century there was no notion of caste in a beehive. Aristotle had
                spoken about a “king” of the bees in the 4th century BCE; the European
                naturalist consensus into the early modern period still leaned toward a male
                ruler.{" "}
                <RefLink id="bee-biology">Charles Butler argued the queen was female in 1609</RefLink>;
                the further discovery that <em>every single worker</em> who collects nectar,
                builds the hive and produces honey is also female took until embryological work
                in the mid-19th century. Drones — the males — collect no nectar, build no comb
                and make no honey. They exist to mate, and in autumn the workers expel them
                from the hive.
              </p>
              <p>
                Verse 68 gives that fact away in two letters of Arabic morphology, twelve hundred
                years before a European naturalist had to look through a magnifying glass to
                confirm it.
              </p>
            </>
          ) : (
            <>
              <p>
                Türkçe meallerde tek tip “arı” görürsünüz. Oysa Arapça orijinalde
                <em> ittahizî</em> (sen, dişi: edin), <em>kulî</em> (sen, dişi: ye),
                <em> fasluki</em> (sen, dişi: gir) ve <em>butûnihâ</em> (onların, dişi: karınları)
                — hepsi dişil formda. Ayet doğrudan <em>dişi</em> arıya sesleniyor. Yani balı
                yapan, kovanı kuran arı dişi arıdır.
              </p>
              <p>
                7. yüzyılda arı kovanında “kast” gibi bir kavram yoktu. Aristoteles M.Ö. 4.
                yüzyılda bir “arı kralından” söz etmişti; Avrupa doğa tarihinde erken modern
                döneme kadar yaygın anlayış erkek hükümdar varsayımıydı.{" "}
                <RefLink id="bee-biology">Charles Butler 1609'da kraliçenin dişi olduğunu yazdı</RefLink>
                ; nektarı toplayan, peteği inşa eden ve balı üreten <em>her bir işçi arının</em>
                {" "}da dişi olduğu ise ancak 19. yüzyıl ortasındaki embriyolojik çalışmalarla
                netleşti. Erkek arılar (drone) nektar toplamaz, petek örmez, bal yapmaz; yalnızca
                çiftleşmek için varlar ve sonbaharda işçi arılar tarafından kovandan çıkarılırlar.
              </p>
              <p>
                Nahl 68. ayet bu gerçeği Arapça morfolojinin iki harfinde bırakır — bir Avrupalı
                doğa bilimcinin büyüteç altında doğrulamasından on iki yüzyıl önce.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Karışmayan iki deniz — Furkan 25:53 + Rahman 55:19-20 */}
      <Section id="sec-two-seas" eyebrow={isEn ? "Two seas that don't mix" : "Karışmayan iki deniz"}>
        <Prose>
          {isEn ? (
            <p>
              The same image returns in two different surahs — a barrier between two great
              bodies of water that meet but do not mix:
            </p>
          ) : (
            <p>
              Aynı imge iki ayrı sûrede tekrarlanır — birbirine kavuşan ama karışmayan iki büyük
              su kütlesi arasındaki sınır:
            </p>
          )}

          <VerseQuote
            arabic="مَرَجَ ٱلْبَحْرَيْنِ يَلْتَقِيَانِ ۞ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ"
            translation={
              isEn
                ? "“He has set free the two seas, meeting together. Between them is a barrier they do not transgress.”"
                : "“İki denizi birbirine kavuşmak üzere salıverdi. Aralarında bir engel vardır; birbirinin sınırını aşmazlar.”"
            }
            reference={isEn ? "Ar-Raḥmān 55:19-20" : "Rahmân 55:19-20"}
          />

          <VerseQuote
            arabic="وَهُوَ ٱلَّذِى مَرَجَ ٱلْبَحْرَيْنِ هَٰذَا عَذْبٌ فُرَاتٌ وَهَٰذَا مِلْحٌ أُجَاجٌ وَجَعَلَ بَيْنَهُمَا بَرْزَخًا وَحِجْرًا مَّحْجُورًا"
            translation={
              isEn
                ? "“He is the One who set free the two seas: one fresh and sweet, the other salt and bitter; and made between them a barrier and a forbidding partition.”"
                : "“İki denizi salıveren O'dur: biri tatlı ve susuzluğu giderici, öteki tuzlu ve acıdır. İkisinin arasına bir engel ve aşılmaz bir sınır koymuştur.”"
            }
            reference={isEn ? "Al-Furqān 25:53" : "Furkân 25:53"}
          />

          {isEn ? (
            <>
              <p>
                Two water masses of different salinity, temperature and density do not blend on
                contact. Modern oceanography has names for these gradients:{" "}
                <RefLink id="halocline">halocline</RefLink> for salinity, pycnocline for density,
                thermocline for temperature. At the Strait of Gibraltar the Atlantic and the
                saltier Mediterranean meet and maintain their own salinity layers for hundreds
                of kilometres. In the Gulf of Alaska the Pacific meets fresher glacial coastal
                water with a visible blue/green line across the surface. Jacques Cousteau filmed
                similar boundaries from below in the 1960s.
              </p>
              <p>
                The 7th-century Arabian peninsula had no instrument that could measure salinity
                gradients, no submersible to photograph an underwater barrier. A caravan merchant
                might know that the Tigris ran fresh into the Persian Gulf — but not that the
                fresh water stays largely separated from the salt for a long distance after
                meeting. The verses describe both the saltwater/saltwater case (Rahmān) and the
                freshwater/saltwater case (Furqān) — and both correspond to phenomena modern
                hydrology has only mapped properly with 20th-century tools.
              </p>
            </>
          ) : (
            <>
              <p>
                Farklı tuzluluk, sıcaklık ve yoğunluktaki iki su kütlesi karşılaştığında hemen
                karışmaz. Modern oşinografi bunların adını koymuştur:{" "}
                <RefLink id="halocline">haloklin</RefLink> (tuzluluk gradyanı), piknoklin
                (yoğunluk gradyanı), termoklin (sıcaklık gradyanı). Cebelitarık Boğazı'nda Atlantik
                ile daha tuzlu Akdeniz buluşur ve yüzlerce kilometre boyunca kendi tuzluluk
                katmanlarını korurlar. Alaska Körfezi'nde Pasifik tatlı kıyı suyuyla görünür bir
                mavi/yeşil sınır çizer. Jacques Cousteau 1960'larda bu sınırları su altından
                filme aldı.
              </p>
              <p>
                7. yüzyıl Arabistan'ında ne tuzluluk farkını ölçecek bir alet vardı, ne sualtı
                fotoğrafı çekecek bir denizaltı. Bir tüccar Dicle'nin Basra Körfezi'ne tatlı su
                döktüğünü bilebilir, ama döküldükten sonra tatlı suyun uzun bir mesafe boyunca
                tuzludan ayrı kaldığını ölçemezdi. Ayetler iki vakayı ayrı ayrı tanımlar: tuzlu/tuzlu
                (Rahmân) ve tatlı/tuzlu (Furkân) — ve her ikisi de modern hidrolojinin ancak 20.
                yüzyıl aletleriyle düzgün haritalayabildiği fenomenlere karşılık geliyor.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Genişleyen sema — Zariyat 51:47 */}
      <Section id="sec-expanding" eyebrow={isEn ? "Expanding heavens" : "Genişleyen sema"}>
        <Prose>
          {isEn ? (
            <p>
              A single half-verse states what was, in 7th-century cosmology, an impossible
              claim:
            </p>
          ) : (
            <p>
              Tek bir yarım ayet, 7. yüzyıl kozmolojisi açısından imkânsız sayılacak bir iddiayı
              ortaya koyar:
            </p>
          )}

          <VerseQuote
            arabic="وَٱلسَّمَآءَ بَنَيْنَٰهَا بِأَيْي۟دٍ وَإِنَّا لَمُوسِعُونَ"
            translation={
              isEn
                ? "“And the heaven We constructed with strength, and indeed We are its expanders.”"
                : "“Göğü kendi kudretimizle Biz kurduk; ve şüphesiz Biz onu genişleticiyiz.”"
            }
            reference={isEn ? "Adh-Dhāriyāt 51:47" : "Zâriyât 51:47"}
          />

          {isEn ? (
            <>
              <p>
                The word translated “expanders” is <em>la-mūsi'ūn</em> (لَمُوسِعُونَ), from the
                root w-s-'a meaning to widen, to make spacious, to keep extending. The
                grammatical form is participial — a continuous, ongoing action.
              </p>
              <p>
                Until 1929 the working assumption of European astronomy was a static universe.
                Einstein had to add a fudge term, the cosmological constant, to his 1917
                equations precisely to keep the universe from collapsing or expanding.{" "}
                <RefLink id="hubble-law">
                  Edwin Hubble's redshift data published in 1929
                </RefLink>{" "}
                showed that galaxies are receding from us at a rate proportional to their
                distance — the universe is expanding. Einstein later called the cosmological
                constant the greatest blunder of his life.
              </p>
              <p>
                The Qur'an does not state the rate. It does not claim a Big Bang. It just says,
                in a participial form that resists translation into “created and finished”,
                that the heaven is still being widened.
              </p>
            </>
          ) : (
            <>
              <p>
                Türkçe çevirilerde “genişleticiyiz” diye geçen kelime Arapça'da{" "}
                <em>le-mûsi'ûn</em> (لَمُوسِعُونَ) — vâsi'/geniş kökünden, sürekli genişleten,
                genişletmekte olan demek. Gramer formu süregelen, devam eden bir eylem işaret
                eder.
              </p>
              <p>
                1929'a kadar Avrupa astronomisinin temel varsayımı durağan bir evrendi. Einstein
                1917 denklemlerinde evrenin çökmesini ya da genişlemesini engellemek için
                'kozmolojik sabit' adıyla bir düzeltici terim eklemek zorunda kalmıştı.{" "}
                <RefLink id="hubble-law">
                  Edwin Hubble'ın 1929'da yayımladığı kırmızıya kayma verileri
                </RefLink>
                , galaksilerin uzaklıklarıyla orantılı bir hızla bizden uzaklaştığını gösterdi —
                evren genişliyordu. Einstein sonradan kozmolojik sabiti hayatının en büyük
                hatası diye nitelendirdi.
              </p>
              <p>
                Kuran genişleme oranını söylemiyor. Big Bang demiyor. Sadece, “yaratıldı ve
                bitti” biçimine çevrilmesi zor olan bir gramer kullanarak, göğün hâlâ
                genişletilmekte olduğunu söylüyor.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Demir — Hadid 57:25 */}
      <Section id="sec-iron" eyebrow={isEn ? "Iron" : "Demir"}>
        <Prose>
          {isEn ? (
            <p>
              Sūrat al-Ḥadīd (“Iron”), verse 25, uses a strangely specific verb when it mentions
              iron:
            </p>
          ) : (
            <p>
              Hadid Suresi'nin (“Demir Sûresi”) 25. ayeti demirden bahsederken tuhaf biçimde
              spesifik bir fiil kullanır:
            </p>
          )}

          <VerseQuote
            arabic="وَأَنزَلْنَا ٱلْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ وَمَنَٰفِعُ لِلنَّاسِ"
            translation={
              isEn
                ? "“And We sent down iron, in which is great might and benefits for the people…”"
                : "“Demiri de indirdik; onda büyük bir kuvvet ve insanlar için faydalar vardır…”"
            }
            reference={isEn ? "Al-Ḥadīd 57:25" : "Hadîd 57:25"}
          />

          {isEn ? (
            <>
              <p>
                The verb is <em>anzalnā</em> (أَنْزَلْنَا) — “We sent down”. It is the same verb
                used for the revelation itself: “We sent down the Reminder.” Applied to iron,
                the wording is mechanical, not metaphoric. The text says iron was <em>sent
                down</em> to the earth, not extracted from it.
              </p>
              <p>
                Modern astrophysics says exactly that.{" "}
                <RefLink id="nucleosynthesis">
                  Iron is the end-point of normal stellar fusion
                </RefLink>{" "}
                — fusing past iron does not release energy, it consumes it. The iron in your
                blood, in the Earth's core, in every nail and beam on this planet, was forged
                inside massive stars and dispersed into space when those stars went supernova,
                billions of years before the Earth itself condensed out of the residual cloud.
                Every iron atom in the crust literally fell from the sky.
              </p>
              <p>
                The mechanism was sketched out in 1957 in the famous B²FH paper. In the 7th
                century, the only working model of iron was that it came out of mines.
              </p>
            </>
          ) : (
            <>
              <p>
                Kullanılan fiil <em>enzelnâ</em> (أَنْزَلْنَا) — “Biz indirdik”. Bu, vahyin
                kendisi için kullanılan fiilin aynısıdır: “zikri biz indirdik.” Demire
                uyarlandığında dil mecazî değil mekanik bir tonda — metin demirin yere
                indirildiğini söylüyor, çıkarıldığını değil.
              </p>
              <p>
                Modern astrofizik tam olarak bunu söylüyor.{" "}
                <RefLink id="nucleosynthesis">
                  Demir, sıradan yıldız füzyonunun son halkasıdır
                </RefLink>
                ; demirden öteye gitmek enerji üretmez, tüketir. Kanınızdaki demir, Dünya'nın
                çekirdeğindeki demir, gezegen üzerindeki her çivi ve kiriş — hepsi milyarlarca
                yıl önce ağır yıldızların içinde dövüldü ve bu yıldızların süpernova patlamasıyla
                uzaya saçıldı. Dünya bile daha o artık buluttan yoğunlaşmamıştı. Yerkabuğundaki
                her demir atomu kelimenin tam anlamıyla gökten düştü.
              </p>
              <p>
                Mekanizma 1957'de B²FH adıyla anılan makalede yazıldı. 7. yüzyılda demir için
                tek geçerli model madenlerden çıkarılmasıydı.
              </p>
            </>
          )}
        </Prose>
      </Section>

      {/* Sayım grid */}
      <Section id="sec-balance" eyebrow={isEn ? "The balance" : "Denge"}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {PAIRS.map((p, i) => (
            <PairCard key={i} pair={p} />
          ))}
        </div>
      </Section>

      {/* Kapanış */}
      <Section id="sec-closing" eyebrow={isEn ? "And so" : "Yani"}>
        <Prose>
          {isEn ? (
            <p>
              You can read the Qur'an as literature, as law, as a moral text — that is your
              business. But it makes one mechanical claim about itself in 15:9, and the next
              fourteen hundred years either prove or break that claim. So far the count is
              holding.
            </p>
          ) : (
            <p>
              Kuran'ı edebiyat olarak okumak, hukuk olarak okumak, ahlâkî bir metin olarak
              okumak — hepsi sizin tercihiniz. Ama metin 15:9'da kendisi için mekanik bir iddia
              ortaya koyuyor ve sonraki on dört yüzyıl o iddiayı ya doğruluyor ya da çürütüyor.
              Şimdiye kadar sayım tutuyor.
            </p>
          )}
        </Prose>

        <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
          <Ornament size={18} />
        </div>

        <p
          className="mu-muted"
          style={{
            textAlign: "center",
            fontSize: 11,
            lineHeight: 1.7,
            marginTop: 28,
            maxWidth: 460,
            marginInline: "auto",
            fontStyle: "italic",
          }}
        >
          {isEn ? (
            <>
              Numerical observations above are commonly cited findings going back to{" "}
              <RefLink id="nawfal">Abdurrazzak Nawfal</RefLink> and others. Counts depend on word
              forms; treat them as wonders pointed out, not as proofs.
            </>
          ) : (
            <>
              Yukarıdaki sayım örnekleri başta{" "}
              <RefLink id="nawfal">Abdurrezzak Nevfel</RefLink> olmak üzere pek çok araştırmacının
              dile getirdiği gözlemlere dayanır. Sayımlar kelime formlarına göre değişir; bunları
              ispat değil, dikkat çekilmiş bir uyum olarak okuyun.
            </>
          )}
        </p>
      </Section>

      {/* Kaynaklar */}
      <Section id="sec-references" eyebrow={isEn ? "References" : "Kaynaklar"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {REFERENCES.map((r) => (
            <ReferenceCard key={r.id} reference={r} isEn={isEn} />
          ))}
        </div>
      </Section>

        </main>

        {/* Yapışkan TOC — sadece lg ve üzeri */}
        <aside
          className="hidden lg:block lg:sticky"
          style={{ top: 24, alignSelf: "start" }}
        >
          <TableOfContents isEn={isEn} variant="sidebar" />
        </aside>
      </div>

      {/* Alt navigasyon */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingTop: 32, paddingBottom: 24 }}>
        <Link
          to="/surah/$surahSlug"
          params={{ surahSlug: "al-hijr" }}
          search={{ ayah: 9 }}
          className="mu-btn ghost"
        >
          {isEn ? "Read Al-Hijr" : "Hicr Sûresi"}
        </Link>
        <Link to="/" className="mu-btn ghost">
          {isEn ? "Home" : "Ana sayfa"}
        </Link>
      </div>
    </div>
  );
}

// ── Yardımcı bileşenler ──────────────────────────────────

function Section({
  eyebrow,
  id,
  children,
}: {
  eyebrow: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ paddingBottom: 36, scrollMarginTop: 32 }}>
      <p className="mu-eyebrow" style={{ marginBottom: 16 }}>
        <span className="mu-eb-line" />
        {eyebrow}
      </p>
      {children}
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 15.5,
        lineHeight: 1.75,
        color: "var(--mu-ink-2, var(--mu-ink))",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        maxWidth: "72ch",
      }}
    >
      {children}
    </div>
  );
}

function scrollToId(id: string, opts?: { highlight?: boolean }) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (opts?.highlight) {
    el.style.transition = "background-color 0.4s ease";
    const prev = el.style.backgroundColor;
    el.style.backgroundColor = "color-mix(in srgb, var(--mu-accent) 14%, transparent)";
    window.setTimeout(() => {
      el.style.backgroundColor = prev;
    }, 1200);
  }
}

function Ref({ id }: { id: string }) {
  const n = REF_INDEX[id];
  if (!n) return null;
  return (
    <sup style={{ lineHeight: 0 }}>
      <a
        href={`#ref-${id}`}
        onClick={(e) => {
          e.preventDefault();
          scrollToId(`ref-${id}`, { highlight: true });
        }}
        style={{
          color: "var(--mu-accent)",
          textDecoration: "none",
          fontFamily: "var(--mu-ff-mono)",
          fontSize: "0.7em",
          padding: "0 2px",
        }}
        aria-label={`Kaynak ${n}`}
      >
        [{n}]
      </a>
    </sup>
  );
}

function RefLink({ id, children }: { id: string; children: React.ReactNode }) {
  const n = REF_INDEX[id];
  if (!n) return <>{children}</>;
  return (
    <a
      href={`#ref-${id}`}
      onClick={(e) => {
        e.preventDefault();
        scrollToId(`ref-${id}`, { highlight: true });
      }}
      style={{
        color: "var(--mu-accent)",
        textDecoration: "none",
        borderBottom: "1px dotted color-mix(in srgb, var(--mu-accent) 45%, transparent)",
      }}
      aria-label={`Kaynak ${n}`}
    >
      {children}
      <sup style={{ lineHeight: 0, fontSize: "0.7em", fontFamily: "var(--mu-ff-mono)", paddingLeft: 2 }}>
        [{n}]
      </sup>
    </a>
  );
}

function VerseQuote({
  arabic,
  translation,
  reference,
}: {
  arabic: string;
  translation: string;
  reference: string;
}) {
  return (
    <blockquote
      style={{
        margin: "6px 0 4px",
        padding: "16px 20px",
        borderLeft: "2px solid var(--mu-accent)",
        background: "color-mix(in srgb, var(--mu-accent) 4%, transparent)",
        borderRadius: "0 8px 8px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <p
        style={{
          fontFamily: "var(--mu-ff-ar)",
          fontSize: 22,
          lineHeight: 1.9,
          direction: "rtl",
          color: "var(--mu-ink)",
          margin: 0,
        }}
      >
        {arabic}
      </p>
      <p
        style={{
          fontStyle: "italic",
          fontSize: 14,
          lineHeight: 1.65,
          color: "var(--mu-ink-3)",
          margin: 0,
        }}
      >
        {translation}
      </p>
      <p
        style={{
          fontFamily: "var(--mu-ff-mono)",
          fontSize: 10.5,
          color: "var(--mu-muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {reference}
      </p>
    </blockquote>
  );
}

function TableOfContents({
  isEn,
  variant = "card",
}: {
  isEn: boolean;
  variant?: "card" | "sidebar";
}) {
  const isCard = variant === "card";
  return (
    <nav
      aria-label={isEn ? "Contents" : "İçindekiler"}
      style={
        isCard
          ? {
              marginBottom: 40,
              padding: "20px 24px",
              border: "1px solid var(--mu-line)",
              borderRadius: 12,
              background: "var(--mu-bg-card)",
            }
          : {
              paddingLeft: 16,
              borderLeft: "1px solid var(--mu-line)",
            }
      }
    >
      <p className="mu-eyebrow" style={{ marginBottom: isCard ? 14 : 16 }}>
        <span className="mu-eb-line" />
        {isEn ? "Contents" : "İçindekiler"}
      </p>
      <ol
        style={
          isCard
            ? {
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "6px 24px",
              }
            : {
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }
        }
      >
        {TOC_ITEMS.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(item.id);
              }}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "baseline",
                textDecoration: "none",
                color: "var(--mu-ink-2, var(--mu-ink))",
                fontSize: isCard ? 13.5 : 12.5,
                lineHeight: 1.5,
                padding: isCard ? "5px 0" : "4px 0",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mu-ff-mono)",
                  fontSize: 11,
                  color: "var(--mu-accent)",
                  minWidth: 22,
                  letterSpacing: "0.04em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{isEn ? item.titleEn : item.titleTr}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ReferenceCard({ reference, isEn }: { reference: Reference; isEn: boolean }) {
  const n = REF_INDEX[reference.id];
  return (
    <div
      id={`ref-${reference.id}`}
      style={{
        padding: "16px 18px",
        borderRadius: 10,
        border: "1px solid var(--mu-line)",
        background: "var(--mu-bg-card)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        scrollMarginTop: 32,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--mu-ff-mono)",
            fontSize: 12,
            color: "var(--mu-accent)",
            minWidth: 22,
          }}
        >
          [{n}]
        </span>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--mu-ink)", margin: 0 }}>
          {isEn ? reference.titleEn : reference.titleTr}
        </p>
      </div>
      <p
        className="mu-muted"
        style={{ fontSize: 13, lineHeight: 1.6, marginLeft: 32, marginTop: 0 }}
      >
        {isEn ? reference.descEn : reference.descTr}
      </p>
      <a
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: 32,
          fontFamily: "var(--mu-ff-mono)",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: "var(--mu-accent)",
          textDecoration: "none",
        }}
      >
        {reference.urlLabel} ↗
      </a>
    </div>
  );
}

function PairCard({ pair }: { pair: CountPair }) {
  const hasPair = pair.pairCount != null;
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 10,
        border: "1px solid var(--mu-line)",
        background: "var(--mu-bg-card)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "var(--mu-ff-ar)",
              fontSize: 22,
              lineHeight: 1,
              direction: "rtl",
              color: "var(--mu-ink)",
            }}
          >
            {pair.arabic}
          </p>
          <p className="mu-muted" style={{ fontSize: 12, marginTop: 4 }}>
            {pair.tr}
          </p>
        </div>
        <span
          style={{
            fontFamily: "var(--mu-ff-mono)",
            fontSize: 18,
            color: "var(--mu-accent)",
            letterSpacing: "0.02em",
          }}
        >
          {pair.count}
        </span>
      </div>

      {hasPair && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px dashed var(--mu-line)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: "var(--mu-ff-ar)",
                fontSize: 22,
                lineHeight: 1,
                direction: "rtl",
                color: "var(--mu-ink)",
              }}
            >
              {pair.pairArabic}
            </p>
            <p className="mu-muted" style={{ fontSize: 12, marginTop: 4 }}>
              {pair.pairTr}
            </p>
          </div>
          <span
            style={{
              fontFamily: "var(--mu-ff-mono)",
              fontSize: 18,
              color: "var(--mu-accent)",
              letterSpacing: "0.02em",
            }}
          >
            {pair.pairCount}
          </span>
        </div>
      )}

      <p className="mu-muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
        {pair.note}
      </p>
    </div>
  );
}

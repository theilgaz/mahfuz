/**
 * Kuran'da adı geçen 25 peygamber için 3'lü ipucu havuzu.
 * İpuçları kademeli açılır: C1 subtle (erken bilirsen yüksek puan),
 * C3 neredeyse cevabın kendisi. "Kim Bu Peygamber?" Meclis oyununda kullanılır.
 */

export interface PeygamberEntry {
  name: string;
  /** İpuçları zorlukta azalan sırayla — ilk hint en kapalı, üçüncü hint en açık. */
  clues: [string, string, string];
}

export const PEYGAMBERS: PeygamberEntry[] = [
  {
    name: "Adem",
    clues: [
      "Allah ona bütün isimleri öğretti",
      "Melekler ona secde etmekle emrolundu",
      "Yasak meyveyi yedikten sonra cennetten yeryüzüne indirildi",
    ],
  },
  {
    name: "İdris",
    clues: [
      "Yüksek bir mertebeye yükseltildi",
      "İlk yazıyı yazan kişi olarak rivayet edilir",
      "Meryem ve Enbiya surelerinde adı doğrudan geçer",
    ],
  },
  {
    name: "Nuh",
    clues: [
      "Kavmine dokuz yüz elli yıl tebliğde bulundu",
      "Allah'ın emriyle büyük bir gemi inşa etti",
      "Tufan ile kavmi helak oldu; oğlu da boğulanlardan oldu",
    ],
  },
  {
    name: "Hud",
    clues: [
      "Kuran'da kendi adıyla bir sure vardır",
      "Ad kavmine gönderildi",
      "İnanmayan kavmi şiddetli bir rüzgarla helak edildi",
    ],
  },
  {
    name: "Salih",
    clues: [
      "Kavmi taştan evler oyardı",
      "Mucize olarak ona bir dişi deve verildi",
      "Semud kavmine gönderildi; deveyi öldürünce azap geldi",
    ],
  },
  {
    name: "İbrahim",
    clues: [
      "Babasının ve kavminin putlarına karşı çıktı",
      "Nemrut'un büyük ateşine atıldı, ateş onu yakmadı",
      "Oğlu İsmail ile Kabe'yi inşa etti, halilullah olarak anılır",
    ],
  },
  {
    name: "Lut",
    clues: [
      "İbrahim'in kardeşinin oğluydu",
      "Kavmi erkeklere yaklaşıyor, sapkınlıkta direniyordu",
      "Kavmi taş yağmuruyla helak oldu; eşi de geride kalanlardandı",
    ],
  },
  {
    name: "İsmail",
    clues: [
      "Annesi Mekke vadisinde Allah'a tevekkül etti",
      "Zemzem suyu onun ve annesinin susuzluğu için fışkırdı",
      "Babası İbrahim onu kurban etmeye götürdü; yerine koç indi",
    ],
  },
  {
    name: "İshak",
    clues: [
      "İbrahim ve Sare'ye yaşlılıklarında müjdelendi",
      "Annesi haberi duyunca güldü",
      "Yakub'un babası, İbrahim'in ikinci oğludur",
    ],
  },
  {
    name: "Yakub",
    clues: [
      "Diğer adı İsrail'dir; soyundan oniki kabile gelir",
      "Oğlunu yıllarca özledi, gözlerine ak indi",
      "Yusuf'un babasıdır",
    ],
  },
  {
    name: "Yusuf",
    clues: [
      "Çocukken on bir yıldızın kendisine secde ettiğini gördü",
      "Mısır'ın hazineleri ona emanet edildi",
      "Kardeşleri tarafından kuyuya atıldı, sonra Mısır azizi oldu",
    ],
  },
  {
    name: "Eyyub",
    clues: [
      "Sabrın ve şükrün sembolüdür",
      "Uzun yıllar ağır bir hastalıkla imtihan edildi",
      "\"Rabbi'm bana zarar dokundu, sen merhametlilerin en merhametlisisin\" diye dua etti",
    ],
  },
  {
    name: "Şuayb",
    clues: [
      "Ölçü ve tartıyı dosdoğru yapmayı emretti",
      "Medyen halkına gönderildi",
      "Musa, Mısır'dan kaçınca onun yanında çobanlık yaptı ve kızlarından biriyle evlendi",
    ],
  },
  {
    name: "Musa",
    clues: [
      "Bebekken nehre bırakıldı, sarayda büyütüldü",
      "Asası yılana dönüştü; eli bembeyaz parladı",
      "Firavun'a karşı çıktı, kavmini denizden geçirdi, Tur'da Allah ile konuştu",
    ],
  },
  {
    name: "Harun",
    clues: [
      "Konuşması daha fasihti, kardeşine yardımcı olarak gönderildi",
      "Kavmi altın buzağıya tapınınca üzüldü",
      "Musa'nın kardeşidir",
    ],
  },
  {
    name: "Davud",
    clues: [
      "Demiri elinde yumuşatabilir, ondan zırh dokurdu",
      "Dağlar ve kuşlar onunla birlikte tesbih ederdi",
      "Talut'un ordusunda iken Calut'u yendi; Zebur ona indirildi",
    ],
  },
  {
    name: "Süleyman",
    clues: [
      "Rüzgar onun emrine verildi",
      "Karıncayla, hüdhüd kuşuyla konuştu",
      "Cinler ve şeytanlar ona kulluk etti; Sebe melikesi Belkıs ona inandı",
    ],
  },
  {
    name: "İlyas",
    clues: [
      "İsrailoğullarına gönderildi",
      "Baal putuna tapan kavmiyle mücadele etti",
      "Saffat suresinde \"selamün ala İl-Yasin\" diye anılır",
    ],
  },
  {
    name: "Elyesa",
    clues: [
      "Adı Kuran'da kısa geçer, kıssası ayrıntılı anlatılmaz",
      "İlyas peygamberden sonra gönderilenlerdendir",
      "En'am ve Sad surelerinde diğer seçkin peygamberlerle birlikte zikredilir",
    ],
  },
  {
    name: "Yunus",
    clues: [
      "Kavmine kızıp Allah'ın izni olmadan ayrıldı",
      "Bir gemiye bindi, denize atıldı, büyük bir balık onu yuttu",
      "Karanlıkta \"Senden başka ilah yok, sen yücesin, ben zalimlerden oldum\" diye dua etti",
    ],
  },
  {
    name: "Zekeriya",
    clues: [
      "Yaşlılığında soyunu sürdürecek bir evlat istedi",
      "Mihrabda Meryem'i ziyaret ederken meyveler bulurdu",
      "Allah ona ihtiyarlığında Yahya adında bir oğul müjdeledi",
    ],
  },
  {
    name: "Yahya",
    clues: [
      "Çocukken hikmet ve takva verildi",
      "Anne karnında değilken Allah ona selam verdi",
      "Zekeriya'nın oğludur; İsa'nın hem akrabası hem öncüsü sayılır",
    ],
  },
  {
    name: "İsa",
    clues: [
      "Allah'ın \"ol\" demesiyle babasız dünyaya geldi",
      "Beşikteyken konuştu, ölüleri Allah'ın izniyle diriltti",
      "Annesi Meryem'dir; Allah onu kendi katına yükseltti",
    ],
  },
  {
    name: "Zülkifl",
    clues: [
      "Adı Kuran'da iki yerde, sabırlı kullar arasında geçer",
      "Enbiya ve Sad surelerinde İsmail ve İdris ile birlikte zikredilir",
      "\"Nasibe sahip olan\" anlamına gelen unvanı vardır",
    ],
  },
  {
    name: "Muhammed",
    clues: [
      "Hira mağarasında ilk vahyi aldı",
      "Mekke'den Medine'ye hicret etti",
      "Son peygamberdir; ona Cebrail aracılığıyla Kuran indirildi",
    ],
  },
];

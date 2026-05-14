# DESIGN.md

Mahfuz tasarim sisteminin tek dogru kaynagi. Bir bilesen yazarken, renk secerken
veya yeni bir sayfa kurarken once buraya bak. Burada yoksa, ekleyip oyle kullan.

> Hedef: Mahfuz'un her ekrani ayni dile konussun. Kullaniciyi metne odaklayan,
> sessiz, edebi bir okuyucu hissi.

## Icindekiler

1. [Felsefe](#1-felsefe)
2. [Token mimarisi](#2-token-mimarisi)
3. [Renk tokenlari](#3-renk-tokenlari)
4. [Tema](#4-tema)
5. [Tipografi](#5-tipografi)
6. [Bosluk skalasi](#6-bosluk-skalasi)
7. [Kose ve golge](#7-kose-ve-golge)
8. [Hareket](#8-hareket)
9. [Sayfa duzeni](#9-sayfa-duzeni)
10. [Bilesen primitifleri](#10-bilesen-primitifleri)
11. [Ikonografi](#11-ikonografi)
12. [Erisilebilirlik](#12-erisilebilirlik)
13. [Yapilmamasi gerekenler](#13-yapilmamasi-gerekenler)
14. [Sistemi genisletme](#14-sistemi-genisletme)

---

## 1. Felsefe

Uc kelime: **sessiz, edebi, odakli**.

- **Sessiz**: parlak renk, animasyon ve dekor kullaniciyi metne odaklamaktan
  alikoymamali. Kelime vurgusu, golge, accent rengi: hepsi yumusak.
- **Edebi**: tipografi birinci sinif. Fraunces (Latin display), Inter (UI),
  Scheherazade New / KFGQPC HAFS (Arapca). Bosluk, satir yuksekligi metin
  okunabilirligine yatirim olarak gorulur.
- **Odakli**: bir ekranda en fazla bir ana eylem. Ikincil eylemler tek vurgudan
  daha az isaretlenmis olmali (outline, ghost, link tarzlari).

## 2. Token mimarisi

Tek kanon: `--mu-*`. Tarihi `--color-*` aliaslari (app.css) ve Tailwind
renk skalalari (`primary-*`, `gold-*`) sadece geriye uyumluluk icindir.

```
--mu-*            (tek kaynak, minimal-ui.css)
  |
  v
--color-*         (semantik alias, app.css)
  |
  v
Tailwind utility  (text-primary, bg-surface, vb.)
```

**Kural**: yeni kod yalnizca `--mu-*` veya semantik `--color-*` aliaslari
kullanir. `primary-500` veya hex literal sectim icin dogrudan kullanma. Tek
istisna: Kuran tilavet senkron rengi (`word-highlight.active`) hala primary
skalasini kullanir, ileride `--mu-accent`'e migrate edilecek.

## 3. Renk tokenlari

Tum tokenlar `apps/web/src/styles/minimal-ui.css`'te tanimli.

### Yuzeyler
| Token            | Rol                                              |
|------------------|--------------------------------------------------|
| `--mu-bg`        | Sayfa arka plani (en altta)                      |
| `--mu-bg-soft`   | Ikincil yuzey (bolme cizgisi yerine yuzey ayrim) |
| `--mu-bg-card`   | Kart, list row, surah header gibi yukseltilmis yuzeyler |

### Metin
| Token        | Rol                                                      |
|--------------|----------------------------------------------------------|
| `--mu-ink`   | Birincil metin (basliklar, ana icerik)                   |
| `--mu-ink-2` | Vurgulu ama birincil olmayan metin                       |
| `--mu-ink-3` | Ceviri metni, ikincil aciklama                           |
| `--mu-muted` | Yardimci, ipucu, zaman damgasi, "soluk" metin            |

### Cizgi
| Token         | Rol                                                |
|---------------|----------------------------------------------------|
| `--mu-line`   | Ana bolme cizgisi (kart kenari, list ayraci)       |
| `--mu-line-2` | Daha belirgin cerceve (input border, divider)      |

### Aksan
| Token              | Rol                                          |
|--------------------|----------------------------------------------|
| `--mu-accent`      | Birincil eylem, link, secili sekme           |
| `--mu-accent-soft` | Hover/secili arka plani (yumusak ton)        |
| `--mu-accent-ink`  | Aksanli yuzey uzerine metin                  |

### Sistem
- **Hata**: yeni token gerekiyor. Su an icin `oklch(0.55 0.18 25)` (kirik kiremit
  kirmizisi) onerilir. Migration sirasinda eklenecek (`--mu-danger`).
- **Basari**: aksanin kendisini kullan (yesil-altin aksan), ayri bir basari
  rengi acmiyoruz.
- **Uyari**: `--mu-accent` ile ayni aile, gerekirse `oklch(0.78 0.13 80)`.

## 4. Tema

Uc tema: `light` (varsayilan), `sepia`, `dark`. `data-theme` attribute'u
`<html>` veya kok element uzerinde.

| Boyut                | Light             | Sepia             | Dark               |
|----------------------|-------------------|-------------------|--------------------|
| `--mu-bg`            | `#FFFFFF`         | `#F1E8D3`         | `#14110C`          |
| `--mu-ink`           | `#1C1A15`         | `#2A2212`         | `#F0E8D6`          |
| Accent (`oklch`)     | `0.62 0.12 70`    | (light degeri)    | `0.72 0.11 70`     |

Sistem `prefers-color-scheme: dark` ve `data-theme` set degilse otomatik
dark'a duser (mevcut davranis korunur).

**Kural**: bir bilesen renk seciyorsa token kullanir. Token yoksa once
DESIGN.md'ye ekle, sonra kullan. Tema gecislerinde test edilmeyen herhangi
bir hex literal regresyon sebebidir.

## 5. Tipografi

### Font aileleri
| Token              | Aile                          | Kullanim                              |
|--------------------|-------------------------------|---------------------------------------|
| `--mu-ff-display`  | Fraunces, Cormorant, Georgia  | Sayfa basligi, hero, sure adi (Latin) |
| `--mu-ff-ui`       | Inter, system-ui              | Tum UI, gov metni, dugme              |
| `--mu-ff-ar`       | Scheherazade New, KFGQPC HAFS | Arapca ayet ve kelime                 |
| `--mu-ff-mono`     | JetBrains Mono                | Kod, sayisal etiket (skor, sure no)   |

### Tip skalasi (yeni, eklenmeli)

`minimal-ui.css`'e su tokenlar eklenmeli (Phase 1):

```css
--mu-fs-display: clamp(2rem, 4vw, 3rem);     /* hero */
--mu-fs-h1: 1.625rem;                         /* sayfa basligi */
--mu-fs-h2: 1.25rem;                          /* bolum basligi */
--mu-fs-body: 1rem;                           /* govde */
--mu-fs-small: 0.875rem;                      /* yardimci */
--mu-fs-caption: 0.75rem;                     /* etiket, zaman */

--mu-lh-tight: 1.2;
--mu-lh-normal: 1.5;
--mu-lh-loose: 1.7;
--mu-lh-arabic: 2.8;
```

**Arapca** kendi skalasinda: `clamp(1.5rem, 3vw, 2.2rem)` ana ayet boyutu,
`--line-height-arabic: 2.8`. Aile her zaman RTL ile `direction: rtl` + Arapca
font.

**Kural**: yeni komponentte `text-[14px]` veya `text-lg` yerine semantik
sinif kullan (`mu-text-small`, vb. ileride Phase 2'de eklenir).

## 6. Bosluk skalasi

4'un katlari. JSX'te ham deger yazma.

| Token      | px    | Kullanim                                           |
|------------|-------|----------------------------------------------------|
| `--mu-s-1` | 4     | Ikon-metin arasi sikistirilmis bosluk              |
| `--mu-s-2` | 8     | Tag, pill, kompakt buton ic boslugu                |
| `--mu-s-3` | 12    | Kart icindeki satir arasi, dugme padding-y         |
| `--mu-s-4` | 16    | Kart padding, list row dikey bosluk                |
| `--mu-s-6` | 24    | Bolum baslik-icerik arasi                          |
| `--mu-s-8` | 32    | Bolumler arasi, sayfa ust bosluk                   |
| `--mu-s-12`| 48    | Hero / buyuk dinlenme alani                        |

Bunlar `minimal-ui.css`'e Phase 1'de eklenecek; o ana kadar `p-4`, `gap-3`
gibi Tailwind utility'leri ayni olcekte oldugu surece kabul edilir.

## 7. Kose ve golge

```css
--mu-radius-sm: 8px;   /* tag, pill, kucuk dugme */
--mu-radius:    14px;  /* kart, sheet, input (mevcut) */
--mu-radius-lg: 20px;  /* hero kart, modal */
--mu-radius-full: 999px; /* avatar, ikon dugme */
```

Mevcut `--mu-shadow-sm` ve `--mu-shadow-md` korunur. Modal/sheet icin daha
guclu bir golge gerekirse `--mu-shadow-lg` Phase 2'de eklenir. Karta birden
fazla golge stillemekten kacin.

## 8. Hareket

Tek easing curve: `cubic-bezier(0.2, 0.8, 0.2, 1)`.

| Token          | Suren | Kullanim                                  |
|----------------|-------|-------------------------------------------|
| `--mu-dur-1`   | 150ms | Hover, focus, ikon renk gecisi            |
| `--mu-dur-2`   | 200ms | Kart hover yukselme, secim isareti        |
| `--mu-dur-3`   | 300ms | Sheet ic-disa, modal acilis               |
| `--mu-dur-4`   | 500ms | Sayfa gecisleri (ViewTransitions ile)     |

`prefers-reduced-motion: reduce` set ise tum suren `0.01ms`'ye duser.
Kullanici kontrolune saygi gosterilir.

## 9. Sayfa duzeni

### Maksimum genislik
- `--mu-maxw: 1240px` (mevcut). Okuyucu icin daha dar: surah/page rotalari
  `720px` veya `780px` ile sinirli.

### Z-index skalasi
```
0    : sayfa icerigi
10   : sticky alt eleman (sayfa basligi)
40   : top bar
50   : bottom nav, audio bar
60   : sheet / modal arkaplan
70   : toast / snackbar
```

### Standart kabuk
Her sayfa `<PageShell>` (Phase 2) sarmalayicisini kullanir:
- Ust: TopBar (yoksa minimal basliklar)
- Govde: max-width container, dikey bosluk `--mu-s-8`
- Alt: BottomNav (mobil), Footer (desktop)

## 10. Bilesen primitifleri

`apps/web/src/components/ui/` altinda yer alacak (Phase 2). Mevcut
durumda `minimal-ui.css` cogunu inline class olarak tanimlar; tekrarlanan
desenler asagidaki primitiflere tasinir.

| Bilesen        | Amac                                            | Durum    |
|----------------|-------------------------------------------------|----------|
| `Button`       | Birincil, ikincil, ghost, danger varyantlari    | Yapilcak |
| `IconButton`   | 40x40 dokunma alani, label icin tooltip         | Yapilcak |
| `Card`         | Yuzey kapsayicisi, hover state opsiyonel        | Yapilcak |
| `Section`      | Baslik + alt baslik + cocuk                     | Yapilcak |
| `PageShell`    | Sayfa kabugu                                    | Yapilcak |
| `PageHeader`   | Baslik + sag eylem alani                        | Yapilcak |
| `ListRow`      | Sure listesi, yer imi gibi tek satir            | Yapilcak |
| `Sheet`        | Alttan acilan panel                             | Yapilcak |
| `Modal`        | Diyalog                                         | Yapilcak |
| `Input`        | Tek satir, label + helper                       | Yapilcak |
| `Select`       | `SearchableSelect` taban alinacak               | Yapilcak |
| `Tag` / `Pill` | Cuz, sayfa numarasi etiketi                     | Yapilcak |
| `EmptyState`   | Veri yok hali (ornek: not yok, yer imi yok)     | Yapilcak |
| `Skeleton`     | Yuklenme iskeleti                               | Yapilcak |
| `Toast`        | Gecici bilgi                                    | Yapilcak |

### Buton varyantlari
- **Primary**: `bg: --mu-accent`, `text: white`. Sayfada en fazla bir.
- **Secondary**: `bg: --mu-bg-soft`, `text: --mu-ink`, `border: --mu-line`.
- **Ghost**: arka plansiz, `text: --mu-ink`, hover'da `--mu-bg-soft`.
- **Link**: cizgisiz, `text: --mu-accent`, hover'da alt cizgi.
- **Danger**: `bg: --mu-danger`, `text: white`. Yalniz yikici eylemde (sil, vazgec).

Not: `--mu-accent-ink` solid accent dolgu uzerine **degil**, `--mu-accent-soft`
yumusak yuzeyleri uzerine metin icin. Ornek: bir tag/chip `bg: --mu-accent-soft`,
`text: --mu-accent-ink`. Solid `--mu-accent` dolgusu icin metin `white`.

Boyutlar: `sm` (32px y), `md` (40px y, varsayilan), `lg` (48px y, hero CTA).

### Kart deseni
```
border: 1px solid var(--mu-line)
border-radius: var(--mu-radius)
background: var(--mu-bg-card)
padding: var(--mu-s-4)
shadow: var(--mu-shadow-sm)  /* opsiyonel */
hover transform: translateY(-1px), shadow: var(--mu-shadow-md)
```

## 11. Ikonografi

- Tek bir kaynak: `components/icons/` ve `components/minimal-ui/icons`.
- 24x24 viewBox, `stroke-width: 1.5`, `currentColor`.
- Emoji **kullanilmaz**. (Bkz. CLAUDE.md kurallari.)
- Yeni ikon: SVG inline component olarak `icons/` altina ekle, default export
  yapma, isimle export et.

## 12. Erisilebilirlik

- **Renk kontrasti**: `--mu-ink` uzerine `--mu-bg`'de en az WCAG AA (4.5:1).
  Sepia tema en zayif halka, yeni renk eklerken burada test et.
- **Klavye**: tum tiklanabilir eleman `:focus-visible` ile gorunur cerceve
  alir. `outline: 2px solid var(--mu-accent); outline-offset: 2px`.
- **Dokunma alani**: en az 40x40. `IconButton` icin gorsel ikon 20x20
  olabilir ama hit area 40x40 zorunlu.
- **Hareket azaltma**: `prefers-reduced-motion: reduce` her animasyonu
  devre disi birakir.
- **RTL**: Arapca her zaman `dir="rtl"` ile. UI elemanlari icin uygulama
  hala LTR (Turkce/Ingilizce arayuz).

## 13. Yapilmamasi gerekenler

(CLAUDE.md kurallari + bu doluman icin gecerli.)

- Emoji kullanma. Plain sembol veya SVG ikon kullan.
- Em dash kullanma (TR yazimda `-` veya `:` kullan).
- Karisik `<Link>` ve `<div>` listelerinde `space-y-*` kullanma. `flex` +
  `gap-*` ile kur.
- DESIGN.md'de tanimsiz hex literal ekleme. Once token tanimla, sonra kullan.
- Mevcut `primary-*`, `gold-*` Tailwind skalasini yeni kodda kullanma.
  Sadece legacy `word-highlight.active` icin korunur.
- Sayfada birden fazla "Primary" buton koyma. Iki ana eylem varsa biri
  Secondary olur.
- Drop shadow uzerine drop shadow stillemek (cift golge).
- `clamp()` ve `vw` birimini Arapca disinda kullanma (sabit skala tercih).
- Bilesen icine sayfaya ozel margin yazma. Sayfa kendi disindaki bosluga
  karar verir; bilesen sadece kendi icini yonetir.

## 14. Sistemi genisletme

Yeni bir token, varyant veya bilesen ihtiyaci dogdugunda:

1. Ihtiyacin gercek bir tekrar oldugundan emin ol (en az iki yerde ayni
   sablon var mi?). Tek seferlik ise inline kalsin.
2. Token ise: once DESIGN.md'ye ekle, `minimal-ui.css`'te tanimla, ardindan
   kullanim yerinde uygula.
3. Bilesen ise: `apps/web/src/components/ui/` altina koy. Hikayeyi/varyanti
   DESIGN.md'nin ilgili bolumune kisaca yaz.
4. Eski kod ayni deseni tekrar uretiyorsa migration listesine ekle (her
   migration ayri PR).
5. Tema, RTL ve `prefers-reduced-motion` ile gozden gecirmeden mergelenmez.

---

### Migrasyon takvimi

| Faz | Icerik                                                       | Durum  |
|-----|--------------------------------------------------------------|--------|
| 0   | Bu dosyanin yazilmasi                                        | Tamam  |
| 1   | Token konsolidasyonu (tip skalasi, bosluk, motion eklenmesi) | Sirada |
| 2   | `components/ui/` primitif katmaninin kurulmasi               | Sonra  |
| 3   | Rota rota migrasyon (anasayfa -> okuyucu -> profil -> ...)   | Sonra  |
| 4   | ESLint kurallari ve pre-commit guardraillari                 | Sonra  |

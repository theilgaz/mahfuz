import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSurahs, surahsQueryOptions, dailyVerseQueryOptions } from "~/hooks/useQuranQuery";
import { useReadingStore } from "~/stores/reading.store";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-names-i18n";
import { surahSlug } from "~/lib/surah-slugs";
import { MuIcons } from "~/components/minimal-ui/icons";
import { LogoMeem } from "~/components/minimal-ui/LogoMeem";
import { ACCENT_COLORS, type AccentColorId } from "~/stores/settings.store";

export const Route = createFileRoute("/promo")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(surahsQueryOptions()),
    context.queryClient.prefetchQuery(dailyVerseQueryOptions()),
  ]),
  component: PromoPage,
});

const PROMO_VERBS: { id: AccentColorId; label: string }[] = [
  { id: "default", label: "oku." },
  { id: "olive", label: "dinle." },
  { id: "teal", label: "ezberle." },
  { id: "indigo", label: "öğren." },
  { id: "plum", label: "oyna." },
  { id: "crimson", label: "paylaş." },
  { id: "copper", label: "yaşa." },
];

const FATIHA_AYAHS = [
  { num: 1, ar: "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", tr: "Rahman ve Rahim Allah'ın ismiyle..." },
  { num: 2, ar: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ", tr: "Hamd, alemlerin Rabbi Allah'a mahsustur." },
  { num: 3, ar: "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ", tr: "O, Rahman ve Rahim'dir." },
];

const FATIHA_TOC = [
  "Rahman ve Rahim Allah'ın ismiyle...",
  "Hamd, alemlerin Rabbi Allah'a mahsustur.",
  "O, Rahman ve Rahim'dir.",
  "O, hesap ve ceza gününün tek sahibidir.",
  "Rabbimiz! Sadece sana kulluk eder ve sadece senden yardım...",
  "Bizi dosdoğru yola eriştir;",
  "Kendilerine nimet verdiklerinin yoluna. Gazaba uğrayanların ...",
];

const SLICES = [
  {
    id: "light" as const,
    label: "Aydınlık",
    clip: "polygon(0 0, 38% 0, 28% 100%, 0 100%)",
    bg: "#ffffff",
    ink: "#1C1A15",
    ink2: "#2B2720",
    ink3: "#4A4335",
    muted: "#8A8170",
    line: "#E8E8E8",
    accent: ACCENT_COLORS.default.light.accent,
  },
  {
    id: "sepia" as const,
    label: "Kur'an",
    clip: "polygon(38% 0, 68% 0, 58% 100%, 28% 100%)",
    bg: "#f5efe0",
    ink: "#2c2416",
    ink2: "#3a3024",
    ink3: "#5a4e3a",
    muted: "#7a6e5a",
    line: "#d9d0bc",
    accent: ACCENT_COLORS.default.light.accent,
  },
  {
    id: "dark" as const,
    label: "Gece",
    clip: "polygon(68% 0, 100% 0, 100% 100%, 58% 100%)",
    bg: "#0f0e0c",
    ink: "#f0ece4",
    ink2: "#ddd6c8",
    ink3: "#a09484",
    muted: "#9a9080",
    line: "#2a2820",
    accent: ACCENT_COLORS.crimson.dark.accent,
  },
] as const;

function PromoPage() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 50 }}>
      {SLICES.map((slice) => (
        <div
          key={slice.id}
          style={{
            position: slice.id === "light" ? "relative" : "absolute",
            inset: slice.id === "light" ? undefined : 0,
            clipPath: slice.clip,
            background: slice.bg,
            zIndex: slice.id === "light" ? 0 : 1,
            height: "100%",
          }}
        >
          <PromoContent slice={slice} />
        </div>
      ))}

      {/* Theme labels */}
      {SLICES.map((slice, i) => (
        <span
          key={slice.id}
          style={{
            position: "absolute",
            bottom: 20,
            left: i === 0 ? "8%" : i === 1 ? "44%" : undefined,
            right: i === 2 ? "10%" : undefined,
            fontFamily: "var(--mu-ff-mono)",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: slice.muted,
            zIndex: 10,
          }}
        >
          {slice.label}
        </span>
      ))}
    </div>
  );
}

function PromoContent({ slice }: { slice: typeof SLICES[number] }) {
  const { t, locale } = useTranslation();
  const lastPosition = useReadingStore((s) => s.lastPosition);
  const { data: surahs } = useSurahs();

  const lastSurah = lastPosition
    ? surahs.find((s) => s.id === lastPosition.surahId)
    : null;

  const continueLink = lastPosition && lastSurah
    ? { to: "/surah/$surahSlug" as const, params: { surahSlug: surahSlug(lastSurah.id) }, search: { ayah: lastPosition.ayahNumber } }
    : null;

  const mode = slice.id === "dark" ? "dark" : "light";

  const [verbIndex, setVerbIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setVerbIndex((i) => (i + 1) % PROMO_VERBS.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentVerb = PROMO_VERBS[verbIndex];

  return (
    <div style={{
      maxWidth: "var(--mu-maxw, 1200px)",
      margin: "0 auto",
      padding: "16px 32px 0",
      width: "100%",
    }}>
      <section style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.4fr",
        gap: 40,
        padding: "24px 0 0",
        alignItems: "start",
      }}>
        {/* Left - Hero */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 0 16px",
          }}>
            <LogoMeem size={32} />
            <span style={{
              fontFamily: "var(--mu-ff-display)",
              fontSize: 18,
              fontWeight: 500,
              color: slice.ink,
            }}>Mahfuz</span>
          </div>

          <p style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--mu-ff-mono)",
            fontSize: 13,
            letterSpacing: "0.05em",
            color: slice.muted,
            margin: "0 0 12px",
          }}>
            <span style={{ width: 28, height: 1.5, background: slice.muted, opacity: 0.4 }} />
            15:9
          </p>

          <h1 style={{
            fontFamily: "var(--mu-ff-display)",
            fontWeight: 400,
            fontSize: "clamp(34px, 4.5vw, 58px)",
            lineHeight: 1.0,
            letterSpacing: "-0.025em",
            margin: 0,
            color: slice.ink,
          }}>
            <span style={{ display: "block" }}>Korunduğu gibi,</span>
            <span
              style={{
                display: "block",
                fontStyle: "italic",
                color: ACCENT_COLORS[currentVerb.id][mode].accent,
                opacity: visible ? 1 : 0,
                transition: "opacity 300ms ease-in-out",
              }}
            >
              şimdi {currentVerb.label}
            </span>
          </h1>

          <p style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: slice.ink3,
            margin: "20px 0 24px",
          }}>
            Modern çağda, minimal ve konforlu bir Kur'an deneyimi.
          </p>

          <div>
            {continueLink ? (
              <Link {...continueLink} className="mu-btn primary" tabIndex={-1} style={{ background: slice.ink, color: slice.bg, pointerEvents: "none" }}>
                {t.home?.continueReading ?? "Okumaya devam et"}
                <span className="mu-btn-sub" style={{ color: slice.muted }}>
                  {getSurahName(lastSurah!.id, locale)} - {t.reader?.ayah ?? "ayet"} {lastPosition!.ayahNumber}
                </span>
                <span style={{ color: slice.bg }}>{MuIcons.arrowRight}</span>
              </Link>
            ) : (
              <span className="mu-btn primary" style={{ background: slice.ink, color: slice.bg }}>
                {t.home?.startReading ?? "Fatiha'dan başla"}
                <span style={{ color: slice.bg }}>{MuIcons.arrowRight}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right - Mini Fatiha page demo */}
        <FatihaDemo slice={slice} />
      </section>
    </div>
  );
}

function FatihaDemo({ slice }: { slice: typeof SLICES[number] }) {
  return (
    <div style={{
      position: "relative",
      overflow: "hidden",
      borderRadius: 12,
      border: `1px solid ${slice.line}`,
      boxShadow: `0 8px 32px color-mix(in oklab, ${slice.ink}, transparent 88%)`,
      background: slice.bg,
      height: 600,
    }}>
      {/* Scale wrapper - render at 1000px, scale to fit */}
      <div style={{
        width: 1000,
        transformOrigin: "top left",
        transform: "scale(0.66)",
        height: `${100 / 0.66}%`,
      }}>
        {/* Top navbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: `1px solid ${slice.line}`,
        }}>
          <span style={{ color: slice.muted, fontSize: 18 }}>{MuIcons.arrowLeft}</span>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <span style={{
                width: 28, height: 28, borderRadius: 999,
                background: slice.accent, display: "grid", placeItems: "center",
                color: slice.bg, fontSize: 12,
              }}>{MuIcons.play}</span>
              <span style={{ fontFamily: "var(--mu-ff-display)", fontSize: 16, fontWeight: 500, color: slice.ink }}>Fatiha</span>
            </div>
            <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 11, color: slice.muted }}>1 / 7</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{
              padding: "6px 14px", borderRadius: 8,
              background: `color-mix(in oklab, ${slice.accent}, transparent 85%)`,
              color: slice.accent, fontSize: 13, fontWeight: 500,
              fontFamily: "var(--mu-ff-ui)",
            }}>Ayet Ayet</span>
            <span style={{
              padding: "6px 14px", borderRadius: 8,
              color: slice.muted, fontSize: 13, fontWeight: 500,
              fontFamily: "var(--mu-ff-ui)",
              border: `1px solid ${slice.line}`,
            }}>Kırık Meal</span>
            <span style={{ color: slice.muted, fontSize: 16 }}>{MuIcons.bookmark}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: slice.line }}>
          <div style={{ width: "14%", height: "100%", background: slice.accent, borderRadius: 2 }} />
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px" }}>
          {/* Content */}
          <div style={{ padding: "32px 48px" }}>
            {/* Surah header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p style={{
                fontFamily: "var(--mu-ff-mono)", fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: slice.muted, margin: "0 0 18px",
              }}>
                Mekki sure - 7 ayet - nüzul 5
              </p>
              <p style={{
                fontFamily: "var(--mu-ff-ar)", fontSize: 48,
                color: slice.ink, margin: "0 0 12px", lineHeight: 1,
              }} dir="rtl">سُورَةُ الفَاتِحَة</p>
              <p style={{
                fontFamily: "var(--mu-ff-display)", fontSize: 36,
                fontWeight: 400, color: slice.ink, margin: "0 0 4px",
              }}>Fatiha</p>
              <p style={{
                fontFamily: "var(--mu-ff-display)", fontSize: 22,
                fontStyle: "italic", color: slice.accent, margin: "0 0 24px",
              }}>Açılış</p>
              <p style={{
                fontFamily: "var(--mu-ff-display)", fontSize: 15,
                fontStyle: "italic", color: slice.ink3, lineHeight: 1.6,
                maxWidth: 480, margin: "0 auto",
              }}>
                Kur'an-ı Kerim'in ilk suresi. Namazın her rekatında okunan, 'Açılış' anlamına
                gelen yedi ayetlik bu sure, kulun Rabbiyle konuşmasının özüdür.
              </p>
            </div>

            <div style={{ height: 1, background: slice.line }} />

            {/* Ayahs */}
            {FATIHA_AYAHS.map((ayah) => (
              <div key={ayah.num} style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr",
                gap: 20,
                padding: "24px 0",
                borderBottom: `1px solid ${slice.line}`,
              }}>
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 8, paddingTop: 4,
                }}>
                  <span style={{
                    fontFamily: "var(--mu-ff-mono)", fontSize: 13,
                    color: slice.accent,
                  }}>{ayah.num}</span>
                  <span style={{ color: slice.muted, fontSize: 14 }}>{MuIcons.bookmark}</span>
                  <span style={{ color: slice.muted, fontSize: 14 }}>{MuIcons.play}</span>
                </div>
                <div>
                  <p style={{
                    fontFamily: "var(--mu-ff-ar)", fontSize: 30,
                    lineHeight: 1.9, color: slice.ink2,
                    margin: "0 0 10px", direction: "rtl", textAlign: "right",
                  }}>{ayah.ar}</p>
                  <p style={{
                    fontFamily: "var(--mu-ff-display)", fontSize: 16,
                    lineHeight: 1.55, color: slice.ink3, margin: 0,
                  }}>{ayah.tr}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div style={{
            borderLeft: `1px solid ${slice.line}`,
            padding: "32px 20px",
          }}>
            <p style={{
              fontFamily: "var(--mu-ff-mono)", fontSize: 11,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: slice.muted, margin: "0 0 14px",
            }}>İçindekiler</p>

            {FATIHA_TOC.map((text, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "8px 10px",
                borderRadius: 8, marginBottom: 2,
                background: i === 0 ? `color-mix(in oklab, ${slice.accent}, transparent 85%)` : "transparent",
              }}>
                <span style={{
                  fontFamily: "var(--mu-ff-mono)", fontSize: 11,
                  color: i === 0 ? slice.accent : slice.muted,
                  fontWeight: i === 0 ? 600 : 400,
                  minWidth: 18,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: "var(--mu-ff-display)", fontSize: 13,
                  lineHeight: 1.4,
                  color: i === 0 ? slice.ink : slice.ink3,
                }}>
                  {text}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 24 }}>
              <p style={{
                fontFamily: "var(--mu-ff-mono)", fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: slice.muted, margin: "0 0 12px",
              }}>Yazı Tipi</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: slice.muted, fontSize: 16 }}>-</span>
                <span style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${slice.line}`,
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--mu-ff-ar)", fontSize: 18,
                  color: slice.ink,
                }}>ع</span>
                <span style={{ color: slice.muted, fontSize: 16 }}>+</span>
                <span style={{ fontFamily: "var(--mu-ff-mono)", fontSize: 12, color: slice.muted }}>31px</span>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <p style={{
                fontFamily: "var(--mu-ff-mono)", fontSize: 11,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: slice.muted, margin: "0 0 10px",
              }}>İmler</p>
              <p style={{
                fontFamily: "var(--mu-ff-display)", fontSize: 13,
                color: slice.muted, lineHeight: 1.5, margin: 0,
              }}>
                Ayet yanındaki işaretçiyle yer imi ekleyin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
        background: `linear-gradient(to bottom, transparent, ${slice.bg})`,
        pointerEvents: "none",
      }} />
    </div>
  );
}

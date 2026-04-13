/**
 * Mushaf sayfa çerçevesi — fiziksel kitap hissi veren dekoratif bordür.
 * Kremsi kağıt arka planı, çift bordür, hafif gölge ve iç kenar karartması.
 */

interface MushafFrameProps {
  children: React.ReactNode;
}

export function MushafFrame({ children }: MushafFrameProps) {
  return (
    <div className="mx-auto max-w-3xl px-1 py-4 sm:px-4 sm:py-8">
      {/* Kağıt kartı */}
      <div
        className="relative rounded-sm"
        style={{
          backgroundColor: "var(--mushaf-bg, #f8f4ec)",
          boxShadow: `
            0 1px 3px var(--mushaf-shadow, rgba(0,0,0,0.06)),
            0 6px 16px var(--mushaf-shadow, rgba(0,0,0,0.06)),
            0 20px 40px var(--mushaf-shadow, rgba(0,0,0,0.06))
          `,
        }}
      >
        {/* Dış çerçeve */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            border: "1.5px solid var(--mushaf-border, rgba(0,0,0,0.1))",
          }}
        />

        {/* İç çerçeve — çift kenarlık efekti */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: "6px",
            border: "0.5px solid var(--mushaf-border, rgba(0,0,0,0.1))",
            opacity: 0.6,
          }}
        />

        {/* Kenar karartması — fiziksel kağıt gölgesi */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `
              inset 0 0 30px var(--mushaf-inner-shadow, rgba(0,0,0,0.03)),
              inset 0 0 60px var(--mushaf-inner-shadow, rgba(0,0,0,0.03))
            `,
          }}
        />

        {/* Üst accent çizgi */}
        <div
          className="absolute top-[6px] left-[16px] right-[16px] h-[0.5px] pointer-events-none"
          style={{
            background: "var(--frame-color, var(--color-accent))",
            opacity: "var(--frame-opacity, 0.15)",
          }}
        />

        {/* Alt accent çizgi */}
        <div
          className="absolute bottom-[6px] left-[16px] right-[16px] h-[0.5px] pointer-events-none"
          style={{
            background: "var(--frame-color, var(--color-accent))",
            opacity: "var(--frame-opacity, 0.15)",
          }}
        />

        {/* İçerik */}
        <div className="relative px-3 py-4 sm:px-7 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

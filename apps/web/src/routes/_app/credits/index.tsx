import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/credits/")({
  component: CreditsPage,
});

const TRANSLATION_CREDITS = [
  {
    name: "Diyanet İşleri Başkanlığı Meali",
    author: "Diyanet İşleri Başkanlığı",
    description: "Türkiye Cumhuriyeti Diyanet İşleri Başkanlığı tarafından hazırlanan resmi Kur'an-ı Kerim meali.",
    source: "quran.com API",
    url: "https://quran.com",
  },
  {
    name: "Ömer Çelik Meali",
    author: "Prof. Dr. Ömer Çelik",
    description: "Akademik titizlikle hazırlanmış, anlaşılır Türkçesiyle öne çıkan meal çalışması.",
    source: "kuranvemeali.com",
    url: "https://www.kuranvemeali.com",
  },
  {
    name: "Ömer Nasuhi Bilmen Meali",
    author: "Ömer Nasuhi Bilmen",
    description: "Cumhuriyet döneminin ilk Diyanet İşleri Başkanlarından Ömer Nasuhi Bilmen'in klasik meal çalışması.",
    source: "kuranayetleri.net",
    url: "https://kuranayetleri.net",
  },
  {
    name: "Ali Fikri Yavuz Meali",
    author: "Ali Fikri Yavuz",
    description: "Sade ve akıcı Türkçesiyle bilinen, geniş okuyucu kitlesine ulaşmış meal çalışması.",
    source: "kuranayetleri.net",
    url: "https://kuranayetleri.net",
  },
] as const;

const DATA_CREDITS = [
  {
    name: "Quran.com API",
    description: "Ayet metinleri, kelime kelime veriler, transliterasyon ve Diyanet meali için kullanılan açık API.",
    url: "https://quran.com",
  },
  {
    name: "Kuran Meali Ebook Oluşturucu",
    description: "Ali Fikri Yavuz ve Ömer Nasuhi Bilmen meallerinin JSON formatındaki kaynağı.",
    url: "https://github.com/alialparslan/Kuran-Meali-Ebook-Olusturucu",
    author: "alialparslan",
  },
] as const;

const FONT_CREDITS = [
  {
    name: "KFGQPC Uthmani Hafs",
    description: "King Fahd Glorious Quran Printing Complex tarafından geliştirilen Mushaf yazı tipi.",
    url: "https://fonts.qurancomplex.gov.sa",
  },
  {
    name: "Google Fonts",
    description: "Scheherazade New, Amiri, Noto Naskh Arabic, Rubik, Zain, Reem Kufi ve Playpen Sans Arabic yazı tipleri.",
    url: "https://fonts.google.com",
  },
] as const;

function CreditsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-[var(--theme-text)]">
        Katkıda Bulunanlar
      </h1>
      <p className="mb-10 text-sm text-[var(--theme-text-tertiary)]">
        Bu uygulamayı mümkün kılan kişi ve kaynaklar
      </p>

      {/* Translations */}
      <CreditsSection title="Meal Kaynakları">
        <div className="space-y-4">
          {TRANSLATION_CREDITS.map((t) => (
            <CreditCard
              key={t.name}
              name={t.name}
              author={t.author}
              description={t.description}
              source={t.source}
              url={t.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Data sources */}
      <CreditsSection title="Veri Kaynakları">
        <div className="space-y-4">
          {DATA_CREDITS.map((d) => (
            <CreditCard
              key={d.name}
              name={d.name}
              author={"author" in d ? d.author : undefined}
              description={d.description}
              url={d.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Fonts */}
      <CreditsSection title="Yazı Tipleri">
        <div className="space-y-4">
          {FONT_CREDITS.map((f) => (
            <CreditCard
              key={f.name}
              name={f.name}
              description={f.description}
              url={f.url}
            />
          ))}
        </div>
      </CreditsSection>

      {/* Disclaimer */}
      <div className="mb-10 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        <p className="text-[13px] leading-relaxed text-[var(--theme-text-tertiary)]">
          Meal metinleri, ilgili yazarlarına ve yayıncılarına aittir. Bu uygulama, Kur'an-ı Kerim'e erişimi kolaylaştırmak amacıyla bu kaynakları bir araya getirmektedir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://github.com/theilgaz/mahfuz/issues/new?template=copyright.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 py-2 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Telif Hakkı Bildirimi
          </a>
          <a
            href="https://github.com/theilgaz/mahfuz/issues/new?template=copyright-en.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--theme-border)] px-3 py-2 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Copyright Notice (EN)
          </a>
        </div>
      </div>
    </div>
  );
}

function CreditsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--theme-text-tertiary)]">
        {title}
      </h2>
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        {children}
      </div>
    </section>
  );
}

function CreditCard({ name, author, description, source, url }: {
  name: string;
  author?: string;
  description: string;
  source?: string;
  url: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-primary-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--theme-text)]">{name}</span>
          {source && (
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              {source}
            </span>
          )}
        </div>
        {author && (
          <span className="text-[12px] text-[var(--theme-text-secondary)]">{author}</span>
        )}
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {description}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          {new URL(url).hostname}
        </a>
      </div>
    </div>
  );
}

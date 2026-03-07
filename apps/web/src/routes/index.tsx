import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Apple-style top promo banner */}
      <div className="bg-[#1d1d1f] px-4 py-2.5 text-center text-[13px] text-[#f5f5f7]">
        <span className="text-[#86868b]">Eşsiz Yaratıcının izniyle</span>
      </div>

      {/* Header — Apple.com nav style */}
      <header className="glass sticky top-0 z-20 border-b border-black/[0.06] px-6 py-3">
        <div className="mx-auto flex max-w-[980px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/mahfuz-logo.svg" alt="Mahfuz" className="logo-invert h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-1">
            {session ? (
              <Link
                to="/surah"
                className="rounded-full bg-primary-600 px-5 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
              >
                Uygulamaya Git
              </Link>
            ) : (
              <>
                <Link
                  to="/surah"
                  className="hidden rounded-full px-4 py-1.5 text-xs font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.04] sm:block"
                >
                  Okumaya Başla
                </Link>
                <Link
                  to="/auth/login"
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-[#1d1d1f] transition-colors hover:bg-black/[0.04]"
                >
                  Giriş
                </Link>
                <Link
                  to="/auth/register"
                  className="ml-1 rounded-full bg-primary-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero — Apple product page style */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white px-6 pb-24 pt-20 sm:pt-28">
          <div className="mx-auto max-w-[980px] text-center">
            {/* Product name */}
            <div className="animate-fade-in">
              <h1 className="mb-1 text-[56px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#1d1d1f] sm:text-[72px]">
                Mahfuz
              </h1>
              <p className="mb-10 text-xl font-medium tracking-[-0.01em] text-[#6e6e73] sm:text-2xl">
                Kuran-ı Kerim ile yolculuğunuza başlayın.
              </p>
            </div>

            {/* CTAs — Apple pill buttons */}
            <div className="animate-fade-in mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/surah"
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-3 text-[17px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
              >
                Okumaya Başla
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/memorize"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-[17px] font-medium text-primary-600 transition-all hover:bg-primary-50 active:scale-[0.97]"
              >
                Ezbere Başla
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>

            {/* Hero verse — dramatic centerpiece */}
            <div className="animate-slide-up mx-auto max-w-2xl">
              <p
                className="arabic-text mb-6 text-[2.5rem] leading-[2.2] text-[#1d1d1f] sm:text-[3rem]"
                dir="rtl"
              >
                إِنَّا نَحْنُ نَزَّلْنَا ٱلذِّكْرَ وَإِنَّا لَهُۥ لَحَـٰفِظُونَ
              </p>
              <p className="text-sm text-[#86868b]">
                <span className="font-medium text-[#6e6e73]">Hicr 15:9</span>
                {" — "}
                "Hiç şüphesiz Kur'an'ı biz indirdik, onu koruyacak olan da biziz."
              </p>
            </div>
          </div>
        </section>

        {/* Features — Apple feature grid */}
        <section className="bg-[#f5f5f7] px-6 py-20">
          <div className="mx-auto max-w-[980px]">
            <h2 className="mb-1 text-center text-[32px] font-semibold tracking-[-0.025em] text-[#1d1d1f] sm:text-[40px]">
              Her şey tek yerde.
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-center text-lg text-[#6e6e73]">
              Okuyun, dinleyin, ezberleyin ve anlayın. Kelime kelime takip, akıllı
              tekrar ve ilerleme sistemi ile.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <FeatureCard
                icon={<BookSvg />}
                title="Okuma"
                description="Sure, sayfa ve cüz görünümleri. Kelime kelime Türkçe meal."
                gradient="from-primary-500 to-primary-700"
              />
              <FeatureCard
                icon={<HeadphonesSvg />}
                title="Dinleme"
                description="60+ kariden kelime bazlı takipli dinleme ve tekrar modu."
                gradient="from-gold-500 to-gold-700"
              />
              <FeatureCard
                icon={<BrainSvg />}
                title="Ezberleme"
                description="SM-2 akıllı tekrar algoritması ile hafızlık desteği."
                gradient="from-primary-600 to-primary-800"
              />
              <FeatureCard
                icon={<ChartSvg />}
                title="İlerleme"
                description="XP, streak, rozetler ve hatim sayacı ile motivasyon."
                gradient="from-gold-500 to-gold-600"
              />
            </div>
          </div>
        </section>

        {/* Stats — Apple-style large numbers */}
        <section className="bg-white px-6 py-20">
          <div className="mx-auto grid max-w-[800px] grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat value="114" label="Sure" />
            <Stat value="6.236" label="Ayet" />
            <Stat value="30" label="Cüz" />
            <Stat value="604" label="Sayfa" />
          </div>
        </section>
      </main>

      {/* Footer — Apple minimal footer */}
      <footer className="border-t border-[#d2d2d7] bg-[#f5f5f7] px-6 py-5">
        <div className="mx-auto flex max-w-[980px] flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src="/images/mahfuz-logo.svg" alt="Mahfuz" className="logo-invert h-6 w-auto" />
            <span className="text-xs text-[#86868b]">Açık kaynak Kuran-ı Kerim uygulaması</span>
          </div>
          <a
            href="https://github.com/theilgaz/mahfuz"
            className="text-xs text-[#424245] underline-offset-2 transition-colors hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group overflow-hidden rounded-[20px] bg-white p-8 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-3 text-white`}>
        {icon}
      </div>
      <h3 className="mb-1.5 text-lg font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
      <p className="text-[15px] leading-relaxed text-[#6e6e73]">{description}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[48px] font-semibold leading-none tracking-tight text-[#1d1d1f] tabular-nums">{value}</p>
      <p className="mt-2 text-sm font-medium text-[#86868b]">{label}</p>
    </div>
  );
}

function BookSvg() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function HeadphonesSvg() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}
function BrainSvg() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  );
}
function ChartSvg() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

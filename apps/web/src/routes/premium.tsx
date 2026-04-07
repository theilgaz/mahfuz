/**
 * Premium — plan karşılaştırma, fiyatlandırma, yükseltme.
 */

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/premium")({
  component: PremiumPage,
});

interface Plan {
  id: "free" | "plus" | "family";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Ücretsiz",
    price: "₺0",
    period: "Sonsuza",
    description: "Temel Kuran okuma deneyimi",
    features: [
      "✓ Tüm sureleri oku",
      "✓ 1 meal (Diyanet)",
      "✓ Sesli kıraat (Mishary)",
      "✓ 3 oyun",
      "✓ Elifba öğren",
      "✗ Hatim grubu",
      "✗ Tecvid puanlama",
      "✗ Ayet tahlili",
      "✗ Meal karşılaştırma",
    ],
    cta: "Mevcut Plan",
    highlighted: false,
  },
  {
    id: "plus",
    name: "Plus",
    price: "₺49",
    period: "ay",
    description: "Tam öğrenme deneyimi",
    features: [
      "✓ Her şey dahil",
      "✓ 6 Türk & Arap kari",
      "✓ Tüm mealler (10+)",
      "✓ 12 oyun",
      "✓ Hatim grubu",
      "✓ Tecvid puanlama",
      "✓ Ayet tahlili (tam)",
      "✓ AI asistan",
      "✓ Çevrimdışı ses",
    ],
    cta: "Plus'a Yükselt",
    highlighted: true,
  },
  {
    id: "family",
    name: "Aile",
    price: "₺89",
    period: "ay",
    description: "5 kişiye kadar aile paylaşımı",
    features: [
      "✓ Plus'ın her şeyi",
      "✓ 5 kullanıcı profili",
      "✓ Çocuk modu",
      "✓ Ebeveyn takibi",
      "✓ Aile hatim grubu",
    ],
    cta: "Aile Planı Al",
    highlighted: false,
  },
];

function PremiumPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">✨</div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">İkra Plus</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-sm mx-auto">
          Kuran öğrenme yolculuğunuzu derinleştirin. İptal istediğiniz zaman.
        </p>
      </div>

      {/* Planlar */}
      <div className="space-y-3 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`px-5 py-4 rounded-2xl border transition-all ${
              plan.highlighted
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-sm"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
          >
            {plan.highlighted && (
              <div className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-2">
                Önerilen
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-lg text-[var(--color-text-primary)]">{plan.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${plan.highlighted ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                  {plan.price}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">/ {plan.period}</p>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              {plan.features.map((f) => (
                <p
                  key={f}
                  className={`text-xs ${f.startsWith("✓") ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] opacity-60"}`}
                >
                  {f}
                </p>
              ))}
            </div>

            <button
              disabled={plan.id === "free"}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                plan.id === "free"
                  ? "border border-[var(--color-border)] text-[var(--color-text-secondary)] cursor-default"
                  : plan.highlighted
                  ? "bg-[var(--color-accent)] text-white hover:opacity-90"
                  : "border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Güven işaretleri */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: "🔒", text: "Güvenli ödeme" },
          { icon: "🔄", text: "İstediğinde iptal" },
          { icon: "📱", text: "Tüm cihazlar" },
        ].map((item) => (
          <div key={item.text} className="text-center px-2 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="text-xl mb-1">{item.icon}</div>
            <p className="text-[10px] text-[var(--color-text-secondary)] font-medium">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Yakında */}
      <div className="px-4 py-3 rounded-xl border border-dashed border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Ödeme sistemi entegrasyonu devam ediyor. Şimdilik tüm özellikler ücretsiz!
        </p>
      </div>
    </div>
  );
}

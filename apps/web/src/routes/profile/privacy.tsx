/**
 * Profil → Gizlilik — skor tablosu ve şampiyonlar gibi herkese açık alanlarda
 * adın nasıl görüneceğini seç (tam ad / baş harfler / anonim).
 */

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type DisplayNameMode,
  formatDisplayName,
  getMyDisplayNameMode,
  setDisplayNameMode,
} from "~/lib/display-name";
import { useTranslation } from "~/hooks/useTranslation";
import { staticHead } from "~/lib/seo";
import { MuIcons } from "~/components/minimal-ui/icons";

export const Route = createFileRoute("/profile/privacy")({
  head: () => staticHead("profile-privacy"),
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/auth/login", search: { redirect: "/profile/privacy" } });
    }
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const { session } = Route.useRouteContext();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const user = session!.user;

  const { data: serverMode } = useQuery({
    queryKey: ["my-display-name-mode"],
    queryFn: () => getMyDisplayNameMode(),
    staleTime: 60_000,
  });

  const [pending, setPending] = useState<DisplayNameMode | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const mode: DisplayNameMode = pending ?? serverMode ?? "full";

  const mutation = useMutation({
    mutationFn: (next: DisplayNameMode) => setDisplayNameMode({ data: next }),
    onMutate: (next) => {
      setPending(next);
      setStatus("idle");
    },
    onSuccess: () => {
      setStatus("saved");
      qc.invalidateQueries({ queryKey: ["my-display-name-mode"] });
      qc.invalidateQueries({ queryKey: ["global-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["game-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["recent-meclises"] });
    },
    onError: () => {
      setStatus("error");
      setPending(null);
    },
  });

  const options: { id: DisplayNameMode; label: string; desc: string }[] = [
    {
      id: "full",
      label: t.profile?.privacyOptionFull ?? "Tam adım",
      desc: t.profile?.privacyOptionFullDesc ?? "Hesabındaki ad ve soyadın açık gösterilir.",
    },
    {
      id: "initials",
      label: t.profile?.privacyOptionInitials ?? "Baş harflerim",
      desc: t.profile?.privacyOptionInitialsDesc ?? "Sadece adının ve soyadının baş harfleri görünür.",
    },
    {
      id: "anonymous",
      label: t.profile?.privacyOptionAnonymous ?? "Anonim",
      desc: t.profile?.privacyOptionAnonymousDesc ?? "Adın hiç görünmez, sana özel bir takma ad atanır.",
    },
  ];

  return (
    <div className="mu-home mu-account">
      <Link
        to="/profile"
        className="mu-muted"
        style={{ fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <span aria-hidden="true">{MuIcons.back}</span>
        {t.profile?.title ?? "Profil"}
      </Link>

      <section style={{ paddingTop: 24, paddingBottom: 24 }}>
        <p className="mu-eyebrow">
          <span className="mu-eb-line" />
          {t.profile?.privacy ?? "Gizlilik"}
        </p>
        <h1 className="mu-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 8 }}>
          {t.profile?.privacyTitle ?? "Skor tablosunda görünüm"}
        </h1>
        <p className="mu-lede" style={{ fontSize: 15, marginBottom: 0 }}>
          {t.profile?.privacyLede ??
            "Liderlik tablosu, şampiyonlar ve son meclisler gibi herkese açık alanlarda adının nasıl görüneceğini seç."}
        </p>
      </section>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map((opt) => {
          const selected = mode === opt.id;
          const preview = formatDisplayName(user.name, opt.id, user.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  if (selected || mutation.isPending) return;
                  mutation.mutate(opt.id);
                }}
                disabled={mutation.isPending && pending !== opt.id}
                aria-pressed={selected}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "var(--mu-bg-card)",
                  border: `1px solid ${selected ? "var(--mu-accent)" : "var(--mu-line)"}`,
                  borderRadius: 16,
                  padding: "16px 18px",
                  cursor: mutation.isPending && pending !== opt.id ? "default" : "pointer",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "start",
                  gap: 12,
                  transition: "border-color var(--mu-dur-1) var(--mu-ease)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--mu-ff-display)", fontWeight: 500, fontSize: 16 }}>{opt.label}</div>
                  <div className="mu-muted" style={{ fontSize: 13, marginTop: 4 }}>{opt.desc}</div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span className="mu-muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {t.profile?.privacyPreview ?? "Önizleme"}
                    </span>
                    <span style={{ fontFamily: "var(--mu-ff-mono)", color: "var(--mu-ink)" }}>{preview}</span>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 99,
                    border: `2px solid ${selected ? "var(--mu-accent)" : "var(--mu-line)"}`,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {selected && (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 99,
                        background: "var(--mu-accent)",
                      }}
                    />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div role="status" aria-live="polite" style={{ marginTop: 14, fontSize: 12.5, minHeight: 18 }}>
        {mutation.isPending && (
          <span className="mu-muted">{t.profile?.privacySaving ?? "Kaydediliyor…"}</span>
        )}
        {!mutation.isPending && status === "saved" && (
          <span style={{ color: "var(--mu-accent-ink)" }}>{t.profile?.privacySaved ?? "Kaydedildi"}</span>
        )}
        {!mutation.isPending && status === "error" && (
          <span style={{ color: "var(--mu-danger, #c0392b)" }}>
            {t.profile?.privacyError ?? "Kaydedilemedi, tekrar dener misin?"}
          </span>
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore, useActiveKidsProfile } from "~/stores/useKidsStore";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { AvatarDisplay } from "~/components/kids/AvatarDisplay";
import { BASE_AVATARS, KIDS_LEVELS } from "~/lib/kids-constants";
import type { KidsProfile as KidsProfileType } from "~/stores/useKidsStore";

export const Route = createFileRoute("/kids/profile")({
  component: KidsProfilePage,
});

function KidsProfilePage() {
  const profile = useActiveKidsProfile();

  if (!profile) {
    return <ProfileSelector />;
  }

  return <ActiveProfile />;
}

// ── Active Profile View ──────────────────────────────────────────

function ActiveProfile() {
  const { t } = useTranslation();
  const profile = useActiveKidsProfile()!;
  const level = useKidsStore((s) => s.level);
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);
  const streak = useKidsStore((s) => s.streak);
  const completedLetterCount = useKidsProgressStore((s) => s.completedLetterCount);
  const completedSurahCount = useKidsProgressStore((s) => s.completedSurahCount);

  const [showManage, setShowManage] = useState(false);

  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  if (showManage) {
    return <ProfileManager onClose={() => setShowManage(false)} />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Avatar + Name */}
      <div className="mb-6 flex flex-col items-center">
        <AvatarDisplay name={profile.name} avatarId={profile.avatarId} level={level} size="lg" />
        <h1 className="mt-3 text-xl font-bold text-emerald-800">{profile.name}</h1>
        <p className="text-sm text-emerald-500">
          {t.kids.levels[currentLevel.key as keyof typeof t.kids.levels]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label={t.kids.rewards.stars} value={String(stars)} icon="⭐" color="bg-amber-50 text-amber-700" />
        <StatCard label={t.kids.rewards.gems} value={String(gems)} icon="💎" color="bg-indigo-50 text-indigo-700" />
        <StatCard label={t.kids.parent.lettersLearned} value={String(completedLetterCount())} icon="🔤" color="bg-blue-50 text-blue-700" />
        <StatCard label={t.kids.parent.surahsMemorized} value={String(completedSurahCount())} icon="📖" color="bg-purple-50 text-purple-700" />
        <StatCard label={t.kids.streak.current} value={String(streak)} icon="🔥" color="bg-orange-50 text-orange-700" />
        <StatCard label={t.kids.rewards.level} value={String(level)} icon="" color="bg-emerald-50 text-emerald-700" />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          to="/kids/avatar"
          className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm active:scale-[0.98]"
        >
          <span className="text-[15px] font-semibold text-indigo-600">{t.kids.nav.avatar}</span>
          <ChevronRight />
        </Link>

        <button
          onClick={() => setShowManage(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm active:scale-[0.98]"
        >
          <span className="text-[15px] font-semibold text-gray-600">{t.kids.profile.manageProfiles}</span>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${color}`}>
      <div className="text-lg font-bold">{icon} {value}</div>
      <div className="text-[12px]">{label}</div>
    </div>
  );
}

// ── Profile Manager (edit, delete, switch, add) ──────────────────

function ProfileManager({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const profiles = useKidsStore((s) => s.profiles);
  const activeProfileId = useKidsStore((s) => s.activeProfileId);
  const setActiveProfile = useKidsStore((s) => s.setActiveProfile);
  const updateProfile = useKidsStore((s) => s.updateProfile);
  const removeProfile = useKidsStore((s) => s.removeProfile);
  const addProfile = useKidsStore((s) => s.addProfile);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleStartEdit = (p: KidsProfileType) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateProfile(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
    }
  };

  const handleConfirmDelete = (id: string) => {
    removeProfile(id);
    setDeletingId(null);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
        >
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t.kids.profile.manageProfiles}</h1>
      </div>

      {/* Profile list */}
      <div className="space-y-3">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const isEditing = editingId === p.id;
          const isDeleting = deletingId === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-2xl bg-white p-4 shadow-sm ${isActive ? "ring-2 ring-emerald-300" : ""}`}
            >
              {/* Delete confirmation */}
              {isDeleting ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{t.kids.profile.confirmDelete}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500"
                    >
                      {t.kids.common.back}
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(p.id)}
                      className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white"
                    >
                      {t.kids.profile.deleteProfile}
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                /* Edit mode */
                <div className="space-y-3">
                  <label className="block text-[13px] font-semibold text-gray-500">{t.kids.profile.editName}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                      className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {t.kids.profile.save}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal display */
                <div className="flex items-center gap-3">
                  <AvatarDisplay name={p.name} avatarId={p.avatarId} level={1} size="sm" />
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-gray-800">{p.name}</div>
                    <div className="text-[12px] text-gray-400">{p.ageGroup === "small" ? "4-7" : "8-12"}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Switch */}
                    {!isActive && (
                      <button
                        onClick={() => setActiveProfile(p)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-600 active:scale-95"
                      >
                        {t.kids.profile.switchProfile}
                      </button>
                    )}
                    {isActive && (
                      <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-[12px] font-bold text-emerald-700">
                        ✓
                      </span>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 active:scale-95"
                      title={t.kids.profile.editProfile}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-400 active:scale-95"
                      title={t.kids.profile.deleteProfile}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add child */}
      {showAddForm ? (
        <AddChildForm
          onSave={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-4 text-[15px] font-bold text-emerald-600 active:scale-95"
        >
          + {t.kids.profile.addChild}
        </button>
      )}
    </div>
  );
}

// ── Profile Selector (first-time / no active profile) ────────────

function ProfileSelector() {
  const { t } = useTranslation();
  const profiles = useKidsStore((s) => s.profiles);
  const setActiveProfile = useKidsStore((s) => s.setActiveProfile);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 text-center text-2xl font-bold text-emerald-700">
        {t.kids.profile.title}
      </h1>
      {profiles.length === 0 && (
        <p className="mb-6 text-center text-sm text-gray-400">{t.kids.profile.noProfiles}</p>
      )}

      {/* Existing profiles */}
      {profiles.length > 0 && (
        <div className="mb-6 space-y-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.97]"
            >
              <AvatarDisplay name={p.name} avatarId={p.avatarId} level={1} size="sm" />
              <div className="text-left">
                <div className="text-[15px] font-semibold text-gray-800">{p.name}</div>
                <div className="text-[12px] text-gray-400">{p.ageGroup === "small" ? "4-7" : "8-12"}</div>
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
      )}

      {/* Add child */}
      {showForm ? (
        <AddChildForm
          onSave={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-5 text-[15px] font-bold text-emerald-600 active:scale-95"
        >
          + {t.kids.profile.addChild}
        </button>
      )}

      {/* Back to main app */}
      <Link
        to="/browse"
        className="mt-6 block text-center text-sm font-medium text-gray-400"
      >
        {t.kids.nav.backToApp}
      </Link>
    </div>
  );
}

// ── Add Child Form ───────────────────────────────────────────────

function AddChildForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const addProfile = useKidsStore((s) => s.addProfile);
  const setActiveProfile = useKidsStore((s) => s.setActiveProfile);

  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(2018);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(BASE_AVATARS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const profile: KidsProfileType = {
      id: crypto.randomUUID(),
      name: name.trim(),
      birthYear,
      avatarId: selectedAvatar,
      ageGroup: new Date().getFullYear() - birthYear <= 7 ? "small" : "big",
    };
    addProfile(profile);
    setActiveProfile(profile);
    onSave();
  };

  return (
    <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-emerald-700">{t.kids.profile.addChild}</h2>

      <label className="mb-1 block text-[13px] font-semibold text-gray-600">
        {t.kids.profile.name}
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        autoFocus
      />

      <label className="mb-1 block text-[13px] font-semibold text-gray-600">
        {t.kids.profile.birthYear}
      </label>
      <input
        type="number"
        value={birthYear}
        onChange={(e) => setBirthYear(Number(e.target.value))}
        min={2010}
        max={2024}
        className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />

      <label className="mb-2 block text-[13px] font-semibold text-gray-600">
        {t.kids.profile.selectAvatar}
      </label>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {BASE_AVATARS.map((av) => (
          <button
            key={av}
            onClick={() => setSelectedAvatar(av)}
            className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl transition-transform active:scale-90 ${
              selectedAvatar === av
                ? "ring-2 ring-emerald-400 bg-emerald-200"
                : "bg-gray-100"
            }`}
          >
            {av.replace("avatar-", "")}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          {t.kids.profile.save}
        </button>
      </div>
    </div>
  );
}

// ── Shared Icons ─────────────────────────────────────────────────

function ChevronRight() {
  return (
    <svg className="ml-auto h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

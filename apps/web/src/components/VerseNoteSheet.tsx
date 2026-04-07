/**
 * Ayet Notu — bir ayet için kişisel not ekleme/düzenleme sheet'i.
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveVerseNote, getVerseNote, deleteVerseNote } from "~/lib/verse-notes-service";

interface Props {
  verseKey: string;
  verseText: string;
  onClose: () => void;
}

export function VerseNoteSheet({ verseKey, verseText, onClose }: Props) {
  const qc = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: existingNote, isLoading } = useQuery({
    queryKey: ["verse-note", verseKey],
    queryFn: () => getVerseNote({ data: verseKey }),
  });

  useEffect(() => {
    if (existingNote?.content) setContent(existingNote.content);
  }, [existingNote]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => saveVerseNote({ data: { verseKey, content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verse-note", verseKey] });
      qc.invalidateQueries({ queryKey: ["verse-notes"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVerseNote({ data: existingNote!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verse-note", verseKey] });
      qc.invalidateQueries({ queryKey: ["verse-notes"] });
      onClose();
    },
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 max-w-xl mx-auto bg-[var(--color-bg)] border-t border-[var(--color-border)] rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
        </div>

        <div className="px-4 pb-4">
          {/* Başlık */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Ayet Notu — {verseKey}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Ayet önizleme */}
          <div className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] mb-3">
            <p
              className="text-sm text-right text-[var(--color-text-secondary)] leading-relaxed line-clamp-2"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              {verseText}
            </p>
          </div>

          {/* Not alanı */}
          {isLoading ? (
            <div className="h-24 rounded-xl bg-[var(--color-surface)] animate-pulse" />
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bu ayet hakkında notlarınızı yazın..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 resize-none"
            />
          )}

          {/* Aksiyonlar */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!content.trim() || saveMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {saved ? "Kaydedildi ✓" : saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {existingNote && (
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

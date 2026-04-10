/**
 * Notlarım — tüm ayet notlarını listeler.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getMyVerseNotes, deleteVerseNote } from "~/lib/verse-notes-service";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["verse-notes"],
    queryFn: () => getMyVerseNotes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVerseNote({ data: id }),
    onMutate: (id) => setDeleting(id),
    onSettled: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["verse-notes"] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Notlarım</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {notes.length > 0 ? `${notes.length} ayet notu` : "Henüz not yok"}
          </p>
        </div>
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-10 h-10 text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">
            Henüz not eklemediniz
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Herhangi bir ayette uzun basın ve "Not" seçeneğine tıklayın
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const [surahId, verseNum] = note.verseKey.split(":").map(Number);
            return (
              <div
                key={note.id}
                className="px-4 py-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    to="/analyse/$verseKey"
                    params={{ verseKey: note.verseKey }}
                    className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    {note.verseKey}
                  </Link>
                  <button
                    onClick={() => deleteMutation.mutate(note.id)}
                    disabled={deleting === note.id}
                    className="p-1 rounded text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-2">
                  {new Date(note.updatedAt).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

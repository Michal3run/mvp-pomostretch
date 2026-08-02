import React, { useState } from "react";

export interface BreakSessionItem {
  id: string;
  user_id: string;
  created_at: string;
  ended_at: string | null;
  input_kind: "quick_pick" | "free_text";
  input_value: string;
  derived_tags: string[];
  selected_exercise_ids: string[];
  completed_count: number;
  skipped_count: number;
  note: string | null;
}

interface HistoryListProps {
  initialSessions: BreakSessionItem[];
}

export default function HistoryList({ initialSessions }: HistoryListProps) {
  const [sessions, setSessions] = useState<BreakSessionItem[]>(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartEdit = (session: BreakSessionItem) => {
    setEditingId(session.id);
    setNoteInput(session.note ?? "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNoteInput("");
  };

  const handleSaveNote = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/session-history/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteInput }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: BreakSessionItem };
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, note: json.data.note } : s)));
        setEditingId(null);
      } else {
        alert("Błąd podczas zapisywania notatki.");
      }
    } catch (_err) {
      alert("Błąd sieciowy.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę przerwę z historii?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/session-history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Błąd podczas usuwania sesji.");
      }
    } catch (_err) {
      alert("Błąd sieciowy.");
    } finally {
      setDeletingId(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-lg text-purple-200">Nie masz jeszcze żadnych przerw w historii.</p>
        <p className="mt-2 text-sm text-purple-300/70">Wróć tu po wykonaniu pierwszej przerwy na rozciąganie!</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500"
        >
          Przejdź do Dashboardu
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const dateStr = new Date(session.created_at).toLocaleString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const isEditing = editingId === session.id;

        return (
          <div
            key={session.id}
            className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg transition hover:border-white/20"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs text-purple-300/60">{dateStr}</span>
                <h3 className="text-lg font-bold text-white">
                  {session.input_value}{" "}
                  <span className="text-xs font-normal text-purple-300/50">({session.input_kind})</span>
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleDelete(session.id);
                  }}
                  disabled={deletingId === session.id}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20"
                >
                  {deletingId === session.id ? "Usuwanie..." : "Usuń"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {session.derived_tags.map((tag) => (
                <span key={tag} className="rounded-full bg-purple-900/50 px-2.5 py-0.5 text-xs text-purple-200">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-purple-200/80">
              <span>Ukończone ćwiczenia: {session.completed_count}</span>
              <span>Pominięte: {session.skipped_count}</span>
            </div>

            <div className="mt-4 border-t border-white/5 pt-3">
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                    }}
                    maxLength={500}
                    placeholder="Dodaj notatkę do tej przerwy (max 500 znaków)..."
                    className="w-full rounded-lg border border-purple-400/30 bg-black/30 p-2.5 text-sm text-white placeholder-purple-300/40 focus:border-purple-400 focus:outline-none"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-lg px-3 py-1 text-xs text-purple-300 hover:text-white"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveNote(session.id);
                      }}
                      disabled={isSaving}
                      className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-500"
                    >
                      {isSaving ? "Zapisywanie..." : "Zapisz"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between text-sm">
                  <p className="text-purple-200/90 italic">{session.note ? `"${session.note}"` : "Brak notatki"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartEdit(session);
                    }}
                    className="ml-2 text-xs text-purple-400 underline hover:text-purple-300"
                  >
                    {session.note ? "Edytuj" : "+ Dodaj notatkę"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";

import type { BreakSession } from "@/lib/sessions/types";
import { NOTE_MAX_LENGTH } from "@/lib/sessions/types";

interface Props {
  initialItems: BreakSession[];
}

interface EditingState {
  id: string;
  draft: string;
  saving: boolean;
  error: string | null;
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatInput = (item: BreakSession): string => {
  if (item.input_kind === "quick_pick") return item.input_value;
  return item.input_value.length > 80 ? `${item.input_value.slice(0, 77)}…` : item.input_value;
};

/**
 * History list — read + update (note) + delete = R, U, D in CRUD.
 * Create happens elsewhere (POST after the break sequence ends; not yet
 * wired because the break flow itself doesn't exist yet).
 */
export function HistoryList({ initialItems }: Props): JSX.Element {
  const [items, setItems] = useState<BreakSession[]>(initialItems);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  const startEdit = useCallback((item: BreakSession) => {
    setEditing({ id: item.id, draft: item.note ?? "", saving: false, error: null });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    if (editing.draft.length > NOTE_MAX_LENGTH) return;

    setEditing({ ...editing, saving: true, error: null });

    try {
      const res = await fetch(`/api/sessions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editing.draft.length === 0 ? null : editing.draft }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `PATCH failed (${res.status.toString()})`);
      }
      const updated = (await res.json()) as BreakSession;
      setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setEditing(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się zapisać.";
      setEditing((curr) => (curr ? { ...curr, saving: false, error: message } : curr));
    }
  }, [editing]);

  const confirmDelete = useCallback(async (id: string) => {
    if (!window.confirm("Usunąć tę przerwę z historii? Tej operacji nie można cofnąć.")) return;

    setDeletingId(id);
    setTopLevelError(null);

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.status !== 204) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `DELETE failed (${res.status.toString()})`);
      }
      setItems((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się usunąć.";
      setTopLevelError(message);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const empty = useMemo(() => items.length === 0, [items.length]);

  if (empty) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-blue-100/70">
        <p className="text-base">Nie masz jeszcze żadnych przerw w historii.</p>
        <p className="mt-2 text-sm text-blue-100/50">
          Wróć tu po pierwszym ukończonym pomodoro — zapiszemy tu każdą Twoją przerwę.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topLevelError && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
          {topLevelError}
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const isEditingThis = editing?.id === item.id;
          const isDeletingThis = deletingId === item.id;

          return (
            <li
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90 shadow-sm"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-blue-100">{formatDateTime(item.created_at)}</p>
                  <p className="text-xs text-blue-100/60">
                    {item.input_kind === "quick_pick" ? "Quick-pick" : "Free-text"}: {formatInput(item)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-100/70">
                  <span title="Ukończone">✔ {item.completed_count}</span>
                  <span title="Pominięte">⤼ {item.skipped_count}</span>
                  <span title="Liczba ćwiczeń">· {item.selected_exercise_ids.length} ćw.</span>
                </div>
              </header>

              {item.derived_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.derived_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-purple-300/30 bg-purple-300/10 px-2 py-0.5 text-xs text-purple-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3">
                {isEditingThis ? (
                  <div>
                    <label htmlFor={`note-${item.id}`} className="mb-1 block text-xs text-blue-100/70">
                      Notatka (max {NOTE_MAX_LENGTH.toString()} znaków)
                    </label>
                    <textarea
                      id={`note-${item.id}`}
                      value={editing.draft}
                      maxLength={NOTE_MAX_LENGTH}
                      onChange={(e) => {
                        setEditing({ ...editing, draft: e.target.value, error: null });
                      }}
                      className="w-full rounded-lg border border-white/15 bg-black/30 p-2 text-sm text-white placeholder:text-white/30 focus:border-purple-300/60 focus:outline-none"
                      rows={3}
                      placeholder="np. „kark dalej boli, ćwiczenie #2 pomogło"
                    />
                    {editing.error && <p className="mt-1 text-xs text-red-200">{editing.error}</p>}
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={editing.saving}
                        className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        Anuluj
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void saveEdit();
                        }}
                        disabled={editing.saving}
                        className="rounded-md bg-purple-500/80 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
                      >
                        {editing.saving ? "Zapisywanie…" : "Zapisz"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-sm text-blue-100/80">
                      {item.note && item.note.length > 0 ? (
                        item.note
                      ) : (
                        <span className="italic text-blue-100/40">Brak notatki</span>
                      )}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          startEdit(item);
                        }}
                        className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/80 transition-colors hover:bg-white/10"
                      >
                        Edytuj notatkę
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingThis}
                        onClick={() => {
                          void confirmDelete(item.id);
                        }}
                        className="rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-100 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {isDeletingThis ? "Usuwanie…" : "Usuń"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default HistoryList;

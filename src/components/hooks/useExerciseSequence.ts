import { useState, useEffect, useCallback, useRef } from "react";
import type { Exercise, BreakInputCookie } from "@/types";
import { saveLastSessionIds, getLastSessionIds } from "@/lib/session-storage";
import { getStoredExerciseState, saveStoredExerciseState, clearStoredExerciseState } from "@/lib/exercise-storage";
import { saveStoredTimer } from "@/lib/timer-storage";
import { selectExercises } from "@/lib/rule-engine";
import { FALLBACK_EXERCISE_CATALOG } from "@/lib/exercise-catalog";

export interface UseExerciseSequenceProps {
  breakInput: BreakInputCookie;
  catalog: Exercise[];
}

export function useExerciseSequence({ breakInput, catalog }: UseExerciseSequenceProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "completed" | "idle_break">("active");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Idle break state
  const [idleEndTime, setIdleEndTime] = useState<number | null>(null);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(0);

  // Session stats
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const storedState = getStoredExerciseState();
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;
    if (storedState && storedState.exerciseIds.length > 0) {
      // Restore in-progress session from localStorage (page reload mid-routine)
      const restored = storedState.exerciseIds
        .map((id) => activeCatalog.find((ex) => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined);
      if (restored.length > 0) {
        setExercises(restored);
        setCurrentIndex(storedState.currentIndex);
        setStatus(storedState.status);
        setCompletedCount(storedState.completedCount);
        setSkippedCount(storedState.skippedCount);
        setIdleEndTime(storedState.idleEndTime);
        if (storedState.status === "active") {
          setSecondsRemaining(
            restored[storedState.currentIndex]?.duration_seconds ??
              (activeCatalog[0] ? activeCatalog[0].duration_seconds : 0),
          );
        }
      } else {
        // Stored IDs no longer match catalog — select fresh exercises
        const selected = selectExercises({
          tags: breakInput.tags,
          lastSessionIds: getLastSessionIds(),
          catalog: activeCatalog,
        });
        setExercises(selected);
        setSecondsRemaining(selected[0]?.duration_seconds ?? 0);
      }
    } else {
      // No stored state — use rule engine to select exercises based on user's pain input
      const selected = selectExercises({
        tags: breakInput.tags,
        lastSessionIds: getLastSessionIds(),
        catalog: activeCatalog,
      });
      setExercises(selected);
      setSecondsRemaining(selected[0]?.duration_seconds ?? 0);
    }
    setIsMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [breakInput, catalog]);

  // Save state to localStorage on change
  useEffect(() => {
    if (!isMounted || exercises.length === 0) return;
    saveStoredExerciseState({
      exerciseIds: exercises.map((ex) => ex.id),
      currentIndex,
      status,
      completedCount,
      skippedCount,
      idleEndTime,
    });
  }, [isMounted, exercises, currentIndex, status, idleEndTime, completedCount, skippedCount]);

  const isCompletedHandledRef = useRef(false);

  const finishSequence = useCallback(
    (finalSelectedExercises: Exercise[], finalCompleted: number, finalSkipped: number) => {
      if (isCompletedHandledRef.current) return;
      isCompletedHandledRef.current = true;

      const ids = finalSelectedExercises.map((ex) => ex.id);
      saveLastSessionIds(ids);

      fetch("/api/session-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_kind: breakInput.kind,
          input_value: breakInput.value || "Przerwa",
          derived_tags: breakInput.tags.length > 0 ? breakInput.tags : ["general"],
          selected_exercise_ids: ids,
          completed_count: finalCompleted,
          skipped_count: finalSkipped,
          ended_at: new Date().toISOString(),
        }),
      }).catch(() => {
        /* ignore error */
      });

      setStatus("completed");
    },
    [breakInput],
  );

  const advanceNext = useCallback(
    (actionStatus: "done" | "skipped") => {
      if (actionStatus === "done") {
        setCompletedCount((prev) => prev + 1);
      } else {
        setSkippedCount((prev) => prev + 1);
      }

      if (currentIndex < exercises.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setSecondsRemaining(exercises[nextIdx]?.duration_seconds ?? 0);
      } else {
        const finalCompleted = actionStatus === "done" ? completedCount + 1 : completedCount;
        const finalSkipped = actionStatus === "skipped" ? skippedCount + 1 : skippedCount;
        finishSequence(exercises, finalCompleted, finalSkipped);
      }
    },
    [currentIndex, exercises, completedCount, skippedCount, finishSequence],
  );

  // Active exercise countdown timer
  useEffect(() => {
    if (status !== "active" || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          advanceNext("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [status, secondsRemaining, advanceNext]);

  // Idle break countdown timer
  useEffect(() => {
    if (!idleEndTime) return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((idleEndTime - now) / 1000));
      setIdleSecondsRemaining(remaining);

      if (remaining <= 0) {
        setIdleEndTime(null);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [idleEndTime]);

  const handleStartIdleBreak = (minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    setIdleEndTime(endTime);
  };

  const handleCancelIdleBreak = () => {
    setIdleEndTime(null);
  };

  const handleResumeWork = () => {
    saveStoredTimer({
      startedAt: Date.now(),
      durationMs: 25 * 60 * 1000,
      extendedMs: 0,
    });
    clearStoredExerciseState();
    fetch("/api/clear-break-cookie", { method: "POST" }).catch(() => {
      /* ignore */
    });
    window.location.assign("/dashboard");
  };

  const handleReturnIdle = () => {
    clearStoredExerciseState();
    fetch("/api/clear-break-cookie", { method: "POST" }).catch(() => {
      /* ignore */
    });
    window.location.assign("/dashboard");
  };

  return {
    exercises,
    currentIndex,
    currentExercise: exercises[currentIndex],
    status,
    secondsRemaining,
    isMounted,
    idleEndTime,
    idleSecondsRemaining,
    completedCount,
    skippedCount,
    advanceNext,
    handleStartIdleBreak,
    handleCancelIdleBreak,
    handleResumeWork,
    handleReturnIdle,
  };
}

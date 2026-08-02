import { useState, useEffect, useCallback, useRef } from "react";
import type { Exercise, BreakInputCookie } from "@/types";
import { selectExercises } from "@/lib/rule-engine";
import { saveStoredTimer } from "@/lib/timer-storage";
import { getLastSessionIds, saveLastSessionIds } from "@/lib/session-storage";
import { Button } from "@/components/ui/button";
import { Check, SkipForward, Play, Home, Clock, Sparkles, AlertCircle, RotateCcw, Coffee, Plus } from "lucide-react";

const BODY_AREA_LABELS: Record<string, string> = {
  eyes: "Oczy",
  neck: "Kark",
  shoulders: "Barki",
  lower_back: "Lędźwie",
  general: "Ogólne",
};

interface ExerciseSequenceProps {
  breakInput: BreakInputCookie;
  catalog: Exercise[];
}

interface ExerciseResult {
  exerciseId: string;
  status: "done" | "skipped";
}

import { FALLBACK_EXERCISE_CATALOG } from "@/lib/exercise-catalog";
import { getStoredExerciseState, saveStoredExerciseState, clearStoredExerciseState } from "@/lib/exercise-storage";

export default function ExerciseSequence({ breakInput, catalog }: ExerciseSequenceProps) {
  const [isMounted, setIsMounted] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;
    return selectExercises({
      tags: breakInput.tags,
      lastSessionIds: getLastSessionIds(),
      catalog: activeCatalog,
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"active" | "completed" | "idle_break">("active");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Idle break state
  const [idleEndTime, setIdleEndTime] = useState<number | null>(null);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(0);

  // Image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  // M5 preparation stats
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [_exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);

  // Restore state from localStorage
  useEffect(() => {
    const storedState = getStoredExerciseState();
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;

    if (storedState && storedState.exerciseIds.length > 0) {
      // Reconstruct exercises array from IDs
      const restoredExercises = storedState.exerciseIds
        .map((id) => activeCatalog.find((ex) => ex.id === id))
        .filter(Boolean) as Exercise[];

      if (restoredExercises.length > 0) {
        setExercises(restoredExercises);
        setCurrentIndex(storedState.currentIndex);
        setStatus(storedState.status);
        setCompletedCount(storedState.completedCount);
        setSkippedCount(storedState.skippedCount);
        setIdleEndTime(storedState.idleEndTime);
        if (storedState.status === "active") {
          setSecondsRemaining(restoredExercises[storedState.currentIndex]?.duration_seconds || 0);
        }
      }
    } else {
      setSecondsRemaining(exercises[0]?.duration_seconds || 0);
    }
    setIsMounted(true);
  }, [catalog, exercises]);

  // Save state to localStorage on change
  useEffect(() => {
    if (!isMounted || exercises.length === 0) return;
    saveStoredExerciseState({
      exerciseIds: exercises.map((ex) => ex.id),
      currentIndex,
      status,
      idleEndTime,
      completedCount,
      skippedCount,
    });
  }, [isMounted, exercises, currentIndex, status, idleEndTime, completedCount, skippedCount]);

  const isCompletedHandledRef = useRef(false);

  const finishSequence = useCallback(
    (finalSelectedExercises: Exercise[]) => {
      if (isCompletedHandledRef.current) return;
      isCompletedHandledRef.current = true;

      const ids = finalSelectedExercises.map((ex) => ex.id);
      saveLastSessionIds(ids);

      fetch("/api/session-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ break_type: breakInput.quickPick || breakInput.freeText }),
      }).catch((_err: unknown) => {
        // Ignore network error
      });

      setStatus("completed");
    },
    [breakInput],
  );

  const advanceNext = useCallback(
    (actionStatus: "done" | "skipped") => {
      const currentEx = exercises[currentIndex] as Exercise | undefined;
      if (currentEx) {
        setExerciseResults((prev) => [...prev, { exerciseId: currentEx.id, status: actionStatus }]);
      }

      if (actionStatus === "done") {
        setCompletedCount((prev) => prev + 1);
      } else {
        setSkippedCount((prev) => prev + 1);
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx < exercises.length) {
        setCurrentIndex(nextIdx);
        setSecondsRemaining(exercises[nextIdx].duration_seconds);
      } else {
        finishSequence(exercises);
      }
    },
    [currentIndex, exercises, finishSequence],
  );

  const handleDone = useCallback(() => {
    advanceNext("done");
  }, [advanceNext]);

  const handleSkip = useCallback(() => {
    advanceNext("skipped");
  }, [advanceNext]);

  // Per-exercise countdown timer using Date.now() to eliminate drift and handle background tabs
  useEffect(() => {
    if (status !== "active" || exercises.length === 0) return;

    const currentEx = exercises[currentIndex] as Exercise | undefined;
    if (!currentEx) return;

    const durationMs = currentEx.duration_seconds * 1000;
    const endTime = Date.now() + durationMs;

    const calculateRemaining = () => {
      const remainingSec = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec === 0) {
        handleDone();
      }
    };

    const interval = setInterval(() => {
      calculateRemaining();
    }, 100);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        calculateRemaining();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, currentIndex, exercises, handleDone]);

  useEffect(() => {
    if (status !== "idle_break" || !idleEndTime) return;

    const calculateRemaining = () => {
      const remainingSec = Math.max(0, Math.ceil((idleEndTime - Date.now()) / 1000));
      setIdleSecondsRemaining(remainingSec);

      if (remainingSec === 0) {
        // play sound
        const audio = new Audio("/chime.mp3");
        audio.play().catch(() => {
          /* ignore */
        });
        window.document.title = "Koniec drzemki!";
        setIdleEndTime(null);
      } else {
        const m = Math.floor(remainingSec / 60);
        const s = remainingSec % 60;
        window.document.title = `(${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}) Odpoczynek`;
      }
    };

    const interval = setInterval(calculateRemaining, 1000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") calculateRemaining();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, idleEndTime]);

  const startIdleBreak = (minutes: number) => {
    setIdleEndTime(Date.now() + minutes * 60 * 1000);
    setIdleSecondsRemaining(minutes * 60);
    setStatus("idle_break");
  };

  const extendIdleBreak = (minutes: number) => {
    setIdleEndTime((prev) => {
      const newTime = prev ? prev + minutes * 60 * 1000 : Date.now() + minutes * 60 * 1000;
      setIdleSecondsRemaining(Math.max(0, Math.ceil((newTime - Date.now()) / 1000)));
      return newTime;
    });
  };

  const handleResumeWork = () => {
    window.document.title = "PomoStretch";
    saveStoredTimer({
      startedAt: Date.now(),
      durationMs: 25 * 60 * 1000,
      extendedMs: 0,
    });
    clearStoredExerciseState();
    fetch("/api/clear-break-cookie", { method: "POST" }).catch(() => {});
    window.location.assign("/dashboard");
  };

  const handleReturnIdle = () => {
    clearStoredExerciseState();
    fetch("/api/clear-break-cookie", { method: "POST" }).catch(() => {});
    window.location.assign("/dashboard");
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isMounted) {
    return (
      <div className="dark mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 shadow-xl backdrop-blur-xl">
        <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-48 w-full animate-pulse rounded-lg bg-white/10" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="dark mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
        <div className="bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Brak dostępnych ćwiczeń</h2>
          <p className="text-muted-foreground text-sm">
            Nie udało się przygotować ćwiczeń. Wybierz ponownie rodzaj przerwy lub wróć do dashboardu.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 pt-2">
          <Button
            onClick={() => {
              window.location.assign("/break-input");
            }}
            size="lg"
            className="w-full gap-2 text-base"
          >
            <RotateCcw size={18} />
            Wybierz inną przerwę
          </Button>
          <Button onClick={handleReturnIdle} variant="outline" size="lg" className="w-full gap-2 text-base">
            <Home size={18} />
            Wróć do ekranu głównego
          </Button>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex] as Exercise | undefined;

  if (status === "completed" || !currentExercise) {
    return (
      <div className="dark mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
          <Sparkles size={32} />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Świetna robota!</h2>
          <p className="text-muted-foreground text-sm">
            Przerwa zakończona. Wykonano {completedCount} z {exercises.length} ćwiczeń
            {skippedCount > 0 ? ` (${skippedCount} pominięte)` : ""}.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 pt-2">
          <h3 className="mb-1 text-center text-lg font-medium">Chwila relaksu przed pracą?</h3>
          <div className="flex w-full gap-2">
            <Button
              onClick={() => {
                startIdleBreak(3);
              }}
              variant="secondary"
              className="flex-1"
            >
              +3 min
            </Button>
            <Button
              onClick={() => {
                startIdleBreak(5);
              }}
              variant="secondary"
              className="flex-1"
            >
              +5 min
            </Button>
            <Button
              onClick={() => {
                startIdleBreak(10);
              }}
              variant="secondary"
              className="flex-1"
            >
              +10 min
            </Button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">LUB</span>
            </div>
          </div>

          <Button onClick={handleResumeWork} size="lg" className="w-full gap-2 text-base">
            <Play size={18} />
            Rozpocznij nową sesję (25 min)
          </Button>
          <Button onClick={handleReturnIdle} variant="outline" size="lg" className="w-full gap-2 text-base">
            <Home size={18} />
            Wróć do ekranu głównego
          </Button>
        </div>
      </div>
    );
  }

  if (status === "idle_break") {
    return (
      <div className="dark mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
        <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
          <Coffee size={32} />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {idleSecondsRemaining === 0 ? "Koniec przerwy!" : "Czas na odpoczynek"}
          </h2>
          <p className="text-muted-foreground text-sm">Oderwij wzrok od ekranu. Wróć do nas, gdy będziesz gotowy.</p>
        </div>

        <div className="my-4 font-mono text-6xl font-bold tracking-tighter tabular-nums">
          {formatSeconds(idleSecondsRemaining)}
        </div>

        <Button
          onClick={() => {
            extendIdleBreak(5);
          }}
          variant="secondary"
          size="sm"
          className="mb-4 gap-2"
        >
          <Plus size={16} />
          Dodaj 5 minut
        </Button>

        <div className="flex w-full flex-col gap-3 pt-2">
          <Button onClick={handleResumeWork} size="lg" className="w-full gap-2 text-base">
            <Play size={18} />
            Rozpocznij nową sesję (25 min)
          </Button>
          <Button onClick={handleReturnIdle} variant="outline" size="lg" className="w-full gap-2 text-base">
            <Home size={18} />
            Wróć do ekranu głównego
          </Button>
        </div>
      </div>
    );
  }

  const totalExercises = exercises.length;
  const progressPercent = ((currentIndex + 1) / totalExercises) * 100;

  return (
    <div className="dark mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
          <span>
            Ćwiczenie {currentIndex + 1} z {totalExercises}
          </span>
          <span>{breakInput.value || "Przerwa"}</span>
        </div>
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Exercise Content */}
      <div className="space-y-3">
        <h2 className="text-foreground text-2xl font-bold tracking-tight">{currentExercise.name}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{currentExercise.description}</p>

        {/* Body Area Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {currentExercise.body_areas.map((area) => (
            <span
              key={area}
              className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium"
            >
              {BODY_AREA_LABELS[area] || area}
            </span>
          ))}
        </div>

        {currentExercise.image && (
          <div className="relative mt-6 flex min-h-48 w-full justify-center">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 animate-pulse rounded-lg bg-white/10" />
              </div>
            )}
            <img
              src={`/${currentExercise.image}`}
              alt={currentExercise.name}
              className={`h-48 max-w-full rounded-lg object-contain transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => {
                setImageLoaded(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Per-Exercise Countdown */}
      <div className="bg-secondary/50 border-border/50 my-2 flex flex-col items-center justify-center rounded-lg border p-6">
        <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
          <Clock size={16} />
          <span>Czas ćwiczenia</span>
        </div>
        <div className="text-foreground font-mono text-5xl font-bold tracking-tight tabular-nums">
          {formatSeconds(secondsRemaining)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full gap-3 pt-2">
        <Button onClick={handleDone} size="lg" className="flex-1 gap-2 text-base">
          <Check size={18} />
          Zrobione
        </Button>
        <Button onClick={handleSkip} variant="outline" size="lg" className="flex-1 gap-2 text-base">
          <SkipForward size={18} />
          Pomiń
        </Button>
      </div>
    </div>
  );
}

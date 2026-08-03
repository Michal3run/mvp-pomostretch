/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from "react";
import type { Exercise, BreakInputCookie } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Check, SkipForward, Play, AlertTriangle } from "lucide-react";
import { saveLastSessionIds } from "@/lib/session-storage";
import { getStoredExerciseState, saveStoredExerciseState, clearStoredExerciseState } from "@/lib/exercise-storage";
import { saveStoredTimer } from "@/lib/timer-storage";

interface ExerciseSequenceProps {
  breakInput: BreakInputCookie;
  catalog: Exercise[];
}

interface ExerciseResult {
  exerciseId: string;
  status: "done" | "skipped";
}

const FALLBACK_EXERCISE_CATALOG: Exercise[] = [
  {
    id: "fb-1",
    name: "Mruganie i rozluźnienie oczu",
    description: "Zamknij oczy na 5 sekund, a następnie mrugaj szybko przez 10 sekund.",
    duration_seconds: 30,
    body_areas: ["eyes"],
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-2",
    name: "Powolne skłony głowy",
    description: "Opuszczaj powoli brodę do klatki piersiowej, a następnie odchylaj w tył.",
    duration_seconds: 45,
    body_areas: ["neck"],
    created_at: new Date().toISOString(),
  },
];

export default function ExerciseSequence({ breakInput, catalog }: ExerciseSequenceProps) {
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;
    return activeCatalog.slice(0, 3);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [status, setStatus] = useState<"active" | "completed" | "idle_break">("active");

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;
    return activeCatalog[0]?.duration_seconds ?? 0;
  });

  const [isMounted, setIsMounted] = useState(false);

  // Idle break state
  const [idleEndTime, setIdleEndTime] = useState<number | null>(null);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(0);

  // Image loading state - adjust state during render when index changes
  const [imageLoaded, setImageLoaded] = useState(false);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (prevIndex !== currentIndex) {
    setPrevIndex(currentIndex);
    setImageLoaded(false);
  }

  // M5 preparation stats
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [_exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const storedState = getStoredExerciseState();
    const activeCatalog = catalog.length > 0 ? catalog : FALLBACK_EXERCISE_CATALOG;
    if (storedState && storedState.exerciseIds.length > 0) {
      const restored = storedState.exerciseIds
        .map((id) => activeCatalog.find((ex) => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined);
      if (restored.length > 0) {
        setExercises(restored);
        setCurrentIndex(storedState.currentIndex ?? 0);
        setStatus(storedState.status ?? "active");
        setCompletedCount(storedState.completedCount ?? 0);
        setSkippedCount(storedState.skippedCount ?? 0);
        setIdleEndTime(storedState.idleEndTime ?? null);
        if (storedState.status === "active") {
          setSecondsRemaining(restored[storedState.currentIndex]?.duration_seconds ?? activeCatalog[0]?.duration_seconds ?? 0);
        }
      }
    } else if (catalog.length > 0 && exercises.length === 0) {
      setExercises(catalog.slice(0, 3));
      setSecondsRemaining(catalog[0]?.duration_seconds ?? 0);
    }
    setIsMounted(true);
  }, [catalog, exercises.length]);

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
    (finalSelectedExercises: Exercise[]) => {
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
          completed_count: completedCount,
          skipped_count: skippedCount,
          ended_at: new Date().toISOString(),
        }),
      }).catch(() => {
        /* ignore error */
      });

      setStatus("completed");
    },
    [breakInput, completedCount, skippedCount],
  );

  const advanceNext = useCallback(
    (actionStatus: "done" | "skipped") => {
      const currentEx = exercises[currentIndex];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (currentEx) {
        setExerciseResults((prev) => [...prev, { exerciseId: currentEx.id, status: actionStatus }]);
      }

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
        finishSequence(exercises);
      }
    },
    [currentIndex, exercises, finishSequence],
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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isMounted) {
    return (
      <Card className="mx-auto w-full max-w-md border-white/10 bg-white/5 text-white backdrop-blur-xl">
        <CardContent className="pt-6 text-center">
          <p className="text-purple-200">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card className="mx-auto w-full max-w-md border-white/10 bg-white/5 text-white backdrop-blur-xl">
        <CardContent className="pt-6 text-center">
          <p className="text-purple-200">Ładowanie ćwiczeń...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === "completed") {
    return (
      <Card className="mx-auto w-full max-w-md border-white/10 bg-white/5 text-white backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-400">Świetna robota!</CardTitle>
          <p className="mt-2 text-sm text-purple-200/80">Ukończyłeś sesję rozciągania.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
            <p className="text-xs text-purple-300/70">Podsumowanie</p>
            <div className="mt-2 flex justify-center gap-6">
              <div>
                <span className="block text-2xl font-bold text-emerald-400">{completedCount}</span>
                <span className="text-xs text-purple-200/60">Ukończono</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-amber-400">{skippedCount}</span>
                <span className="text-xs text-purple-200/60">Pominięto</span>
              </div>
            </div>
          </div>

          {/* Idle Break Section */}
          <div className="rounded-xl border border-white/10 bg-purple-900/20 p-4">
            <h4 className="text-sm font-semibold text-purple-200">Chcesz jeszcze chwilę odpocząć?</h4>
            <p className="mt-1 text-xs text-purple-300/70">Wybierz czas na wolny odpoczynek bez ćwiczeń:</p>

            {idleEndTime && idleSecondsRemaining > 0 ? (
              <div className="mt-3 text-center">
                <span className="font-mono text-3xl font-bold text-purple-200">
                  {formatSeconds(idleSecondsRemaining)}
                </span>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelIdleBreak}
                    className="text-xs text-purple-300 hover:text-white"
                  >
                    Anuluj minutnik
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleStartIdleBreak(3);
                  }}
                  className="border-purple-400/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60"
                >
                  3 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleStartIdleBreak(5);
                  }}
                  className="border-purple-400/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60"
                >
                  5 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleStartIdleBreak(10);
                  }}
                  className="border-purple-400/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60"
                >
                  10 min
                </Button>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleResumeWork}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500"
          >
            <Play className="mr-2 h-4 w-4" /> {"Wróć do pracy (Nowe Pomodoro)"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleReturnIdle}
            className="w-full text-purple-300/80 hover:bg-white/5 hover:text-white"
          >
            Wróć do Dashboardu bez uruchamiania timera
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentExercise = exercises[currentIndex];

  return (
    <Card className="mx-auto w-full max-w-lg border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <span className="text-xs font-semibold tracking-wider text-purple-300/70 uppercase">
            Ćwiczenie {currentIndex + 1} z {exercises.length}
          </span>
          <CardTitle className="mt-1 text-xl font-bold text-white">{currentExercise.name}</CardTitle>
        </div>
        <div className="text-right">
          <span className="block font-mono text-2xl font-bold text-purple-300">{formatSeconds(secondsRemaining)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SVG/Image illustration */}
        {currentExercise.image ? (
          <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2">
            {!imageLoaded && (
              <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-purple-950/40 text-xs text-purple-300/60">
                Ładowanie ilustracji...
              </div>
            )}
            <img
              src={currentExercise.image}
              alt={currentExercise.name}
              onLoad={() => {
                setImageLoaded(true);
              }}
              className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-purple-400/20 bg-purple-950/20 p-4 text-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-purple-300/60" />
            <span className="text-xs text-purple-300/60">Brak ilustracji dla tego ćwiczenia</span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-purple-100/90">{currentExercise.description}</p>
      </CardContent>

      <CardFooter className="flex gap-3 pt-2">
        <Button
          onClick={() => {
            advanceNext("done");
          }}
          className="flex-1 bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
        >
          <Check className="mr-2 h-4 w-4" /> {"Gotowe (Done)"}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            advanceNext("skipped");
          }}
          className="flex-1 border-white/20 bg-white/5 text-purple-200 hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="mr-2 h-4 w-4" /> {"Pomiń (Skip)"}
        </Button>
      </CardFooter>
    </Card>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import type { Exercise, BreakInputCookie } from "@/types";
import { selectExercises } from "@/lib/rule-engine";
import { saveStoredTimer } from "@/lib/timer-storage";
import { getLastSessionIds, saveLastSessionIds } from "@/lib/session-storage";
import { Button } from "@/components/ui/button";
import { Check, SkipForward, Play, Home, Clock, Sparkles, AlertCircle, RotateCcw } from "lucide-react";

interface ExerciseSequenceProps {
  breakInput: BreakInputCookie;
  catalog: Exercise[];
}

interface ExerciseResult {
  exerciseId: string;
  status: "done" | "skipped";
}

export default function ExerciseSequence({ breakInput, catalog }: ExerciseSequenceProps) {
  const [exercises] = useState<Exercise[]>(() => {
    const lastSessionIds = getLastSessionIds();
    return selectExercises({
      tags: breakInput.tags,
      lastSessionIds,
      catalog,
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"active" | "completed">(() => (exercises.length > 0 ? "active" : "completed"));
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    exercises.length > 0 ? exercises[0].duration_seconds : 0,
  );

  // M5 preparation stats
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [_exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);

  const isCompletedHandledRef = useRef(false);

  const finishSequence = useCallback((finalSelectedExercises: Exercise[]) => {
    if (isCompletedHandledRef.current) return;
    isCompletedHandledRef.current = true;

    const ids = finalSelectedExercises.map((ex) => ex.id);
    saveLastSessionIds(ids);

    fetch("/api/clear-break-cookie", { method: "POST" }).catch((_err: unknown) => {
      // Ignore network error
    });

    setStatus("completed");
  }, []);

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

  const handleResumeWork = () => {
    saveStoredTimer({
      startedAt: Date.now(),
      durationMs: 25 * 60 * 1000,
      extendedMs: 0,
    });
    window.location.assign("/dashboard");
  };

  const handleReturnIdle = () => {
    window.location.assign("/dashboard");
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (exercises.length === 0) {
    return (
      <div className="bg-card text-card-foreground mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-xl border p-8 text-center shadow-lg">
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
            Wróć do dashboardu
          </Button>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex] as Exercise | undefined;

  if (status === "completed" || !currentExercise) {
    return (
      <div className="bg-card text-card-foreground mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-xl border p-8 shadow-lg">
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
          <h3 className="text-center text-lg font-medium">Czy chcesz wznowić pracę?</h3>
          <Button onClick={handleResumeWork} size="lg" className="w-full gap-2 text-base">
            <Play size={18} />
            Tak, rozpocznij nową sesję (25 min)
          </Button>
          <Button onClick={handleReturnIdle} variant="outline" size="lg" className="w-full gap-2 text-base">
            <Home size={18} />
            Nie, wróć do dashboardu
          </Button>
        </div>
      </div>
    );
  }

  const totalExercises = exercises.length;
  const progressPercent = ((currentIndex + 1) / totalExercises) * 100;

  return (
    <div className="bg-card text-card-foreground mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border p-8 shadow-sm">
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
              {area}
            </span>
          ))}
        </div>
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

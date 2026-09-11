import { useState } from "react";
import type { Exercise, BreakInputCookie } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Check, SkipForward, AlertTriangle } from "lucide-react";
import { useExerciseSequence } from "@/components/hooks/useExerciseSequence";
import { SequenceCompletedCard } from "@/components/SequenceCompletedCard";
import { formatDuration } from "@/lib/time-utils";

interface ExerciseSequenceProps {
  breakInput: BreakInputCookie;
  catalog: Exercise[];
}

export default function ExerciseSequence({ breakInput, catalog }: ExerciseSequenceProps) {
  const {
    exercises,
    currentIndex,
    currentExercise,
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
  } = useExerciseSequence({ breakInput, catalog });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (prevIndex !== currentIndex) {
    setPrevIndex(currentIndex);
    setImageLoaded(false);
  }

  if (!isMounted) {
    return (
      <Card className="mx-auto w-full max-w-md border-white/10 bg-white/5 text-white backdrop-blur-xl">
        <CardContent className="pt-6 text-center">
          <p className="text-purple-200">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }



  if (status === "completed") {
    return (
      <SequenceCompletedCard
        completedCount={completedCount}
        skippedCount={skippedCount}
        idleEndTime={idleEndTime}
        idleSecondsRemaining={idleSecondsRemaining}
        handleCancelIdleBreak={handleCancelIdleBreak}
        handleStartIdleBreak={handleStartIdleBreak}
        handleResumeWork={handleResumeWork}
        handleReturnIdle={handleReturnIdle}
      />
    );
  }

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
          <span className="block font-mono text-2xl font-bold text-purple-300">{formatDuration(secondsRemaining)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
          <Check className="mr-2 h-4 w-4" /> Zrobione
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            advanceNext("skipped");
          }}
          className="flex-1 border-white/20 bg-white/5 text-purple-200 hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="mr-2 h-4 w-4" /> Pomiń
        </Button>
      </CardFooter>
    </Card>
  );
}

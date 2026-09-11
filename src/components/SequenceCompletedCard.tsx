import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Play } from "lucide-react";
import { formatDuration } from "@/lib/time-utils";

interface SequenceCompletedCardProps {
  completedCount: number;
  skippedCount: number;
  idleEndTime: number | null;
  idleSecondsRemaining: number;
  handleCancelIdleBreak: () => void;
  handleStartIdleBreak: (minutes: number) => void;
  handleResumeWork: () => void;
  handleReturnIdle: () => void;
}

export function SequenceCompletedCard({
  completedCount,
  skippedCount,
  idleEndTime,
  idleSecondsRemaining,
  handleCancelIdleBreak,
  handleStartIdleBreak,
  handleResumeWork,
  handleReturnIdle,
}: SequenceCompletedCardProps) {
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

        <div className="rounded-xl border border-white/10 bg-purple-900/20 p-4">
          <h4 className="text-sm font-semibold text-purple-200">Chcesz jeszcze chwilę odpocząć?</h4>
          <p className="mt-1 text-xs text-purple-300/70">Wybierz czas na wolny odpoczynek bez ćwiczeń:</p>

          {idleEndTime && idleSecondsRemaining > 0 ? (
            <div className="mt-3 text-center">
              <span className="font-mono text-3xl font-bold text-purple-200">
                {formatDuration(idleSecondsRemaining)}
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
              {[3, 5, 10].map((mins) => (
                <Button
                  key={mins}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleStartIdleBreak(mins);
                  }}
                  className="border-purple-400/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60"
                >
                  {mins} min
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          onClick={handleResumeWork}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500"
        >
          <Play className="mr-2 h-4 w-4" /> Wróć do pracy (Nowe Pomodoro)
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

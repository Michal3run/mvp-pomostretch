import { useState, useEffect, useCallback } from "react";
import { getStoredTimer, saveStoredTimer, clearStoredTimer } from "@/lib/timer-storage";
import type { TimerState } from "@/types";
import { Play, Square, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_DURATION = 25 * 60 * 1000; // 25 minutes
const AUTO_NAVIGATE_GRACE_PERIOD = 60 * 1000; // 60 seconds

export default function PomodoroTimer() {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [status, setStatus] = useState<"idle" | "active" | "expired_card">("idle");
  const [remainingMs, setRemainingMs] = useState(DEFAULT_DURATION);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const { state, isStorageAvailable } = getStoredTimer();
    if (!isStorageAvailable) {
      setShowWarningBanner(true);
    }
    if (state) {
      setTimerState(state);
      setStatus("active");
    }
    setIsMounted(true);
  }, []);

  const calculateTime = useCallback(() => {
    if (!timerState || status !== "active") return;

    const now = Date.now();
    const total = timerState.durationMs + timerState.extendedMs;
    const elapsed = now - timerState.startedAt;
    const remaining = total - elapsed;

    if (remaining <= 0) {
      clearStoredTimer();

      // Play sound and update title
      const audio = new Audio("/chime.mp3"); // We assume chime.mp3 exists or we will use a generic one/create one later. Or we can use a data URI for a simple beep.
      // Actually, let's just create an Audio object without throwing if it fails
      audio.play().catch(() => {
        /* ignore */
      });
      // eslint-disable-next-line react-compiler/react-compiler
      window.document.title = "(00:00) Przerwa!";

      if (Math.abs(remaining) <= AUTO_NAVIGATE_GRACE_PERIOD) {
        window.location.assign("/break-input");
      } else {
        setStatus("expired_card");
      }
      setRemainingMs(0);
    } else {
      setRemainingMs(remaining);
      // Optional: update title with remaining time
      const m = Math.floor(Math.ceil(remaining / 1000) / 60);
      const s = Math.ceil(remaining / 1000) % 60;

      window.document.title = `(${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}) PomoStretch`;
    }
  }, [timerState, status]);

  useEffect(() => {
    if (status !== "active") return;

    const tick = () => {
      calculateTime();
    };
    setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        calculateTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, calculateTime]);

  const startTimer = () => {
    const newState: TimerState = {
      startedAt: Date.now(),
      durationMs: DEFAULT_DURATION,
      extendedMs: 0,
    };
    setTimerState(newState);
    saveStoredTimer(newState);
    setStatus("active");
    setRemainingMs(DEFAULT_DURATION);
  };

  const extendTimer = () => {
    if (!timerState) return;
    const newState = {
      ...timerState,
      extendedMs: timerState.extendedMs + 5 * 60 * 1000,
    };
    setTimerState(newState);
    saveStoredTimer(newState);
    const total = newState.durationMs + newState.extendedMs;
    const elapsed = Date.now() - newState.startedAt;
    setRemainingMs(Math.max(0, total - elapsed));
  };

  const manualEnd = () => {
    clearStoredTimer();

    window.document.title = "PomoStretch";
    window.location.assign("/break-input");
  };

  const skipAndStartNew = () => {
    clearStoredTimer();
    setTimerState(null);
    setStatus("idle");
    setRemainingMs(DEFAULT_DURATION);

    window.document.title = "PomoStretch";
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isMounted) {
    return <div className="mx-auto h-[260px] w-full max-w-md animate-pulse rounded-2xl bg-white/5" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {showWarningBanner && (
        <div className="bg-destructive/15 text-destructive border-destructive/20 flex items-center justify-between rounded-md border p-3 text-sm">
          <span>Uwaga: Czas nie przetrwa odświeżenia strony (brak zapisu do storage).</span>
          <button
            onClick={() => {
              setShowWarningBanner(false);
            }}
            className="hover:bg-destructive/10 rounded-full p-1"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {status === "idle" && (
        <div className="dark flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold">Gotowy na sesję?</h2>
          <div className="font-mono text-5xl opacity-50">25:00</div>
          <Button onClick={startTimer} size="lg" className="w-full gap-2 text-lg">
            <Play size={20} />
            Rozpocznij nową sesję
          </Button>
        </div>
      )}

      {status === "active" && (
        <div className="dark flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
          <h2 className="text-muted-foreground text-xl font-medium">Czas skupienia</h2>
          <div className="font-mono text-7xl font-bold tracking-tighter tabular-nums">{formatTime(remainingMs)}</div>

          <div className="flex w-full gap-4">
            <Button onClick={extendTimer} variant="secondary" size="lg" className="flex-1 gap-2">
              <Plus size={18} />
              +5 min
            </Button>
            <Button onClick={manualEnd} size="lg" className="flex-1 gap-2">
              <Square size={18} fill="currentColor" />
              Zakończ
            </Button>
          </div>
        </div>
      )}

      {status === "expired_card" && (
        <div className="dark flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/10 p-8 text-white shadow-xl backdrop-blur-xl">
          <h2 className="text-center text-2xl font-bold">Sesja zakończona</h2>
          <p className="text-muted-foreground text-center">Twój czas skupienia dobiegł końca w tle. Czas na przerwę!</p>

          <div className="flex w-full flex-col gap-3">
            <Button onClick={manualEnd} size="lg" className="w-full">
              Rozpocznij przerwę teraz
            </Button>
            <Button onClick={skipAndStartNew} variant="outline" size="lg" className="w-full">
              Pomiń i zacznij nową sesję
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

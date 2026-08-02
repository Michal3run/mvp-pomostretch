import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function InfoButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Informacje o aplikacji PomoStretch"
          className="text-white/80 hover:bg-white/20 hover:text-white"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Jak działa PomoStretch?</DialogTitle>
          <DialogDescription className="text-zinc-400">
            PomoStretch to Twój inteligentny asystent pracy i przerw.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-zinc-200">1. Przebieg pracy</h4>
            <p className="text-zinc-400">
              Pracujesz w cyklach (np. 25 minut), po których następuje krótka przerwa. Na początku przerwy wybierasz
              strefę ciała, która wymaga rozluźnienia, a następnie wykonujesz dobrane ćwiczenia.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-zinc-200">2. Dlaczego PomoStretch?</h4>
            <ul className="list-disc space-y-1 pl-4 text-zinc-400">
              <li>
                <strong>Brak powtórzeń:</strong> Algorytm zapamiętuje wykonane ćwiczenia i rotuje je tak, byś się nie
                nudził.
              </li>
              <li>
                <strong>Personalizacja:</strong> Dopasowuje ćwiczenia do wskazanego przez Ciebie bólu czy zmęczenia (np.
                oczy, kark).
              </li>
              <li>
                <strong>Historia:</strong> Twoje przerwy są trwale zapamiętywane w historii.
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-zinc-200">3. Wskazówka</h4>
            <p className="text-zinc-400">
              Wybierz &quot;Zaskocz mnie&quot;, aby aplikacja wylosowała obszar do ćwiczeń na daną przerwę.
            </p>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-4">
            <h4 className="text-xs font-medium tracking-wider text-blue-400 uppercase">Dla oceniających MVP</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Pod spodem funkcjonuje pełny operacyjny <strong>CRUD</strong>. Historia sesji jest bezpiecznie zapisywana,
              odczytywana i może być usuwana z bazy Supabase z pełną obsługą uwierzytelniania i izolacji (RLS) per
              użytkownik.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

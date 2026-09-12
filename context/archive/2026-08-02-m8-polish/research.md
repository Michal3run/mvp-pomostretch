# M8 Polish: Research

## Cel i kontekst

Rozbudowa aplikacji o funkcje edukacyjne i post-MVP:

1. Panel informacyjny (Info Overlay) z opisem logiki biznesowej z PRD.
2. Zwiększenie liczby ćwiczeń (rozwiązanie problemu braku świeżych ćwiczeń po kilku cyklach z tagiem "oczy").
3. Rozszerzenie pokrycia testowego E2E o bezpieczeństwo RLS.

## Ustalenia z Codebase

1. **Dlaczego "Oczy" szybko wyczerpują ćwiczenia?**
   - Po sprawdzeniu migracji Supabase (`20260802110000_add_exercise_image_and_seed.sql`), w bazie znajduje się 25 ćwiczeń, ale **tylko 3** z nich mają przypisany tag `eyes`.
   - Zgodnie z PRD i logiką w `src/lib/rule-engine.ts`, silnik nie powtarza ćwiczeń, które użytkownik wykonał w poprzedniej sesji.
   - Gdy użytkownik wybierze "Oczy", a Rule Engine dobierze np. 3 ćwiczenia, cała pula dla oczu zostaje "wykorzystana". Przy kolejnej przerwie pula `freshCandidates` spada do 0, co uruchamia logikę fallback (zwraca powtórzone ćwiczenia lub tag `general`).
   - W przypadku braku bazy (local test bez `.env`), aplikacja ładuje ćwiczenia jako pustą listę co objawia się brakiem ćwiczeń od razu.

2. **Testowanie RLS (Role Level Security)**
   - W M5 dodano CRUD do historii przerw z włączonym RLS w bazie Supabase.
   - Testy Vitest testują logikę na poziomie klienta, ale najlepszym potwierdzeniem bezpiecznej aplikacji jest test E2E symulujący dwóch prawdziwych użytkowników:
     - User A tworzy wpis sesji.
     - User B loguje się i sprawdza, czy nie widzi wpisu A w swoim widoku historii, oraz API odrzuca próby usunięcia ID sesji A.

3. **Info Overlay**
   - Panel ma wyświetlać się po kliknięciu przycisku z prawej górnej strony ekranu.
   - PRD jasno definiuje mozaikę wartości ("pomodoro work-cycle × pain-aware tagged catalog × low-friction input × no-repeat memory across breaks").
   - Przycisk może znaleźć się w komponencie `Layout.astro` lub na samej górze `dashboard.astro`. Idealnie byłoby użyć frameworka UI, który już mamy – `shadcn/ui` (Dialog lub Sheet dla Reacta). Z powodu SSR w Astro, lepsze może okazać się po prostu umieszczenie guzika React na headerze, który otwiera okienko modalne.

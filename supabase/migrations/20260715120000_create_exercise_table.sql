-- Migration: Create exercise table and seed initial ergonomic exercises
-- Covers: FR-020, FR-021, FR-022 (M1 Database Schema & Exercise Catalog)

CREATE TABLE IF NOT EXISTS public.exercise (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    duration_seconds int NOT NULL CHECK (duration_seconds >= 30 AND duration_seconds <= 120),
    body_areas text[] NOT NULL CHECK (array_length(body_areas, 1) > 0),
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercise ENABLE ROW LEVEL SECURITY;

-- Grant public read access to all authenticated users
CREATE POLICY "Allow read access for authenticated users"
ON public.exercise
FOR SELECT
TO authenticated
USING (true);

-- Seed 15 initial ergonomic exercises covering all 4 quick-picks plus general
INSERT INTO public.exercise (name, description, duration_seconds, body_areas) VALUES
-- Eyes (3 exercises)
(
    'Zasada 20-20-20',
    'Co 20 minut spójrz na obiekt oddalony o 6 metrów przez 20 sekund. Pozwala to rozluźnić mięśnie rzęskowe oka i zapobiega zmęczeniu wzroku.',
    60,
    ARRAY['eyes']
),
(
    'Palming (ogrzewanie dłońmi)',
    'Potrzyj dłonie o siebie, aby je rozgrzać, a następnie delikatnie przyłóż je do zamkniętych oczu. Ciepło dłoni i ciemność głęboko relaksują oczy.',
    60,
    ARRAY['eyes']
),
(
    'Powolne mruganie i ruchy gałek',
    'Wykonaj 10 powolnych, pełnych mrugnięć, a następnie zatocz wzrokiem delikatne okręgi zgodnie z ruchem wskazówek zegara i w przeciwną stronę.',
    45,
    ARRAY['eyes']
),
-- Neck (3 exercises)
(
    'Powolne krążenie szyi',
    'Delikatnie opuść podbródek do klatki piersiowej i powoli zataczaj głową półokręgi od jednego ramienia do drugiego. Nie odchylaj głowy mocno w tył.',
    60,
    ARRAY['neck', 'shoulders']
),
(
    'Cofanie podbródka (Chin Tucks)',
    'Siedząc prosto, delikatnie cofnij podbródek w stronę szyi, tworząc podwójny podbródek. Wytrzymaj 5 sekund i rozluźnij. Powtórz 8 razy dla odciążenia karku.',
    45,
    ARRAY['neck']
),
(
    'Rozciąganie mięśnia czworobocznego',
    'Przechyl prawe ucho do prawego ramienia, opuszczając jednocześnie lewe ramię w dół. Wytrzymaj 25 sekund i powtórz ćwiczenie na drugą stronę.',
    60,
    ARRAY['neck', 'shoulders']
),
-- Shoulders (3 exercises)
(
    'Krążenie barków w tył',
    'Unieś oba barki wysyko w stronę uszu, odciągnij je maksymalnie w tył, ściągając łopatki, i opuść w dół. Wykonaj 12 płynnych, spokojnych powtórzeń.',
    45,
    ARRAY['shoulders']
),
(
    'Rozciąganie ramion w poprzek klatki',
    'Przełóż prawą rękę wyprostowaną w poprzek klatki piersiowej i dociśnij ją lewym przedramieniem. Wytrzymaj 30 sekund i zmień stronę.',
    60,
    ARRAY['shoulders']
),
(
    'Rozciąganie klatki w futrynie drzwi',
    'Oprzyj przedramiona na futrynie otwartych drzwi, zrób mały krok w przód i poczuj przyjemne rozciąganie zaciśniętych od siedzenia mięśni klatki i barków.',
    60,
    ARRAY['shoulders', 'general']
),
-- Lower Back (3 exercises)
(
    'Skręt tułowia na krześle',
    'Siedząc prosto z podłogą pod stopami, połóż prawą dłoń na lewym kolanie i delikatnie skręć tułów w lewo. Wytrzymaj 25 sekund i zmień stronę.',
    60,
    ARRAY['lower_back']
),
(
    'Pozycja kota i krowy w siadzie',
    'Oprzyj dłonie na kolanach. Przy wdechu wypchnij klatkę w przód i wygnij plecy (krowa). Przy wydechu zaokrąglij plecy, przyciągając brodę (kot). 10 powtórzeń.',
    60,
    ARRAY['lower_back', 'general']
),
(
    'Pochylenie w przód (Seated Forward Bend)',
    'Siedząc na krawędzi krzesła, opuść swobodnie tułów między rozszerzone kolana, pozwalając głowie i ramionom zwisać w dół. Oddychaj głęboko przez 45 sekund.',
    60,
    ARRAY['lower_back']
),
-- General (3 exercises)
(
    'Wstanie i przeciągnięcie w górę',
    'Wstań z krzesła, spleć palce dłoni, odwróć wnętrza dłoni do sufitu i wyciągnij całe ciało mocno w górę. Weź 3 głębokie wdechy, wydłużając kręgosłup.',
    45,
    ARRAY['general']
),
(
    'Głębokie oddychanie przeponowe',
    'Usiądź wygodnie, połóż dłonie na brzuchu. Wdychaj powietrze nosem przez 4 sekundy tak, by brzuch się uniósł, i wydychaj powoli ustami przez 6 sekund.',
    60,
    ARRAY['general']
),
(
    'Rozluźniający spacer i nawodnienie',
    'Odejdź od biurka, przejdź się spokojnym krokiem po pokoju lub korytarzu, rozluźnij ramiona i wypij szklankę świeżej wody przed powrotem do pracy.',
    90,
    ARRAY['general']
);

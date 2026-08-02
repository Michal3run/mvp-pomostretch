-- Migration: Seed more exercises for M8
-- Adding 5 eyes exercises, 3 neck exercises, 2 lower_back exercises
-- Using WHERE NOT EXISTS to make it idempotent

ALTER TABLE public.exercise ADD CONSTRAINT exercise_name_key UNIQUE (name);

INSERT INTO public.exercise (name, description, duration_seconds, body_areas, image)
SELECT * FROM (VALUES
  -- Eyes (5 exercises)
  (
    'Masaż skroni',
    'Zamknij oczy. Opuszkami palców wskazujących i środkowych delikatnie masuj skronie okrężnymi ruchami. Skup się na głębokim, relaksującym oddechu.',
    60,
    ARRAY['eyes']::text[],
    'images/eye-palming.svg'
  ),
  (
    'Szybkie mruganie',
    'Przez 15 sekund mrugaj bardzo szybko, ale bez napinania mięśni twarzy. Następnie zamknij oczy i zrelaksuj się przez kolejne 15 sekund.',
    30,
    ARRAY['eyes']::text[],
    'images/near-far-eye-shifts.svg'
  ),
  (
    'Wodzenie wzrokiem po ósemce',
    'Wyobraź sobie dużą leżącą ósemkę (znak nieskończoności) oddaloną o około 3 metry. Powoli obrysuj ją wzrokiem 5 razy w jedną i 5 razy w drugą stronę.',
    60,
    ARRAY['eyes']::text[],
    'images/20-20-20-eye-rule.svg'
  ),
  (
    'Ogniskowanie na kciuku',
    'Wyciągnij rękę przed siebie z podniesionym kciukiem. Powoli zbliżaj kciuk do nosa, cały czas skupiając na nim wzrok, aż obraz zacznie się rozmywać. Następnie powoli oddalaj.',
    45,
    ARRAY['eyes']::text[],
    'images/near-far-eye-shifts.svg'
  ),
  (
    'Rozluźnianie powiek',
    'Zaciśnij mocno powieki na 3 sekundy, a następnie otwórz je tak szeroko, jak to możliwe na 3 sekundy. Powtórz 5 razy, starając się rozluźnić czoło.',
    45,
    ARRAY['eyes']::text[],
    'images/eye-palming.svg'
  ),
  
  -- Neck (3 exercises)
  (
    'Rozciąganie karku w dół',
    'Spleć dłonie z tyłu głowy (nie na karku). Delikatnie i powoli pociągnij głowę w dół, przyciągając brodę do klatki piersiowej. Wytrzymaj 20 sekund.',
    60,
    ARRAY['neck']::text[],
    'images/neck-nods.svg'
  ),
  (
    'Rozciąganie boku szyi z rotacją',
    'Skręć głowę w prawo o 45 stopni. Prawą ręką delikatnie pociągnij głowę w dół, patrząc w kierunku prawej pachy. Utrzymaj 15 sekund i zmień stronę.',
    45,
    ARRAY['neck']::text[],
    'images/levator-scapulae-stretch.svg'
  ),
  (
    'Lekki masaż karku',
    'Użyj dłoni obu rąk, aby delikatnie ugniatać mięśnie z tyłu szyi i na karku, zaczynając od nasady czaszki w dół do ramion.',
    60,
    ARRAY['neck']::text[],
    'images/upper-trap-stretch.svg'
  ),
  
  -- Lower Back (2 exercises)
  (
    'Przeginanie miednicy siedząc',
    'Siedząc prosto na krześle z nogami płasko na podłodze, wykonaj delikatne podwinięcie miednicy pod siebie (zaokrąglając dół pleców), a następnie wypnij ją do tyłu.',
    60,
    ARRAY['lower_back']::text[],
    'images/seated-back-arch-and-round.svg'
  ),
  (
    'Rozciąganie mięśnia gruszkowatego w krześle',
    'Połóż kostkę prawej nogi na lewym kolanie. Z prostymi plecami pochyl się lekko do przodu, aż poczujesz rozciąganie głęboko w prawym pośladku. Wytrzymaj i zmień nogę.',
    60,
    ARRAY['lower_back']::text[],
    'images/seated-figure-4.svg'
  )
) AS v(name, description, duration_seconds, body_areas, image)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercise e WHERE e.name = v.name
);

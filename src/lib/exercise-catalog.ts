import type { Exercise } from "@/types";

export const FALLBACK_EXERCISE_CATALOG: Exercise[] = [
  {
    id: "neck-1",
    name: "Skłony głowy",
    description:
      "Usiądź prosto, ramiona rozluźnione. Powoli opuść brodę do klatki piersiowej, wytrzymaj 2 sekundy, wróć. Powtórz spokojnie 8-10 razy.",
    duration_seconds: 60,
    body_areas: ["neck"],
    image: "images/neck-nods.svg",
  },
  {
    id: "neck-2",
    name: "Cofanie brody",
    description:
      "Usiądź prosto, wzrok przed siebie. Cofnij brodę poziomo do tyłu, jakbyś chciał zrobić sobie podwójny podbródek. Wytrzymaj 5 sekund, rozluźnij.",
    duration_seconds: 60,
    body_areas: ["neck", "general"],
    image: "images/chin-tuck.svg",
  },
  {
    id: "eyes-1",
    name: "Reguła 20-20-20",
    description:
      "Oderwij wzrok od ekranu. Spójrz na coś oddalonego o około 6 metrów (okno, ściana w korytarzu) i utrzymaj wzrok przez 20 sekund. Mrugaj normalnie.",
    duration_seconds: 30,
    body_areas: ["eyes"],
    image: "images/20-20-20-eye-rule.svg",
  },
  {
    id: "shoulders-1",
    name: "Krążenia ramion",
    description:
      "Usiądź prosto, ręce luźno wzdłuż ciała. Wykonaj 8 wolnych krążeń ramion do tyłu, potem 8 do przodu. Skup się na pełnym zakresie ruchu.",
    duration_seconds: 45,
    body_areas: ["shoulders"],
    image: "images/shoulder-rolls.svg",
  },
  {
    id: "general-1",
    name: "Rozciąganie nadgarstków",
    description:
      "Wyciągnij prawą rękę przed siebie, dłonią do góry. Drugą ręką delikatnie ściągnij palce w dół, do siebie. Wytrzymaj 20 sekund, zmień rękę.",
    duration_seconds: 60,
    body_areas: ["general"],
    image: "images/wrist-flexor-stretch.svg",
  },
];

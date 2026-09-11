import { describe, it, expect } from "vitest";
import { selectExercises, fisherYatesShuffle } from "./rule-engine";
import type { Exercise } from "@/types";

const mockCatalog: Exercise[] = [
  { id: "1", name: "Eye stretch", description: "Eye stretch", duration_seconds: 60, body_areas: ["eyes"] },
  { id: "2", name: "Palming", description: "Palming", duration_seconds: 45, body_areas: ["eyes"] },
  { id: "3", name: "Neck roll", description: "Neck roll", duration_seconds: 60, body_areas: ["neck", "shoulders"] },
  { id: "4", name: "Chin tuck", description: "Chin tuck", duration_seconds: 30, body_areas: ["neck"] },
  { id: "5", name: "General stretch", description: "General stretch", duration_seconds: 90, body_areas: ["general"] },
  { id: "6", name: "Deep breath", description: "Deep breath", duration_seconds: 40, body_areas: ["general"] },
  { id: "7", name: "Glute squeeze", description: "Glute squeeze", duration_seconds: 50, body_areas: ["glutes_hips"] },
  { id: "8", name: "Wrist stretch", description: "Wrist stretch", duration_seconds: 35, body_areas: ["wrists_hands"] },
];

describe("selectExercises Rule Engine", () => {
  it("filters exercises matching glutes_hips tag", () => {
    const result = selectExercises({ tags: ["glutes_hips"], catalog: mockCatalog });
    expect(result.length).toBe(1);
    expect(result[0].body_areas).toContain("glutes_hips");
  });

  it("filters exercises matching wrists_hands tag", () => {
    const result = selectExercises({ tags: ["wrists_hands"], catalog: mockCatalog });
    expect(result.length).toBe(1);
    expect(result[0].body_areas).toContain("wrists_hands");
  });
  it("returns empty array for empty catalog", () => {
    const result = selectExercises({ tags: ["neck"], catalog: [] });
    expect(result).toEqual([]);
  });

  it("filters exercises matching requested tag", () => {
    const result = selectExercises({ tags: ["eyes"], catalog: mockCatalog });
    expect(result.length).toBe(2);
    expect(result.every((ex) => ex.body_areas.includes("eyes"))).toBe(true);
  });

  it("sorts selected exercises by duration_seconds ascending", () => {
    const result = selectExercises({ tags: ["eyes"], catalog: mockCatalog });
    expect(result[0].duration_seconds).toBe(45);
    expect(result[1].duration_seconds).toBe(60);
  });

  it("applies no-repeat rule excluding lastSessionIds", () => {
    const result = selectExercises({
      tags: ["neck"],
      lastSessionIds: ["4"],
      catalog: mockCatalog,
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("3");
  });

  it("falls back to general tag if no matching tag found", () => {
    const result = selectExercises({
      tags: ["unknown_tag"],
      catalog: mockCatalog,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((ex) => ex.body_areas.includes("general"))).toBe(true);
  });

  it("allows repeat if all tag-matching exercises were in last session", () => {
    const result = selectExercises({
      tags: ["eyes"],
      lastSessionIds: ["1", "2"],
      catalog: mockCatalog,
    });
    expect(result.length).toBe(2);
  });

  it("handles 'random' tag by selecting from all exercises", () => {
    const result = selectExercises({
      tags: ["random"],
      catalog: mockCatalog,
    });
    expect(result.length).toBe(3);
  });

  it("falls back to full catalog when general category has no exercises", () => {
    const catalogWithoutGeneral: Exercise[] = [
      { id: "10", name: "Neck only", description: "Neck only", duration_seconds: 30, body_areas: ["neck"] },
    ];
    const result = selectExercises({
      tags: ["eyes"],
      catalog: catalogWithoutGeneral,
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("10");
  });
});

describe("fisherYatesShuffle", () => {
  it("preserves elements and array length", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = fisherYatesShuffle(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it("does not mutate original array", () => {
    const original = Object.freeze([10, 20, 30]);
    const shuffled = fisherYatesShuffle(original);
    expect(shuffled).not.toBe(original);
    expect(original).toEqual([10, 20, 30]);
  });

  it("handles empty or single item arrays", () => {
    expect(fisherYatesShuffle([])).toEqual([]);
    expect(fisherYatesShuffle([42])).toEqual([42]);
  });
});

import { describe, it, expect } from "vitest";
import { selectExercises } from "./rule-engine";
import type { Exercise } from "@/types";

const mockCatalog: Exercise[] = [
  { id: "1", name: "Eye stretch", description: "Eye stretch", duration_seconds: 60, body_areas: ["eyes"] },
  { id: "2", name: "Palming", description: "Palming", duration_seconds: 45, body_areas: ["eyes"] },
  { id: "3", name: "Neck roll", description: "Neck roll", duration_seconds: 60, body_areas: ["neck", "shoulders"] },
  { id: "4", name: "Chin tuck", description: "Chin tuck", duration_seconds: 30, body_areas: ["neck"] },
  { id: "5", name: "General stretch", description: "General stretch", duration_seconds: 90, body_areas: ["general"] },
  { id: "6", name: "Deep breath", description: "Deep breath", duration_seconds: 40, body_areas: ["general"] },
];

describe("selectExercises Rule Engine", () => {
  it("falls back to DEFAULT_CATALOG for empty catalog", () => {
    const result = selectExercises({ tags: ["neck"], catalog: [] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((ex) => ex.body_areas.includes("neck"))).toBe(true);
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
});

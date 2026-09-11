import { describe, it, expect } from "vitest";
import { formatDuration } from "./time-utils";

describe("formatDuration", () => {
  it("formats zero and negative seconds as 00:00", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(-10)).toBe("00:00");
  });

  it("pads single digit seconds and minutes", () => {
    expect(formatDuration(5)).toBe("00:05");
    expect(formatDuration(59)).toBe("00:59");
    expect(formatDuration(65)).toBe("01:05");
  });

  it("formats exact minute intervals", () => {
    expect(formatDuration(60)).toBe("01:00");
    expect(formatDuration(120)).toBe("02:00");
    expect(formatDuration(600)).toBe("10:00");
  });

  it("handles large second values without breaking", () => {
    expect(formatDuration(3600)).toBe("60:00");
  });
});

import { describe, it, expect } from "vitest";
import { translateAuthError } from "./auth-errors";

describe("translateAuthError", () => {
  it("translates known errors", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("Nieprawidłowy adres email lub hasło.");
    expect(translateAuthError("User already registered")).toBe("Użytkownik o tym adresie email już istnieje.");
  });

  it("returns fallback for unknown errors", () => {
    expect(translateAuthError("Some random error")).toBe("Wystąpił błąd autoryzacji. Spróbuj ponownie.");
  });

  it("returns null for empty input", () => {
    expect(translateAuthError(null)).toBeNull();
    expect(translateAuthError(undefined)).toBeNull();
    expect(translateAuthError("")).toBeNull();
  });
});

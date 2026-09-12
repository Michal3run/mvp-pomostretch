export function translateAuthError(rawError: string | null | undefined): string | null {
  if (!rawError) return null;
  const mapping: Record<string, string> = {
    "Invalid login credentials": "Nieprawidłowy adres email lub hasło.",
    "User already registered": "Użytkownik o tym adresie email już istnieje.",
    "Email not confirmed": "Adres email nie został potwierdzony.",
    "Password should be at least 6 characters": "Hasło musi mieć co najmniej 6 znaków.",
    "Email and password are required": "Adres e-mail i hasło są wymagane.",
    "Supabase is not configured": "Błąd konfiguracji bazy danych.",
  };
  return mapping[rawError] ?? "Wystąpił błąd autoryzacji. Spróbuj ponownie.";
}

import React, { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerError } from "@/components/auth/ServerError";
import { translateAuthError } from "@/lib/auth-errors";

interface Props {
  serverError?: string | null;
}

export default function SignInForm({ serverError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(formData?: FormData) {
    const next: typeof errors = {};
    const emailEntry = formData?.get("email");
    const rawEmail = typeof emailEntry === "string" ? emailEntry : "";
    const passwordEntry = formData?.get("password");
    const rawPassword = typeof passwordEntry === "string" ? passwordEntry : "";
    const targetEmail = rawEmail.trim() || email.trim();
    const targetPassword = rawPassword || password;

    if (!targetEmail) {
      next.email = "Adres e-mail jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      next.email = "Wprowadź poprawny adres e-mail";
    }
    if (!targetPassword) {
      next.password = "Hasło jest wymagane";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearError(field: keyof typeof errors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const emailVal = (data.get("email") as string) || "";
    const passVal = (data.get("password") as string) || "";

    // If form data has values, allow native form POST submission
    if (emailVal.trim() && passVal) {
      return;
    }

    if (!validate(data)) {
      e.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/auth/signin" className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField
        id="email"
        type="email"
        label="E-mail"
        value={email}
        onChange={(v) => {
          setEmail(v);
          clearError("email");
        }}
        placeholder="ty@przyklad.pl"
        error={errors.email}
        icon={<Mail className="size-4" />}
      />

      <FormField
        id="password"
        label="Hasło"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(v) => {
          setPassword(v);
          clearError("password");
        }}
        placeholder="Twoje hasło"
        error={errors.password}
        icon={<Lock className="size-4" />}
        endContent={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => {
              setShowPassword(!showPassword);
            }}
          />
        }
      />

      <ServerError message={translateAuthError(serverError)} />

      <SubmitButton pendingText="Logowanie..." icon={<LogIn className="size-4" />}>
        Zaloguj się
      </SubmitButton>
    </form>
  );
}

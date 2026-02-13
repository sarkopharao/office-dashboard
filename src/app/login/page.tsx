"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Column, Flex, Text, Heading } from "@once-ui-system/core";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_DOMAIN } from "@/lib/auth-utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Fehler aus URL-Parametern anzeigen (z.B. nach fehlgeschlagenem Magic Link Callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "auth_failed") {
      setErrorMessage("Der Login-Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.");
      // URL aufräumen (Parameter entfernen)
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  // Magic Link Login
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    // Domain-Check
    if (!trimmedEmail.endsWith(ALLOWED_DOMAIN)) {
      setErrorMessage(`Bitte verwende deine ${ALLOWED_DOMAIN} E-Mail-Adresse.`);
      return;
    }

    setStatus("loading");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus("error");
        console.error("Supabase OTP Fehler:", error);
        setErrorMessage(error.message || `Fehler: ${JSON.stringify(error)}`);
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage("Verbindungsfehler. Bitte versuche es erneut.");
    }
  };

  // Legacy Passwort-Login (Fallback)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("loading");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = "/fotos";
      } else {
        setStatus("error");
        setErrorMessage("Falsches Passwort.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Verbindungsfehler.");
    }
  };

  return (
    <Flex
      horizontal="center"
      vertical="center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8f4f5 0%, #d4e8ea 50%, #c0dde0 100%)",
      }}
    >
      <Column
        horizontal="center"
        gap="l"
        padding="xl"
        radius="xl"
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
          maxWidth: "440px",
          width: "100%",
          margin: "1rem",
        }}
      >
        {/* Logo */}
        <Image
          src="/intumind-design/intumind-logo-color-laenglich-01.svg"
          alt="intumind"
          width={180}
          height={45}
          priority
        />

        <Heading
          variant="heading-strong-s"
          style={{
            color: "#27313F",
            textAlign: "center",
          }}
        >
          Team-Bereich
        </Heading>

        {/* Erfolgs-Nachricht nach Magic Link */}
        {status === "sent" ? (
          <Column horizontal="center" gap="m" style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #73A942, #5a8a35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                fontSize: "1.75rem",
              }}
            >
              ✉️
            </div>
            <Text variant="body-default-m" style={{ color: "#27313F", fontWeight: 600 }}>
              Magic Link gesendet!
            </Text>
            <Text variant="body-default-s" style={{ color: "#8C919C", lineHeight: 1.6 }}>
              Wir haben einen Login-Link an{" "}
              <strong style={{ color: "#009399" }}>{email}</strong> gesendet.
              Klicke den Link in der E-Mail, um dich anzumelden.
            </Text>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              style={{
                marginTop: "0.5rem",
                background: "none",
                border: "none",
                color: "#009399",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Andere E-Mail verwenden
            </button>
          </Column>
        ) : (
          <>
            {/* Magic Link Form */}
            {!showPasswordForm ? (
              <Column as="form" gap="m" style={{ width: "100%" }} onSubmit={handleMagicLink}>
                <Text
                  variant="body-default-s"
                  style={{ color: "#8C919C", textAlign: "center" }}
                >
                  Melde dich mit deiner intumind E-Mail an.
                  Du bekommst einen Magic Link per E-Mail.
                </Text>

                <Column gap="4">
                  <Text
                    as="label"
                    variant="label-strong-s"
                    style={{ color: "#505359", fontSize: "0.8rem" }}
                  >
                    E-Mail-Adresse
                  </Text>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dein.name@intumind.de"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "1px solid #D8DDE6",
                      borderRadius: "10px",
                      fontSize: "1rem",
                      fontFamily: "var(--font-body)",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#009399")}
                    onBlur={(e) => (e.target.style.borderColor = "#D8DDE6")}
                  />
                </Column>

                {/* Fehler-Anzeige */}
                {errorMessage && (
                  <Text
                    variant="body-default-s"
                    style={{
                      color: "#BA2F2F",
                      textAlign: "center",
                      padding: "0.5rem",
                      background: "rgba(186, 47, 47, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    {errorMessage}
                  </Text>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: status === "loading"
                      ? "#8C919C"
                      : "linear-gradient(135deg, #009399, #007a7f)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    cursor: status === "loading" ? "wait" : "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  {status === "loading" ? "Wird gesendet..." : "Magic Link senden"}
                </button>

                {/* Passwort-Fallback Link */}
                <Flex horizontal="center" style={{ marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(true);
                      setErrorMessage("");
                      setStatus("idle");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#B2BDD1",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Admin-Zugang mit Passwort
                  </button>
                </Flex>
              </Column>
            ) : (
              /* Passwort-Fallback Form */
              <Column as="form" gap="m" style={{ width: "100%" }} onSubmit={handlePasswordLogin}>
                <Text
                  variant="body-default-s"
                  style={{ color: "#8C919C", textAlign: "center" }}
                >
                  Admin-Zugang mit Passwort (Notfall-Login)
                </Text>

                <Column gap="4">
                  <Text
                    as="label"
                    variant="label-strong-s"
                    style={{ color: "#505359", fontSize: "0.8rem" }}
                  >
                    Passwort
                  </Text>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Admin-Passwort"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "1px solid #D8DDE6",
                      borderRadius: "10px",
                      fontSize: "1rem",
                      fontFamily: "var(--font-body)",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#009399")}
                    onBlur={(e) => (e.target.style.borderColor = "#D8DDE6")}
                  />
                </Column>

                {errorMessage && (
                  <Text
                    variant="body-default-s"
                    style={{
                      color: "#BA2F2F",
                      textAlign: "center",
                      padding: "0.5rem",
                      background: "rgba(186, 47, 47, 0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    {errorMessage}
                  </Text>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: status === "loading"
                      ? "#8C919C"
                      : "#27313F",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    cursor: status === "loading" ? "wait" : "pointer",
                  }}
                >
                  {status === "loading" ? "Wird geprüft..." : "Anmelden"}
                </button>

                <Flex horizontal="center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setErrorMessage("");
                      setStatus("idle");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#009399",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    ← Zurück zum Magic Link Login
                  </button>
                </Flex>
              </Column>
            )}
          </>
        )}

        {/* Footer */}
        <Text
          variant="body-default-s"
          style={{
            color: "#D8DDE6",
            fontSize: "0.7rem",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          intumind Office Dashboard
        </Text>
      </Column>
    </Flex>
  );
}

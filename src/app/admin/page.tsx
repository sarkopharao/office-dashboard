"use client";

import { useState, useEffect, useCallback } from "react";
import { Column, Flex, Grid, Text, Heading, Button, Input } from "@once-ui-system/core";
import type { Photo } from "@/types";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      if (res.ok) {
        setPhotos(await res.json());
      }
    } catch {
      // Ignorieren
    }
  }, []);

  useEffect(() => {
    fetchPhotos().then(() => {
      // Wenn Fotos geladen werden, sind wir vermutlich eingeloggt
    });
  }, [fetchPhotos]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsLoggedIn(true);
        setPassword("");
        fetchPhotos();
      } else {
        setError("Falsches Passwort");
      }
    } catch {
      setError("Verbindungsfehler");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/photos", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          alert(`Fehler bei ${file.name}: ${data.error}`);
        }
      } catch {
        alert(`Upload von ${file.name} fehlgeschlagen`);
      }
    }

    setUploading(false);
    fetchPhotos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Foto wirklich löschen?")) return;

    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      fetchPhotos();
    } catch {
      alert("Löschen fehlgeschlagen");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // Login-Formular
  if (!isLoggedIn) {
    return (
      <Flex
        fillWidth
        horizontal="center"
        vertical="center"
        style={{ minHeight: "100vh", background: "#f0f2f5" }}
      >
        <form onSubmit={handleLogin}>
          <Column
            radius="l"
            padding="xl"
            gap="m"
            style={{
              background: "#ffffff",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: "24rem",
            }}
          >
            <Column horizontal="center" gap="4">
              <Heading variant="heading-strong-m" style={{ color: "#27313F" }}>
                <span style={{ color: "#009399" }}>intu</span>mind
              </Heading>
              <Text variant="body-default-s" style={{ color: "#8C919C" }}>
                Admin-Bereich
              </Text>
            </Column>

            {error && (
              <Flex
                radius="m"
                padding="12"
                style={{ background: "#fef2f2", color: "#dc2626", fontSize: "0.875rem" }}
              >
                {error}
              </Flex>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                color: "#27313F",
                outline: "none",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                marginTop: "0.25rem",
                background: "#009399",
                color: "#ffffff",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Anmelden
            </button>
          </Column>
        </form>
      </Flex>
    );
  }

  // Admin-Dashboard
  return (
    <Column fillWidth style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <Flex
        as="header"
        horizontal="between"
        vertical="center"
        paddingX="l"
        paddingY="m"
        style={{ background: "#27313F" }}
      >
        <Flex vertical="center" gap="m">
          <Heading variant="heading-strong-s" style={{ color: "#ffffff" }}>
            <span style={{ color: "#009399" }}>intu</span>mind
            <Text
              as="span"
              variant="body-default-s"
              style={{ color: "#B2BDD1", marginLeft: "0.5rem" }}
            >
              Admin
            </Text>
          </Heading>
        </Flex>
        <Flex vertical="center" gap="m">
          <a
            href="/"
            style={{
              color: "#B2BDD1",
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Dashboard ansehen
          </a>
          <button
            onClick={() => {
              fetch("/api/auth", { method: "DELETE" });
              setIsLoggedIn(false);
            }}
            style={{
              color: "#B2BDD1",
              fontSize: "0.875rem",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Abmelden
          </button>
        </Flex>
      </Flex>

      <Column style={{ maxWidth: "64rem", margin: "0 auto", width: "100%" }} padding="xl">
        {/* Upload-Bereich */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: "2px dashed",
            borderColor: dragOver ? "#009399" : "#d1d5db",
            borderRadius: "1rem",
            padding: "3rem",
            textAlign: "center",
            transition: "border-color 0.2s, background 0.2s",
            background: dragOver ? "rgba(0,147,153,0.05)" : "#ffffff",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📸</div>
          <Text variant="body-strong-m" style={{ color: "#27313F", marginBottom: "0.25rem" }}>
            Teamfotos hier reinziehen
          </Text>
          <Text variant="body-default-s" style={{ color: "#8C919C", marginBottom: "1rem" }}>
            oder klicke um Dateien auszuwählen (JPG, PNG, WEBP, max. 10 MB)
          </Text>
          <label
            style={{
              display: "inline-block",
              background: "#009399",
              color: "#ffffff",
              padding: "0.5rem 1.5rem",
              borderRadius: "9999px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {uploading ? "Wird hochgeladen..." : "Dateien auswählen"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleUpload(e.target.files)}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Foto-Galerie */}
        <Column gap="m" style={{ marginTop: "2rem" }}>
          <Heading variant="heading-strong-s" style={{ color: "#27313F" }}>
            Teamfotos ({photos.length})
          </Heading>

          {photos.length === 0 ? (
            <Text
              variant="body-default-m"
              style={{ color: "#8C919C", textAlign: "center", padding: "3rem 0" }}
            >
              Noch keine Fotos hochgeladen.
            </Text>
          ) : (
            <Grid columns="4" gap="m">
              {photos.map((photo) => (
                <Column
                  key={photo.id}
                  radius="m"
                  style={{
                    overflow: "hidden",
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={`/api/photos/${photo.id}/file`}
                      alt={photo.originalName}
                      style={{
                        width: "100%",
                        height: "12rem",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.4)";
                        const btn = (e.currentTarget as HTMLElement).querySelector("button");
                        if (btn) btn.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        const btn = (e.currentTarget as HTMLElement).querySelector("button");
                        if (btn) btn.style.opacity = "0";
                      }}
                    >
                      <button
                        onClick={() => handleDelete(photo.id.toString())}
                        style={{
                          opacity: 0,
                          background: "#ef4444",
                          color: "#ffffff",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          border: "none",
                          cursor: "pointer",
                          transition: "opacity 0.2s",
                        }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  <Flex padding="8">
                    <Text
                      variant="label-default-s"
                      style={{
                        color: "#8C919C",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {photo.originalName}
                    </Text>
                  </Flex>
                </Column>
              ))}
            </Grid>
          )}
        </Column>
      </Column>
    </Column>
  );
}

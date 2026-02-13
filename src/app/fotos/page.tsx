"use client";

import { useState, useEffect, useCallback } from "react";
import { Column, Flex, Grid, Text, Heading } from "@once-ui-system/core";
import { createClient } from "@/lib/supabase/client";
import { isAdminClient } from "@/lib/auth-utils";
import { useLogout } from "@/hooks/useLogout";
import type { Photo } from "@/types";

interface UserInfo {
  email?: string;
  role: "admin" | "member";
  method: "supabase" | "password";
}

export default function AdminPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // User-Info laden
  useEffect(() => {
    const loadUser = async () => {
      // Supabase-Session prüfen
      try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser?.email) {
          setUser({
            email: supabaseUser.email,
            role: isAdminClient(supabaseUser.email) ? "admin" : "member",
            method: "supabase",
          });
          setLoading(false);
          return;
        }
      } catch {
        // Supabase nicht verfügbar
      }

      // Fallback: Wenn wir hier sind und die Seite geladen wurde,
      // muss der Legacy-Cookie aktiv sein (Middleware hat uns durchgelassen)
      setUser({
        email: undefined,
        role: "admin",
        method: "password",
      });
      setLoading(false);
    };

    loadUser();
  }, []);

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
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const total = files.length;
    let uploaded = 0;
    let errors = 0;

    for (const file of Array.from(files)) {
      setUploadProgress(`${uploaded + 1} von ${total}: ${file.name}`);
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
          errors++;
        } else {
          uploaded++;
        }
      } catch {
        alert(`Upload von ${file.name} fehlgeschlagen`);
        errors++;
      }
    }

    setUploading(false);
    setUploadProgress("");
    fetchPhotos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Foto wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Löschen fehlgeschlagen");
        return;
      }
      fetchPhotos();
    } catch {
      alert("Löschen fehlgeschlagen");
    }
  };

  const { handleLogout } = useLogout();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const isAdmin = user?.role === "admin";

  // Loading-State
  if (loading) {
    return (
      <Flex
        horizontal="center"
        vertical="center"
        style={{ minHeight: "100vh", background: "#f0f2f5" }}
      >
        <Column horizontal="center" gap="m">
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #D8DDE6",
              borderTopColor: "#009399",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <Text variant="body-default-s" style={{ color: "#8C919C" }}>
            Wird geladen...
          </Text>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Column>
      </Flex>
    );
  }

  return (
    <Column fillWidth style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <Flex
        as="header"
        horizontal="between"
        vertical="center"
        paddingX="l"
        paddingY="m"
        style={{ background: "#27313F", flexWrap: "wrap", gap: "0.5rem" }}
      >
        <Flex vertical="center" gap="m">
          <Heading variant="heading-strong-s" style={{ color: "#ffffff" }}>
            <span style={{ color: "#009399" }}>intu</span>mind
            <Text
              as="span"
              variant="body-default-s"
              style={{ color: "#B2BDD1", marginLeft: "0.5rem" }}
            >
              {isAdmin ? "Admin" : "Teamfotos"}
            </Text>
          </Heading>
        </Flex>
        <Flex vertical="center" gap="m" style={{ flexWrap: "wrap" }}>
          {/* User-Info */}
          {user && (
            <Flex vertical="center" gap="8">
              {user.email && (
                <Text variant="body-default-s" style={{ color: "#B2BDD1" }}>
                  {user.email}
                </Text>
              )}
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: isAdmin ? "rgba(0, 147, 153, 0.2)" : "rgba(178, 189, 209, 0.2)",
                  color: isAdmin ? "#009399" : "#B2BDD1",
                }}
              >
                {isAdmin ? "Admin" : "Mitarbeiter"}
              </span>
            </Flex>
          )}
          <a
            href="/"
            style={{
              color: "#B2BDD1",
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Dashboard
          </a>
          <button
            onClick={handleLogout}
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
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
            {uploading ? "⏳" : "📸"}
          </div>
          <Text variant="body-strong-m" style={{ color: "#27313F", marginBottom: "0.25rem" }}>
            {uploading ? "Upload läuft..." : "Teamfotos hier reinziehen"}
          </Text>
          <Text variant="body-default-s" style={{ color: "#8C919C", marginBottom: "1rem" }}>
            {uploading
              ? uploadProgress
              : "oder klicke um Dateien auszuwählen (JPG, PNG, WEBP, max. 10 MB)"}
          </Text>
          <label
            style={{
              display: "inline-block",
              background: uploading ? "#8C919C" : "#009399",
              color: "#ffffff",
              padding: "0.5rem 1.5rem",
              borderRadius: "9999px",
              cursor: uploading ? "wait" : "pointer",
              fontWeight: 500,
              transition: "background 0.2s",
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
          <Flex vertical="center" gap="12">
            <Heading variant="heading-strong-s" style={{ color: "#27313F" }}>
              Teamfotos
            </Heading>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "rgba(0, 147, 153, 0.1)",
                color: "#009399",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontFamily: "var(--font-body), sans-serif",
              }}
            >
              📷 {photos.length} {photos.length === 1 ? "Foto" : "Fotos"}
            </span>
          </Flex>

          {photos.length === 0 ? (
            <Column
              horizontal="center"
              gap="s"
              style={{ padding: "3rem 0", textAlign: "center" }}
            >
              <div style={{ fontSize: "3rem", opacity: 0.3 }}>🖼️</div>
              <Text variant="body-default-m" style={{ color: "#8C919C" }}>
                Noch keine Fotos hochgeladen.
              </Text>
              <Text variant="body-default-s" style={{ color: "#B2BDD1" }}>
                Ziehe Bilder in den Upload-Bereich oder klicke auf &quot;Dateien auswählen&quot;.
              </Text>
            </Column>
          ) : (
            <Grid
              columns="4"
              gap="m"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              }}
            >
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
                      src={photo.url}
                      alt={photo.originalName}
                      style={{
                        width: "100%",
                        height: "12rem",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {/* Löschen-Overlay nur für Admins */}
                    {isAdmin && (
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
                          onClick={() => handleDelete(photo.id)}
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
                    )}
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

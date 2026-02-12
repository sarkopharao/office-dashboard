"use client";

import { useState, useEffect, useCallback } from "react";
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
    // Prüfe ob bereits eingeloggt (Cookie existiert)
    fetchPhotos().then((res) => {
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
      <div className="min-h-screen bg-intumind-bg flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-intumind-white rounded-2xl shadow-lg p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-intumind-dark">
              <span className="text-intumind-blue">intu</span>mind
            </h1>
            <p className="text-intumind-gray text-sm mt-1">Admin-Bereich</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-intumind-dark focus:outline-none focus:border-intumind-blue focus:ring-1 focus:ring-intumind-blue"
            autoFocus
          />

          <button
            type="submit"
            className="w-full mt-4 bg-intumind-blue text-white py-3 rounded-xl font-medium hover:bg-intumind-blue-dark transition-colors"
          >
            Anmelden
          </button>
        </form>
      </div>
    );
  }

  // Admin-Dashboard
  return (
    <div className="min-h-screen bg-intumind-bg">
      {/* Header */}
      <header className="bg-intumind-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-intumind-white text-xl font-bold">
            <span className="text-intumind-blue">intu</span>mind
            <span className="text-intumind-gray-light font-normal ml-2 text-sm">
              Admin
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-intumind-gray-light hover:text-intumind-white text-sm transition-colors"
          >
            Dashboard ansehen
          </a>
          <button
            onClick={() => {
              fetch("/api/auth", { method: "DELETE" });
              setIsLoggedIn(false);
            }}
            className="text-intumind-gray-light hover:text-red-400 text-sm transition-colors"
          >
            Abmelden
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        {/* Upload-Bereich */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            dragOver
              ? "border-intumind-blue bg-intumind-blue/5"
              : "border-gray-300 bg-intumind-white"
          }`}
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="text-intumind-dark font-medium mb-1">
            Teamfotos hier reinziehen
          </p>
          <p className="text-intumind-gray text-sm mb-4">
            oder klicke um Dateien auszuwählen (JPG, PNG, WEBP, max. 10 MB)
          </p>
          <label className="inline-block bg-intumind-blue text-white px-6 py-2 rounded-full cursor-pointer hover:bg-intumind-blue-dark transition-colors">
            {uploading ? "Wird hochgeladen..." : "Dateien auswählen"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Foto-Galerie */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-intumind-dark mb-4">
            Teamfotos ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <p className="text-intumind-gray text-center py-12">
              Noch keine Fotos hochgeladen.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden bg-intumind-white shadow-sm"
                >
                  <img
                    src={`/api/photos/${photo.id}/file`}
                    alt={photo.originalName}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(photo.id.toString())}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all"
                    >
                      Löschen
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-intumind-gray truncate">
                      {photo.originalName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

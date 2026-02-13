/**
 * Einmaliges Migrationsskript: Bestehende lokale Daten → Supabase
 *
 * Migriert:
 * 1. Fotos aus /uploads/ → Supabase Storage + photos DB-Tabelle
 * 2. data/sales-cache.json → sales_cache DB-Tabelle
 * 3. data/revenue-history.json → revenue_history DB-Tabelle
 *
 * Ausführen: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// .env.local laden
import { config } from "dotenv";
config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DATA_DIR = path.join(process.cwd(), "data");

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function migratePhotos() {
  console.log("\n📸 Fotos migrieren...");

  if (!existsSync(UPLOADS_DIR)) {
    console.log("   ⏭️  Kein /uploads/ Verzeichnis vorhanden – überspringe");
    return;
  }

  const files = await readdir(UPLOADS_DIR);
  const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  if (imageFiles.length === 0) {
    console.log("   ⏭️  Keine Bilder in /uploads/ gefunden");
    return;
  }

  console.log(`   Gefunden: ${imageFiles.length} Bilder`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of imageFiles) {
    try {
      const filePath = path.join(UPLOADS_DIR, filename);
      const buffer = await readFile(filePath);
      const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = MIME_TYPES[ext] || "image/jpeg";

      // Prüfen ob Datei schon in Storage existiert
      const { data: existing } = await supabase.storage
        .from("photos")
        .list("", { search: filename });

      if (existing && existing.length > 0 && existing.some((f) => f.name === filename)) {
        console.log(`   ⏭️  ${filename} existiert bereits in Storage`);
        skipped++;
        continue;
      }

      // In Supabase Storage hochladen
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filename, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error(`   ❌ Upload-Fehler für ${filename}: ${uploadError.message}`);
        errors++;
        continue;
      }

      // ID aus dem Dateinamen extrahieren (Format: uuid.ext)
      const id = filename.replace(/\.[^.]+$/, "");
      // Prüfe ob die ID ein gültiges UUID-Format hat, sonst neue generieren
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const photoId = uuidRegex.test(id) ? id : crypto.randomUUID();

      // Metadaten in DB speichern
      const { error: dbError } = await supabase
        .from("photos")
        .upsert({
          id: photoId,
          filename,
          original_name: filename,
          uploaded_by: "migration",
        }, { onConflict: "id" });

      if (dbError) {
        console.error(`   ❌ DB-Fehler für ${filename}: ${dbError.message}`);
        errors++;
        continue;
      }

      uploaded++;
      console.log(`   ✅ ${filename} → Storage + DB`);
    } catch (err) {
      console.error(`   ❌ Fehler bei ${filename}:`, err);
      errors++;
    }
  }

  console.log(`   📊 Ergebnis: ${uploaded} hochgeladen, ${skipped} übersprungen, ${errors} Fehler`);
}

async function migrateSalesCache() {
  console.log("\n💰 Sales-Cache migrieren...");

  const cacheFile = path.join(DATA_DIR, "sales-cache.json");

  if (!existsSync(cacheFile)) {
    console.log("   ⏭️  Keine sales-cache.json vorhanden – überspringe");
    return;
  }

  try {
    const raw = await readFile(cacheFile, "utf-8");
    const salesData = JSON.parse(raw);

    const { error } = await supabase
      .from("sales_cache")
      .upsert({
        id: 1,
        data: salesData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`   ❌ DB-Fehler: ${error.message}`);
      return;
    }

    console.log("   ✅ Sales-Cache in Supabase geschrieben");
  } catch (err) {
    console.error("   ❌ Fehler:", err);
  }
}

async function migrateRevenueHistory() {
  console.log("\n📈 Revenue-History migrieren...");

  const historyFile = path.join(DATA_DIR, "revenue-history.json");

  if (!existsSync(historyFile)) {
    console.log("   ⏭️  Keine revenue-history.json vorhanden – überspringe");
    return;
  }

  try {
    const raw = await readFile(historyFile, "utf-8");
    const history: Record<string, number> = JSON.parse(raw);
    const entries = Object.entries(history);

    if (entries.length === 0) {
      console.log("   ⏭️  History ist leer");
      return;
    }

    // In Batches von 50 upserten
    const batchSize = 50;
    let total = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize).map(([day, amount]) => ({
        day,
        amount,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("revenue_history")
        .upsert(batch, { onConflict: "day" });

      if (error) {
        console.error(`   ❌ DB-Fehler bei Batch ${i}: ${error.message}`);
        continue;
      }

      total += batch.length;
    }

    console.log(`   ✅ ${total} Tagesumsätze in Supabase geschrieben`);
  } catch (err) {
    console.error("   ❌ Fehler:", err);
  }
}

async function main() {
  console.log("🚀 Supabase-Migration starten...");
  console.log(`   Supabase URL: ${supabaseUrl}`);

  // Verbindung testen
  const { error: testError } = await supabase.from("sales_cache").select("id").limit(1);
  if (testError) {
    console.error(`❌ Kann nicht mit Supabase verbinden: ${testError.message}`);
    console.error("   Hast du die Tabellen im SQL Editor angelegt?");
    process.exit(1);
  }
  console.log("   ✅ Supabase-Verbindung OK");

  await migratePhotos();
  await migrateSalesCache();
  await migrateRevenueHistory();

  console.log("\n🎉 Migration abgeschlossen!");
  console.log("   Du kannst jetzt den Dev-Server starten und testen.");
  console.log("   Die lokalen Dateien (/uploads/, /data/) können nach dem Test gelöscht werden.");
}

main().catch((err) => {
  console.error("❌ Migration fehlgeschlagen:", err);
  process.exit(1);
});

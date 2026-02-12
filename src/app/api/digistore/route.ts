import { NextResponse } from "next/server";
import { DUMMY_SALES } from "@/lib/constants";

export async function GET() {
  // TODO: Echte Daten aus SQLite Cache lesen, sobald Digistore24 angebunden
  // Erstmal Dummy-Daten zurückgeben
  return NextResponse.json(DUMMY_SALES);
}

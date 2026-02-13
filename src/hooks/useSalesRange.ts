"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SALES_REFRESH_INTERVAL } from "@/lib/constants";
import type { SalesRangePreset, SalesRangeSelection, SalesRangeData } from "@/types";

const STORAGE_KEY = "salesRangeWidget_range";
const DEFAULT_PRESET: SalesRangePreset = "30d";

/** Berechnet dateFrom/dateTo aus einem Preset. */
function computeDateRange(preset: SalesRangePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = today.toISOString().split("T")[0];

  switch (preset) {
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { dateFrom: from.toISOString().split("T")[0], dateTo };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { dateFrom: from.toISOString().split("T")[0], dateTo };
    }
    case "90d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 89);
      return { dateFrom: from.toISOString().split("T")[0], dateTo };
    }
    case "year": {
      return { dateFrom: `${today.getFullYear()}-01-01`, dateTo };
    }
    default:
      return { dateFrom: dateTo, dateTo };
  }
}

/** Liest gespeicherte Auswahl aus localStorage. */
function loadSelection(): SalesRangeSelection {
  if (typeof window === "undefined") {
    const { dateFrom, dateTo } = computeDateRange(DEFAULT_PRESET);
    return { preset: DEFAULT_PRESET, dateFrom, dateTo };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SalesRangeSelection;
      // Custom-Presets beibehalten, andere neu berechnen (dateTo = heute)
      if (parsed.preset !== "custom") {
        const { dateFrom, dateTo } = computeDateRange(parsed.preset);
        return { preset: parsed.preset, dateFrom, dateTo };
      }
      return parsed;
    }
  } catch { /* ignore corrupt localStorage */ }
  const { dateFrom, dateTo } = computeDateRange(DEFAULT_PRESET);
  return { preset: DEFAULT_PRESET, dateFrom, dateTo };
}

export interface UseSalesRangeResult {
  rangeData: SalesRangeData | null;
  loading: boolean;
  error: string | null;
  selection: SalesRangeSelection;
  showDetails: boolean;
  setPreset: (preset: SalesRangePreset) => void;
  setCustomRange: (dateFrom: string, dateTo: string) => void;
  toggleDetails: () => void;
}

export function useSalesRange(): UseSalesRangeResult {
  const [selection, setSelection] = useState<SalesRangeSelection>(loadSelection);
  const [rangeData, setRangeData] = useState<SalesRangeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // localStorage Persistenz
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch { /* ignore */ }
  }, [selection]);

  // Daten fetchen
  const fetchRange = useCallback(async (
    dateFrom: string,
    dateTo: string,
    breakdown: boolean,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (breakdown) params.set("breakdown", "true");

      const res = await fetch(`/api/digistore/range?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setRangeData(json.data);
      } else {
        setError(json.error || "Unbekannter Fehler");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bei Auswahl- oder Details-Änderung
  useEffect(() => {
    fetchRange(selection.dateFrom, selection.dateTo, showDetails);
  }, [selection, showDetails, fetchRange]);

  // Auto-Refresh (gleicher Intervall wie Haupt-Dashboard)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRange(selection.dateFrom, selection.dateTo, showDetails);
    }, SALES_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [selection, showDetails, fetchRange]);

  const setPreset = useCallback((preset: SalesRangePreset) => {
    if (preset === "custom") {
      // Nur UI-Switch, kein Fetch bis der User Daten eingibt
      setSelection((prev) => ({ ...prev, preset: "custom" }));
    } else {
      const { dateFrom, dateTo } = computeDateRange(preset);
      setSelection({ preset, dateFrom, dateTo });
    }
  }, []);

  const setCustomRange = useCallback((dateFrom: string, dateTo: string) => {
    if (dateFrom && dateTo && dateFrom <= dateTo) {
      setSelection({ preset: "custom", dateFrom, dateTo });
    }
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  return {
    rangeData,
    loading,
    error,
    selection,
    showDetails,
    setPreset,
    setCustomRange,
    toggleDetails,
  };
}

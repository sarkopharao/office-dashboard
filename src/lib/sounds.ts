/**
 * Sound-Engine für die Raketen-Celebration.
 * Alle Sounds werden synthetisch mit der Web Audio API erzeugt – keine externen Dateien nötig.
 *
 * Sounds:
 * 1. Raketen-Zischen (steigendes Whoosh)
 * 2. Explosions-Knall (kurzer Pop/Boom)
 * 3. Fanfare + Jubel (Sieges-Melodie mit synthetischem Applaus)
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let contextReady = false;

/**
 * AudioContext initialisieren (Singleton).
 * Versucht automatisch zu resumen – im Kiosk-Modus mit
 * --autoplay-policy=no-user-gesture-required klappt das sofort.
 * Ansonsten wird bei erster User-Interaktion resumed.
 */
function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();

    // Master-Volume (alle Sounds laufen hierüber)
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    // Autoplay-Policy: Resume versuchen + Listener für User-Interaktion
    if (audioCtx.state === "suspended") {
      audioCtx.resume().then(() => {
        contextReady = true;
      });

      const resume = () => {
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume().then(() => {
            contextReady = true;
          });
        }
      };
      // { once: true } entfernt Listener automatisch nach erstem Aufruf
      document.addEventListener("click", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
      document.addEventListener("touchstart", resume, { once: true });
    } else {
      contextReady = true;
    }

    // State-Change Listener (wird mit audioCtx.close() automatisch entfernt)
    audioCtx.addEventListener("statechange", () => {
      if (audioCtx?.state === "running") {
        contextReady = true;
      }
    });
  }
  return audioCtx;
}

function getMaster(): GainNode {
  getContext();
  return masterGain!;
}

/**
 * Stellt sicher, dass der AudioContext läuft, bevor Sound gespielt wird.
 * Gibt true zurück wenn bereit, false wenn blockiert.
 */
async function ensureRunning(): Promise<boolean> {
  const ctx = getContext();
  if (ctx.state === "running") return true;

  try {
    await ctx.resume();
    // Nach resume() prüfen ob der Context jetzt läuft
    return (ctx.state as string) === "running";
  } catch {
    return false;
  }
}

// ─── 1. RAKETEN-ZISCHEN ───────────────────────────────────────────────────────

/**
 * Spielt ein aufsteigendes Zisch-/Whoosh-Geräusch.
 * Kombination aus gefiltertem Rauschen + steigendem Oszillator.
 * @param duration Dauer in Sekunden (Standard: 2s)
 */
export async function playRocketWhoosh(duration = 2.0): Promise<void> {
  if (!(await ensureRunning())) return;

  const ctx = getContext();
  const dest = getMaster();
  const now = ctx.currentTime;

  // === Schicht 1: Rauschen (Sizzle/Hiss) ===
  const noiseLen = Math.ceil(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  // Bandpass-Filter: von 500Hz → 4000Hz hochgleitend
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(500, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + duration);
  filter.Q.value = 1.2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.08);
  noiseGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.8);
  noiseGain.gain.linearRampToValueAtTime(0, now + duration);

  noise.connect(filter).connect(noiseGain).connect(dest);
  noise.start(now);
  noise.stop(now + duration);

  // === Schicht 2: Steigender Ton (Whoosh) ===
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + duration);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.linearRampToValueAtTime(0.08, now + 0.08);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(oscGain).connect(dest);
  osc.start(now);
  osc.stop(now + duration);
}

// ─── 2. EXPLOSIONS-KNALL ──────────────────────────────────────────────────────

/**
 * Spielt einen kurzen Explosions-Pop/Boom.
 * Kombination aus Rausch-Burst + abfallendem Oszillator + Sparkle.
 */
export async function playExplosionPop(): Promise<void> {
  if (!(await ensureRunning())) return;

  const ctx = getContext();
  const dest = getMaster();
  const now = ctx.currentTime;

  // === Schicht 1: Rausch-Burst (Knack) ===
  const burstLen = Math.ceil(ctx.sampleRate * 0.2);
  const burstBuffer = ctx.createBuffer(1, burstLen, ctx.sampleRate);
  const burstData = burstBuffer.getChannelData(0);
  for (let i = 0; i < burstLen; i++) {
    burstData[i] = Math.random() * 2 - 1;
  }

  const burst = ctx.createBufferSource();
  burst.buffer = burstBuffer;

  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = "highpass";
  hpFilter.frequency.value = 800;

  const burstGain = ctx.createGain();
  burstGain.gain.setValueAtTime(0.5, now);
  burstGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  burst.connect(hpFilter).connect(burstGain).connect(dest);
  burst.start(now);
  burst.stop(now + 0.2);

  // === Schicht 2: Abfallender Boom (Wumms) ===
  const boom = ctx.createOscillator();
  boom.type = "sine";
  boom.frequency.setValueAtTime(500, now);
  boom.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  const boomGain = ctx.createGain();
  boomGain.gain.setValueAtTime(0.4, now);
  boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  boom.connect(boomGain).connect(dest);
  boom.start(now);
  boom.stop(now + 0.2);

  // === Schicht 3: Leichtes Glitzern (Sparkle) ===
  const sparkle = ctx.createOscillator();
  sparkle.type = "sine";
  sparkle.frequency.setValueAtTime(2400, now);
  sparkle.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

  const sparkleGain = ctx.createGain();
  sparkleGain.gain.setValueAtTime(0.12, now);
  sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  sparkle.connect(sparkleGain).connect(dest);
  sparkle.start(now);
  sparkle.stop(now + 0.35);
}

// ─── 3. FANFARE + JUBEL ──────────────────────────────────────────────────────

/**
 * Spielt eine kurze Sieges-Fanfare gefolgt von synthetischem Jubel/Applaus.
 * Die Fanfare besteht aus aufsteigenden Tönen (C-E-G-C), danach Rausch-Applaus.
 */
export async function playCelebration(): Promise<void> {
  if (!(await ensureRunning())) return;

  const ctx = getContext();
  const dest = getMaster();
  const now = ctx.currentTime;

  // === Fanfare: Aufsteigende Dreiklang-Melodie (Ta-Da-Daaaa!) ===
  const notes = [
    { freq: 523.25, start: 0, dur: 0.15 },     // C5
    { freq: 659.25, start: 0.15, dur: 0.15 },   // E5
    { freq: 783.99, start: 0.30, dur: 0.15 },   // G5
    { freq: 1046.50, start: 0.45, dur: 0.6 },   // C6 (lang gehalten)
  ];

  for (const note of notes) {
    // Hauptton (Dreieck – weich & klar)
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = note.freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + note.start);
    gain.gain.linearRampToValueAtTime(0.25, now + note.start + 0.03);
    gain.gain.setValueAtTime(0.25, now + note.start + note.dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

    osc.connect(gain).connect(dest);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.dur + 0.05);

    // Oberton (Oktave höher, leiser – für Brillanz)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = note.freq * 2;

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now + note.start);
    gain2.gain.linearRampToValueAtTime(0.08, now + note.start + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

    osc2.connect(gain2).connect(dest);
    osc2.start(now + note.start);
    osc2.stop(now + note.start + note.dur + 0.05);
  }

  // === Synthetischer Applaus/Jubel (Rauschen mit rhythmischer Modulation) ===
  const applauseStart = 0.6; // Nach der Fanfare
  const applauseDur = 2.5;
  const applauseLen = Math.ceil(ctx.sampleRate * applauseDur);
  const applauseBuffer = ctx.createBuffer(1, applauseLen, ctx.sampleRate);
  const applauseData = applauseBuffer.getChannelData(0);

  // Moduliertes Rauschen – klingt wie viele klatschende Hände
  for (let i = 0; i < applauseLen; i++) {
    const t = i / ctx.sampleRate;
    // Rhythmische Modulation (schnelle Amplitude-Schwankungen wie Klatschen)
    const mod = 0.5 + 0.5 * Math.sin(t * 35) * Math.sin(t * 17) * Math.sin(t * 7);
    applauseData[i] = (Math.random() * 2 - 1) * mod;
  }

  const applause = ctx.createBufferSource();
  applause.buffer = applauseBuffer;

  // Bandpass für natürlicheren Klang (kein tiefes Brummen, kein Zischen)
  const applauseFilter = ctx.createBiquadFilter();
  applauseFilter.type = "bandpass";
  applauseFilter.frequency.value = 2500;
  applauseFilter.Q.value = 0.5;

  const applauseGain = ctx.createGain();
  applauseGain.gain.setValueAtTime(0, now + applauseStart);
  applauseGain.gain.linearRampToValueAtTime(0.2, now + applauseStart + 0.3);
  applauseGain.gain.setValueAtTime(0.2, now + applauseStart + applauseDur * 0.6);
  applauseGain.gain.exponentialRampToValueAtTime(0.001, now + applauseStart + applauseDur);

  applause.connect(applauseFilter).connect(applauseGain).connect(dest);
  applause.start(now + applauseStart);
  applause.stop(now + applauseStart + applauseDur);

  // === Jubel-Töne (ein paar "Wooo!"-artige Glissandos) ===
  const cheers = [
    { start: 0.7, freqStart: 600, freqEnd: 900, dur: 0.4 },
    { start: 1.1, freqStart: 700, freqEnd: 1100, dur: 0.35 },
    { start: 1.6, freqStart: 500, freqEnd: 850, dur: 0.45 },
    { start: 2.0, freqStart: 650, freqEnd: 1000, dur: 0.3 },
  ];

  for (const cheer of cheers) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(cheer.freqStart, now + cheer.start);
    osc.frequency.linearRampToValueAtTime(cheer.freqEnd, now + cheer.start + cheer.dur * 0.6);
    osc.frequency.linearRampToValueAtTime(cheer.freqStart * 1.1, now + cheer.start + cheer.dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + cheer.start);
    gain.gain.linearRampToValueAtTime(0.06, now + cheer.start + 0.05);
    gain.gain.setValueAtTime(0.06, now + cheer.start + cheer.dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cheer.start + cheer.dur);

    osc.connect(gain).connect(dest);
    osc.start(now + cheer.start);
    osc.stop(now + cheer.start + cheer.dur + 0.05);
  }
}

// ─── INIT & CLEANUP ──────────────────────────────────────────────────────────

/**
 * AudioContext vorab initialisieren und resumen.
 * Sollte beim Component-Mount aufgerufen werden, damit der Context
 * beim ersten Sound-Aufruf bereits läuft.
 */
export async function initAudio(): Promise<void> {
  await ensureRunning();
}

/** AudioContext schließen (für Component-Unmount). */
export function cleanupAudio(): void {
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
    masterGain = null;
    contextReady = false;
  }
}

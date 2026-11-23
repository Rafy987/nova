/** Pure helpers that turn raw audio samples into a smooth 0..1 "level" for the orb. */

import type { NovaState } from "./novaState";

/** Root-mean-square loudness of samples in the range -1..1. */
export function computeRms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/**
 * Map RMS to 0..1. Below the noise floor = 0; sqrt makes quiet speech still visible.
 * Normal speech RMS is roughly 0.02–0.2.
 */
export function rmsToLevel(rms: number, noiseFloor = 0.01, gain = 5): number {
  const v = Math.max(0, rms - noiseFloor) * gain;
  return Math.min(1, Math.sqrt(v));
}

/** Fast rise, slow fall (like a VU meter). */
export function smooth(prev: number, target: number, attack = 0.35, release = 0.08): number {
  const k = target > prev ? attack : release;
  return prev + (target - prev) * k;
}

/**
 * Target level for the orb per state at time t (seconds).
 * - listening: real mic level
 * - speaking: synthetic voice-like pulse for now (real TTS signal comes in Phase 5)
 */
export function targetLevel(state: NovaState, t: number, micLevel: number): number {
  switch (state) {
    case "listening":
      return micLevel;
    case "thinking":
      return 0.08 + 0.04 * Math.sin(t * 3);
    case "speaking": {
      const syllables = Math.abs(Math.sin(t * 9)) * (0.6 + 0.4 * Math.sin(t * 2.3));
      return 0.15 + 0.5 * syllables;
    }
    default:
      return 0;
  }
}

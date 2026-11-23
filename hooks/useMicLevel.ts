"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeRms, rmsToLevel } from "@/lib/audioLevel";

export type MicStatus = "off" | "starting" | "on" | "denied" | "unavailable" | "error";

/**
 * Opens the microphone and measures its loudness with a Web Audio AnalyserNode.
 * The level (0..1) is written to a ref every frame, so React does NOT re-render 60x/sec.
 * Call start() from a user gesture (click / key) — browsers require it for audio.
 */
export function useMicLevel() {
  const levelRef = useRef(0);
  const [status, setStatus] = useState<MicStatus>("off");
  const cleanupRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef(0); // guards against stop() during an async start()

  const release = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    levelRef.current = 0;
  }, []);

  const stop = useCallback(() => {
    sessionRef.current++;
    release();
    setStatus("off");
  }, [release]);

  const start = useCallback(async (): Promise<MicStatus> => {
    if (cleanupRef.current) return "on";
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return "unavailable";
    }

    const session = ++sessionRef.current;
    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      // stop() was called while we waited for permission
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return "off";
      }

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser); // not connected to speakers -> no echo

      const samples = new Float32Array(analyser.fftSize);
      let raf = 0;
      const loop = () => {
        analyser.getFloatTimeDomainData(samples);
        levelRef.current = rmsToLevel(computeRms(samples));
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      setStatus("on");
      return "on";
    } catch (err) {
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");
      const notFound = err instanceof DOMException && err.name === "NotFoundError";
      const next: MicStatus = denied ? "denied" : notFound ? "unavailable" : "error";
      setStatus(next);
      return next;
    }
  }, []);

  // Release the mic when the component unmounts
  useEffect(() => release, [release]);

  return { levelRef, status, start, stop };
}

export function micMessage(status: MicStatus): string | null {
  switch (status) {
    case "denied":
      return "Microphone blocked. Allow it from the icon in the address bar.";
    case "unavailable":
      return "No microphone found, or this page is not on HTTPS/localhost.";
    case "error":
      return "Could not start the microphone.";
    default:
      return null;
  }
}

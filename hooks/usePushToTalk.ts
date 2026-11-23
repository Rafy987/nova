"use client";

import { useEffect, useRef } from "react";
import { isTypingTarget } from "@/lib/keyboard";

/**
 * Hold Space to talk: keydown -> onStart, keyup -> onEnd.
 * Ignored while typing in a field. Also ends if the window loses focus mid-press.
 */
export function usePushToTalk(onStart: () => void, onEnd: () => void) {
  const startRef = useRef(onStart);
  const endRef = useRef(onEnd);

  // Always call the latest handlers without re-binding listeners.
  useEffect(() => {
    startRef.current = onStart;
    endRef.current = onEnd;
  });

  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === "Space";

    const down = (e: KeyboardEvent) => {
      if (!isSpace(e) || isTypingTarget(e.target as HTMLElement | null)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault(); // no page scroll, no button "click"
      if (!e.repeat) startRef.current();
    };
    const up = (e: KeyboardEvent) => {
      if (!isSpace(e) || isTypingTarget(e.target as HTMLElement | null)) return;
      e.preventDefault();
      endRef.current();
    };
    const release = () => endRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") release();
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}

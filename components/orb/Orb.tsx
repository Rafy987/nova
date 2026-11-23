"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { NovaState } from "@/lib/novaState";
import { smooth, targetLevel } from "@/lib/audioLevel";

/**
 * Audio-reactive energy core.
 * A requestAnimationFrame loop writes `--level` (0..1) as a CSS variable on the root,
 * and `data-state` switches the look per state. CSS does the rest -> no React re-renders per frame.
 */

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const BEARINGS = ["000", "090", "180", "270"];

export default function Orb({
  state,
  micLevelRef,
}: {
  state: NovaState;
  micLevelRef: RefObject<number>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const amplitude = reduceMotion ? 0.3 : 1;
    const t0 = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      const target = targetLevel(state, t, micLevelRef.current ?? 0);
      levelRef.current = smooth(levelRef.current, target);
      el.style.setProperty("--level", (levelRef.current * amplitude).toFixed(3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, micLevelRef]);

  return (
    <div
      ref={rootRef}
      data-state={state}
      className="orb relative aspect-square w-[min(78vw,440px)] [perspective:900px]"
      role="img"
      aria-label={`NOVA core, ${state}`}
    >
      {/* Halo */}
      <div className="orb-halo absolute inset-[22%]">
        <div className="h-full w-full rounded-full bg-accent/25 blur-3xl animate-breathe" />
      </div>

      {/* Outer tick ring */}
      <svg viewBox="0 0 200 200" className="ring-outer absolute inset-0 animate-spin-slow" aria-hidden>
        <circle cx="100" cy="100" r="97" fill="none" stroke="var(--color-line)" strokeWidth="0.5" />
        {TICKS.map((deg) => {
          const major = deg % 45 === 0;
          return (
            <line
              key={deg}
              x1="100"
              y1={major ? 3 : 5.5}
              x2="100"
              y2="9"
              stroke={major ? "var(--color-accent)" : "var(--color-muted)"}
              strokeOpacity={major ? 1 : 0.5}
              strokeWidth={major ? 0.9 : 0.4}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}
      </svg>

      {/* Bearing labels (static) */}
      <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
        {BEARINGS.map((label, i) => {
          const a = (i * Math.PI) / 2;
          const x = (100 + Math.sin(a) * 85).toFixed(2);
          const y = (100 - Math.cos(a) * 85 + 1.5).toFixed(2);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="4"
              letterSpacing="0.6"
              fill="var(--color-muted)"
              fontFamily="var(--font-geist-mono)"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Thinking: radar sweep */}
      <div className="orb-sweep absolute inset-[11%]" aria-hidden>
        <div className="orb-sweep-beam h-full w-full rounded-full" />
      </div>

      {/* Mid + inner rings scale slightly with level */}
      <div className="orb-rings absolute inset-0">
        <svg viewBox="0 0 200 200" className="ring-glow ring-mid absolute inset-0 animate-spin-rev" aria-hidden>
          <circle cx="100" cy="100" r="76" fill="none" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="0.8 2.6" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="56 384" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="18 422" strokeDashoffset="-220" opacity="0.7" />
        </svg>
        <svg viewBox="0 0 200 200" className="ring-glow ring-inner absolute inset-0 animate-spin-fast" aria-hidden>
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-accent-bright)" strokeOpacity="0.25" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-accent-bright)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="28 349" />
        </svg>
      </div>

      {/* Tilted orbits for depth */}
      <div className="absolute inset-[24%] [transform-style:preserve-3d]">
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
      </div>

      {/* Core (outer wrapper reacts to level, inner breathes) */}
      <div className="orb-core absolute inset-[33%]">
        <div className="absolute inset-0 animate-breathe">
          <div className="core-shell absolute inset-0" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 opacity-40" aria-hidden>
            <ellipse cx="50" cy="50" rx="46" ry="14" fill="none" stroke="var(--color-accent-bright)" strokeWidth="0.4" />
            <ellipse cx="50" cy="50" rx="46" ry="30" fill="none" stroke="var(--color-accent)" strokeWidth="0.3" />
            <ellipse cx="50" cy="50" rx="16" ry="46" fill="none" stroke="var(--color-accent)" strokeWidth="0.3" />
          </svg>
          <div className="core-plasma absolute inset-[10%] animate-spin-fast" />
          <div className="orb-nucleus core-nucleus absolute inset-[30%]" />
        </div>
      </div>
    </div>
  );
}

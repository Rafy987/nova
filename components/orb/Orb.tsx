/**
 * Static energy core (Phase 1).
 * Layers, back to front: soft halo -> rotating tick ring -> dashed ring -> glowing core.
 * Phase 2 replaces this with an audio-reactive version.
 */

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const BEARINGS = ["000", "090", "180", "270"];

export default function Orb() {
  return (
    <div
      className="relative aspect-square w-[min(72vw,420px)]"
      role="img"
      aria-label="NOVA core, idle"
    >
      {/* Halo */}
      <div className="absolute inset-[18%] rounded-full bg-accent/20 blur-3xl animate-breathe" />

      {/* Outer tick ring */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow">
        <circle cx="100" cy="100" r="96" fill="none" stroke="var(--color-line)" strokeWidth="0.4" />
        {TICKS.map((deg) => {
          const major = deg % 45 === 0;
          return (
            <line
              key={deg}
              x1="100"
              y1={major ? 4 : 6}
              x2="100"
              y2="10"
              stroke={major ? "var(--color-accent)" : "var(--color-dim)"}
              strokeWidth={major ? 0.8 : 0.4}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}
      </svg>

      {/* Bearing labels (do not rotate) */}
      <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
        {BEARINGS.map((label, i) => {
          const a = (i * Math.PI) / 2;
          const x = 100 + Math.sin(a) * 84;
          const y = 100 - Math.cos(a) * 84 + 1.5;
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

      {/* Inner dashed ring with two arc segments */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-rev" aria-hidden>
        <circle
          cx="100" cy="100" r="72" fill="none"
          stroke="var(--color-accent-soft)" strokeWidth="0.5" strokeDasharray="1 3"
        />
        <circle
          cx="100" cy="100" r="64" fill="none"
          stroke="var(--color-accent)" strokeWidth="1" strokeLinecap="round"
          strokeDasharray="40 362" opacity="0.8"
        />
        <circle
          cx="100" cy="100" r="64" fill="none"
          stroke="var(--color-accent)" strokeWidth="1" strokeLinecap="round"
          strokeDasharray="12 390" strokeDashoffset="-200" opacity="0.5"
        />
      </svg>

      {/* Core sphere */}
      <div className="absolute inset-[30%] animate-breathe">
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, #e0fbff 0%, #67e8f9 14%, #0891b2 42%, #083344 72%, #020a10 100%)",
            boxShadow:
              "0 0 40px rgb(34 211 238 / 0.45), 0 0 120px rgb(34 211 238 / 0.18), inset 0 0 30px rgb(2 10 16 / 0.9)",
          }}
        />
        {/* Thin equator line for a sense of 3D */}
        <div className="absolute inset-x-[6%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );
}

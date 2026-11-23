/**
 * Static energy core (Phase 1).
 * Layers, back to front:
 *   halo -> tick ring -> arc rings -> tilted orbits -> translucent shell -> plasma -> nucleus
 * Phase 2 makes these react to audio and state.
 */

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const BEARINGS = ["000", "090", "180", "270"];

export default function Orb() {
  return (
    <div
      className="relative aspect-square w-[min(78vw,440px)] [perspective:900px]"
      role="img"
      aria-label="NOVA core, idle"
    >
      {/* Halo */}
      <div className="absolute inset-[22%] rounded-full bg-accent/25 blur-3xl animate-breathe" />

      {/* Outer tick ring */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow" aria-hidden>
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

      {/* Mid ring: dotted track + bright arcs (counter-rotating) */}
      <svg viewBox="0 0 200 200" className="ring-glow absolute inset-0 animate-spin-rev" aria-hidden>
        <circle cx="100" cy="100" r="76" fill="none" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="0.5" strokeDasharray="0.8 2.6" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="56 384" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="18 422" strokeDashoffset="-220" opacity="0.7" />
      </svg>

      {/* Inner ring: thin, faster */}
      <svg viewBox="0 0 200 200" className="ring-glow absolute inset-0 animate-spin-fast" aria-hidden>
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-accent-bright)" strokeOpacity="0.25" strokeWidth="0.4" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--color-accent-bright)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="28 349" />
      </svg>

      {/* Tilted orbits for depth */}
      <div className="absolute inset-[24%] [transform-style:preserve-3d]">
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
      </div>

      {/* Core */}
      <div className="absolute inset-[33%] animate-breathe">
        {/* translucent shell with bright rim */}
        <div className="core-shell absolute inset-0" />
        {/* faint wireframe latitudes / meridians */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 opacity-40" aria-hidden>
          <ellipse cx="50" cy="50" rx="46" ry="14" fill="none" stroke="var(--color-accent-bright)" strokeWidth="0.4" />
          <ellipse cx="50" cy="50" rx="46" ry="30" fill="none" stroke="var(--color-accent)" strokeWidth="0.3" />
          <ellipse cx="50" cy="50" rx="16" ry="46" fill="none" stroke="var(--color-accent)" strokeWidth="0.3" />
        </svg>
        {/* swirling plasma */}
        <div className="core-plasma absolute inset-[10%] animate-spin-fast" />
        {/* hot nucleus */}
        <div className="core-nucleus absolute inset-[30%]" />
      </div>
    </div>
  );
}

import CornerBrackets from "@/components/hud/CornerBrackets";
import NovaHud from "@/components/NovaHud";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Background layers */}
      <div aria-hidden className="hud-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="hud-vignette pointer-events-none absolute inset-0" />
      <CornerBrackets />

      <NovaHud />
    </div>
  );
}

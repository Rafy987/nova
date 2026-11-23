/** Four thin glowing brackets framing the viewport. Purely decorative. */
export default function CornerBrackets() {
  const base = "pointer-events-none absolute h-5 w-5 border-accent/50 sm:h-8 sm:w-8";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-2 sm:inset-3">
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

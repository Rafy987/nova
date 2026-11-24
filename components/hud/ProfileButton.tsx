"use client";

import { useEffect, useId, useRef, useState } from "react";
import { sanitizeUserName } from "@/lib/chat/prompt";

/** Status-bar control: shows the saved name; opens a small popover to edit it. */
export default function ProfileButton({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = draft.trim();
  const invalid = trimmed !== "" && sanitizeUserName(trimmed) === null;

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open) setDraft(name);
    setOpen((v) => !v);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    onSave(trimmed);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="hud-label max-w-[7rem] truncate whitespace-nowrap border sm:max-w-[9rem] border-transparent px-1 transition-colors hover:border-line hover:text-ink"
      >
        <span className="hidden sm:inline">User: </span>
        {name || "Set name"}
      </button>

      {open && (
        <form
          role="dialog"
          aria-label="Your profile"
          onSubmit={save}
          className="glass fixed inset-x-4 top-16 z-30 border border-accent/20 p-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-72"
        >
          <label htmlFor={inputId} className="hud-label mb-2 block text-ink/80">
            Your name
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder="e.g. Abdul Rafay Minhas"
            aria-invalid={invalid}
            className="w-full border border-line bg-void/60 px-3 py-2 font-display text-sm text-ink outline-none placeholder:text-dim focus:border-accent"
          />
          <p className={`mt-2 text-[11px] leading-snug ${invalid ? "text-danger" : "text-dim"}`}>
            {invalid
              ? "Use letters, spaces, dot, apostrophe or hyphen only."
              : "NOVA uses this exact spelling. Saved only in this browser."}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="hud-label border border-line px-3 py-1 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invalid}
              className="hud-label border border-accent/60 px-3 py-1 text-accent hover:bg-accent/10 disabled:opacity-30"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

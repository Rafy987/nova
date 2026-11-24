/**
 * Browser speechSynthesis wrapper: speak sentences one after another as they arrive.
 * Note: the browser does not expose the audio itself, so the orb pulses on word
 * "boundary" events (fired by Edge voices; often not by Chrome's Google voices).
 */

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Voices load asynchronously in Chrome/Edge; wait briefly for them. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isTtsSupported()) return Promise.resolve([]);
  const now = speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve(speechSynthesis.getVoices());
    };
    const timer = setTimeout(done, timeoutMs);
    speechSynthesis.addEventListener("voiceschanged", done);
  });
}

export interface SpeechQueue {
  enqueue(text: string): void;
  /** No more sentences will come; onDone fires when the last one finishes. */
  finish(): void;
  /** Stop immediately (barge-in). onDone will NOT fire. */
  cancel(): void;
  readonly cancelled: boolean;
}

export function createSpeechQueue(opts: {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  rate?: number;
  onStart?: () => void;
  onBoundary?: () => void;
  onDone: () => void;
}): SpeechQueue {
  const live = new Set<SpeechSynthesisUtterance>(); // keep references (Chrome GC bug drops events otherwise)
  let pending = 0;
  let finished = false;
  let stopped = false;
  let started = false;

  const checkDone = () => {
    if (stopped || !finished || pending > 0) return;
    stopped = true;
    opts.onDone();
  };

  return {
    enqueue(text) {
      const t = text.trim();
      if (stopped || !t) return;
      const u = new SpeechSynthesisUtterance(t);
      if (opts.voice) u.voice = opts.voice;
      u.lang = opts.voice?.lang ?? opts.lang;
      u.rate = opts.rate ?? 1.05;
      u.onstart = () => {
        if (!started) {
          started = true;
          opts.onStart?.();
        }
      };
      u.onboundary = () => opts.onBoundary?.();
      const end = () => {
        if (!live.delete(u)) return;
        pending--;
        checkDone();
      };
      u.onend = end;
      u.onerror = end; // includes "interrupted"/"canceled"; never block the flow
      live.add(u);
      pending++;
      if (speechSynthesis.paused) speechSynthesis.resume(); // Chrome can get stuck paused
      speechSynthesis.speak(u);
    },

    finish() {
      finished = true;
      checkDone();
    },

    cancel() {
      stopped = true;
      live.clear();
      pending = 0;
      speechSynthesis.cancel();
    },

    get cancelled() {
      return stopped && !finished;
    },
  };
}

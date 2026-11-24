"use client";

import { useEffect, useRef, useState } from "react";
import Orb from "@/components/orb/Orb";
import StatusBar from "@/components/hud/StatusBar";
import Panel from "@/components/hud/Panel";
import TalkButton from "@/components/hud/TalkButton";
import StatusPill from "@/components/hud/StatusPill";
import TranscriptPanel from "@/components/hud/TranscriptPanel";
import DevStateControls from "@/components/hud/DevStateControls";
import { canTransition, transition, type NovaEvent, type NovaState } from "@/lib/novaState";
import { EMPTY_TRANSCRIPT, fullText, type Transcript } from "@/lib/transcript";
import { createWebSpeechProvider } from "@/lib/stt/webSpeech";
import { STT_MESSAGES, type SpeechLang, type SttErrorCode, type SttProvider } from "@/lib/stt/types";
import { playCue } from "@/lib/sounds";
import { micMessage, useMicLevel } from "@/hooks/useMicLevel";
import { usePushToTalk } from "@/hooks/usePushToTalk";

const MODULES = ["Weather", "Time / Zones", "Calculator", "Reminders", "Notes"];

/** How long "thinking" shows before returning to idle. Placeholder until Phase 4 (Groq). */
const PLACEHOLDER_THINK_MS = 1200;

/** If the speech service never confirms the end after release, continue anyway. */
const STOP_TIMEOUT_MS = 2500;

/** Client shell: owns NOVA's state, the microphone and speech-to-text. */
export default function NovaHud() {
  const [state, setStateValue] = useState<NovaState>("idle");
  const stateRef = useRef<NovaState>("idle"); // latest state for async callbacks
  const [errorText, setErrorText] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Transcript>(EMPTY_TRANSCRIPT);
  const [soundOn, setSoundOn] = useState(true);
  const [lang, setLang] = useState<SpeechLang>("en-US");

  const mic = useMicLevel();
  const sttRef = useRef<SttProvider | null>(null);
  const talkingRef = useRef(false); // true while the talk key/button is held
  const thinkTimerRef = useRef<number | undefined>(undefined);
  const stopTimerRef = useRef<number | undefined>(undefined);
  const latestRef = useRef<Transcript>(EMPTY_TRANSCRIPT); // last text heard, for the timeout

  useEffect(
    () => () => {
      window.clearTimeout(thinkTimerRef.current);
      window.clearTimeout(stopTimerRef.current);
    },
    [],
  );

  function stt(): SttProvider {
    sttRef.current ??= createWebSpeechProvider(lang);
    return sttRef.current;
  }

  /** Switch recognition language (only while not listening). Provider is rebuilt on next use. */
  function changeLang(next: SpeechLang) {
    if (next === lang || stateRef.current === "listening") return;
    sttRef.current?.abort();
    sttRef.current = null;
    setLang(next);
  }

  /** Every state change goes through the pure state machine. */
  function send(event: NovaEvent): NovaState {
    const current = stateRef.current;
    const next = transition(current, event);
    if (next === current) return current;
    if (next !== "error") setErrorText(null);
    if (current === "listening") mic.stop();
    stateRef.current = next;
    setStateValue(next);
    return next;
  }

  function fail(message: string | null) {
    window.clearTimeout(stopTimerRef.current);
    talkingRef.current = false;
    stt().abort();
    send("FAIL");
    setErrorText(message);
  }

  async function startTalk() {
    if (talkingRef.current || !canTransition(stateRef.current, "LISTEN")) return;
    if (!stt().isSupported()) {
      fail(STT_MESSAGES.unsupported);
      return;
    }

    talkingRef.current = true;
    window.clearTimeout(thinkTimerRef.current);
    setTranscript(EMPTY_TRANSCRIPT);
    latestRef.current = EMPTY_TRANSCRIPT;
    if (soundOn) playCue("start");
    send("LISTEN");

    stt().start({
      onPartial: (t) => {
        latestRef.current = t;
        setTranscript(t);
      },
      onEnd: handleSttEnd,
      onError: handleSttError,
    });

    // Mic level for the orb (separate from recognition; must start inside the user gesture)
    const result = await mic.start();
    if (result !== "on" && result !== "off") fail(micMessage(result));
  }

  function endTalk() {
    if (!talkingRef.current) return;
    talkingRef.current = false;
    if (soundOn) playCue("stop");
    mic.stop();
    stt().stop(); // final text arrives in handleSttEnd

    // Safety net: some networks never deliver the end event.
    window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => {
      if (stateRef.current !== "listening" || talkingRef.current) return;
      stt().abort();
      handleSttEnd(fullText(latestRef.current));
    }, STOP_TIMEOUT_MS);
  }

  function handleSttEnd(text: string) {
    window.clearTimeout(stopTimerRef.current);
    talkingRef.current = false;
    if (stateRef.current !== "listening") return;
    if (!text) {
      send("CANCEL");
      return;
    }
    setTranscript({ final: text, interim: "" });
    send("STOP_LISTENING");
    // Phase 4 sends `text` to Groq here. Until then, return to idle.
    thinkTimerRef.current = window.setTimeout(() => send("RESET"), PLACEHOLDER_THINK_MS);
  }

  function handleSttError(code: SttErrorCode) {
    fail(STT_MESSAGES[code]);
  }

  usePushToTalk(startTalk, endTalk);

  function onDevEvent(e: NovaEvent) {
    if (e === "LISTEN") void startTalk();
    else if (e === "STOP_LISTENING") endTalk();
    else {
      if (e === "CANCEL" || e === "FAIL" || e === "RESET") {
        talkingRef.current = false;
        stt().abort();
      }
      send(e);
    }
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <StatusBar
        micStatus={mic.status}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn((v) => !v)}
        lang={lang}
        onLangChange={changeLang}
        langLocked={state === "listening"}
      />

      <main className="grid flex-1 grid-cols-1 items-center gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        {/* Center: orb + state (first on mobile) */}
        <div className="flex flex-col items-center lg:order-2">
          <Orb state={state} micLevelRef={mic.levelRef} />
          <StatusPill state={state} detail={errorText} />
        </div>

        <TranscriptPanel
          transcript={transcript}
          lang={lang}
          listening={state === "listening"}
          className="w-full lg:order-1 lg:max-w-sm lg:justify-self-end"
        />

        {/* Right: tool output */}
        <Panel label="Modules" meta="0 active" className="w-full lg:order-3 lg:max-w-sm">
          <ul className="space-y-2.5">
            {MODULES.map((name) => (
              <li key={name} className="flex items-center justify-between border-b border-accent/5 pb-2 last:border-0 last:pb-0">
                <span className="font-display text-sm text-ink/80">{name}</span>
                <span className="hud-label text-dim">Standby</span>
              </li>
            ))}
          </ul>
        </Panel>
      </main>

      <footer className="flex flex-col items-center gap-6 px-5 pb-10 pt-2">
        <TalkButton active={state === "listening"} onPressStart={() => void startTalk()} onPressEnd={endTalk} />
        {process.env.NODE_ENV === "development" && <DevStateControls state={state} onEvent={onDevEvent} />}
      </footer>
    </div>
  );
}

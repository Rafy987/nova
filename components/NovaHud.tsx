"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Orb, { type WordBeat } from "@/components/orb/Orb";
import AudioToggles from "@/components/hud/AudioToggles";
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
import { trimHistory } from "@/lib/chat/history";
import { ChatError, streamChat } from "@/lib/chat/client";
import { CHAT_ERROR_MESSAGES, type ChatMessage } from "@/lib/chat/types";
import { detectReplyStyle } from "@/lib/chat/replyStyle";
import { createSentenceChunker } from "@/lib/tts/sentences";
import { FALLBACK_LANG, pickVoice } from "@/lib/tts/voices";
import { createSpeechQueue, isTtsSupported, loadVoices, type SpeechQueue } from "@/lib/tts/speechQueue";
import { playCue } from "@/lib/sounds";
import { getServerUserName, getUserName, setUserName, subscribeUserName } from "@/lib/userProfile";
import { micMessage, useMicLevel } from "@/hooks/useMicLevel";
import { usePushToTalk } from "@/hooks/usePushToTalk";

const MODULES = ["Weather", "Time / Zones", "Calculator", "Reminders", "Notes"];

/** If the speech service never confirms the end after release, continue anyway. */
const STOP_TIMEOUT_MS = 2500;

/** If the voice never reports "done" (e.g. online voice offline), end speaking after a sensible time. */
const speakTimeoutMs = (chars: number) => Math.max(5000, chars * 110);

/** Client shell: owns NOVA's state, the microphone, speech-to-text and the conversation. */
export default function NovaHud() {
  const [state, setStateValue] = useState<NovaState>("idle");
  const stateRef = useRef<NovaState>("idle"); // latest state for async callbacks
  const [errorText, setErrorText] = useState<string | null>(null);
  const [live, setLive] = useState<Transcript>(EMPTY_TRANSCRIPT); // what the user is saying now
  const [turns, setTurns] = useState<ChatMessage[]>([]); //          session memory
  const turnsRef = useRef<ChatMessage[]>([]);
  const [reply, setReply] = useState<string | null>(null); //       NOVA's reply while streaming
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [notice, setNotice] = useState<string | null>(null); // non-error hint under the orb
  const [lang, setLang] = useState<SpeechLang>("en-US");
  const userName = useSyncExternalStore(subscribeUserName, getUserName, getServerUserName);

  const mic = useMicLevel();
  const sttRef = useRef<SttProvider | null>(null);
  const talkingRef = useRef(false); // true while the talk key/button is held
  const stopTimerRef = useRef<number | undefined>(undefined);
  const latestRef = useRef<Transcript>(EMPTY_TRANSCRIPT); // last text heard, for the timeout
  const chatAbortRef = useRef<AbortController | null>(null);
  const speechRef = useRef<SpeechQueue | null>(null);
  const speakTimerRef = useRef<number | undefined>(undefined);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const wordBeatRef = useRef<WordBeat>({ seen: false, last: 0 });

  useEffect(
    () => () => {
      window.clearTimeout(stopTimerRef.current);
      window.clearTimeout(speakTimerRef.current);
      chatAbortRef.current?.abort();
      speechRef.current?.cancel();
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

  function addTurn(m: ChatMessage) {
    turnsRef.current = [...turnsRef.current, m];
    setTurns(turnsRef.current);
  }

  /** Stop any reply in progress (text stream + voice). Partial text stays in memory. */
  function cancelReply() {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    stopSpeaking();
  }

  function stopSpeaking() {
    window.clearTimeout(speakTimerRef.current);
    speechRef.current?.cancel();
    speechRef.current = null;
  }

  /** Voice for this reply, or null (voice off / unsupported / no Urdu voice). */
  function createSpeech(userText: string, onDone: () => void): SpeechQueue | null {
    if (!voiceOn || !isTtsSupported()) return null;
    const style = detectReplyStyle(userText);
    const voices = voicesRef.current.length ? voicesRef.current : speechSynthesis.getVoices();
    const voice = pickVoice(voices, style);
    if (style === "urdu-script" && !voice) {
      setNotice("No Urdu voice in this browser. Try Microsoft Edge.");
      return null;
    }
    wordBeatRef.current = { seen: false, last: 0 };
    return createSpeechQueue({
      voice,
      lang: FALLBACK_LANG[style],
      onBoundary: () => {
        wordBeatRef.current = { seen: true, last: performance.now() };
      },
      onDone,
    });
  }

  /**
   * Online "Natural" voices need a server connection before the first word (~1-3 s).
   * Speak one silent word while the user is still talking so the real reply starts faster.
   */
  function warmUpVoice(voices: SpeechSynthesisVoice[]) {
    const voice = pickVoice(voices, "english");
    if (!voice || voice.localService) return;
    const u = new SpeechSynthesisUtterance("ok");
    u.voice = voice;
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  function toggleVoice() {
    if (voiceOn) {
      stopSpeaking();
      // Text already finished? Then speaking is over.
      if (stateRef.current === "speaking" && !chatAbortRef.current) send("REPLY_END");
    }
    setVoiceOn((v) => !v);
  }

  // ───────── Listening ─────────

  async function startTalk() {
    if (talkingRef.current || !canTransition(stateRef.current, "LISTEN")) return;
    if (!stt().isSupported()) {
      fail(STT_MESSAGES.unsupported);
      return;
    }

    cancelReply(); // barge-in: user talks over NOVA (stops voice immediately)
    setNotice(null);
    // Load voices inside a user gesture so they are ready when the reply arrives
    if (isTtsSupported() && voicesRef.current.length === 0) {
      void loadVoices().then((v) => {
        voicesRef.current = v;
        if (voiceOn) warmUpVoice(v);
      });
    }
    talkingRef.current = true;
    setLive(EMPTY_TRANSCRIPT);
    latestRef.current = EMPTY_TRANSCRIPT;
    if (soundOn) playCue("start");
    send("LISTEN");

    stt().start({
      onPartial: (t) => {
        latestRef.current = t;
        setLive(t);
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
    setLive(EMPTY_TRANSCRIPT);
    if (!text) {
      send("CANCEL");
      return;
    }
    send("STOP_LISTENING");
    void askNova(text);
  }

  function handleSttError(code: SttErrorCode) {
    fail(STT_MESSAGES[code]);
  }

  // ───────── Thinking + reply ─────────

  async function askNova(userText: string) {
    addTurn({ role: "user", content: userText });
    const controller = new AbortController();
    chatAbortRef.current = controller;
    setReply("");

    // Voice: speak each sentence as soon as it is complete.
    const chunker = createSentenceChunker();
    const speech = createSpeech(userText, () => {
      if (speechRef.current !== speech) return; // an old reply
      speechRef.current = null;
      window.clearTimeout(speakTimerRef.current);
      if (stateRef.current === "speaking") send("REPLY_END");
    });
    speechRef.current = speech;

    let full = "";
    let started = false;
    try {
      full = await streamChat({
        messages: trimHistory(turnsRef.current),
        lang,
        userName,
        signal: controller.signal,
        onToken: (piece, soFar) => {
          full = soFar;
          if (!started) {
            started = true;
            send("REPLY_START"); // thinking -> speaking on the first token
          }
          setReply(soFar);
          for (const sentence of chunker.push(piece)) speech?.enqueue(sentence);
        },
      });
    } catch (err) {
      const partial = full.trim();
      setReply(null);
      if (partial) addTurn({ role: "assistant", content: partial });
      if (controller.signal.aborted) return; // barge-in or clear: not an error
      if (speechRef.current === speech) stopSpeaking();
      fail(err instanceof ChatError ? CHAT_ERROR_MESSAGES[err.code] : CHAT_ERROR_MESSAGES.upstream);
      return;
    } finally {
      if (chatAbortRef.current === controller) chatAbortRef.current = null;
    }

    setReply(null);
    const text = full.trim();
    if (text) addTurn({ role: "assistant", content: text });

    if (stateRef.current === "thinking") {
      send("RESET"); // empty reply
      return;
    }

    // Text is done. "Speaking" ends when the voice finishes (or right now if there is no voice).
    if (speech && !speech.cancelled && speechRef.current === speech) {
      for (const sentence of chunker.flush()) speech.enqueue(sentence);
      speech.finish();
      speakTimerRef.current = window.setTimeout(() => {
        if (speechRef.current !== speech) return;
        stopSpeaking();
        if (stateRef.current === "speaking") send("REPLY_END");
      }, speakTimeoutMs(text.length));
    } else if (stateRef.current === "speaking") {
      send("REPLY_END");
    }
  }

  function clearConversation() {
    cancelReply();
    turnsRef.current = [];
    setTurns([]);
    setReply(null);
    if (stateRef.current === "thinking" || stateRef.current === "speaking") send("RESET");
  }

  usePushToTalk(startTalk, endTalk);

  function onDevEvent(e: NovaEvent) {
    if (e === "LISTEN") void startTalk();
    else if (e === "STOP_LISTENING") endTalk();
    else {
      if (e === "CANCEL" || e === "FAIL" || e === "RESET") {
        talkingRef.current = false;
        stt().abort();
        cancelReply();
      }
      send(e);
    }
  }

  return (
    <div className="relative z-10 flex flex-1 flex-col">
      <StatusBar
        micStatus={mic.status}
        lang={lang}
        onLangChange={changeLang}
        langLocked={state === "listening"}
        userName={userName}
        onSaveUserName={setUserName}
      />

      <main className="grid flex-1 grid-cols-1 items-center gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        {/* Center: orb + state (first on mobile) */}
        <div className="flex flex-col items-center lg:order-2">
          <Orb state={state} micLevelRef={mic.levelRef} wordBeatRef={wordBeatRef} />
          <StatusPill state={state} detail={errorText ?? notice} />
        </div>

        <TranscriptPanel
          turns={turns}
          live={live}
          reply={reply}
          listening={state === "listening"}
          lang={lang}
          onClear={clearConversation}
          clearDisabled={state === "listening"}
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
        <AudioToggles
          voiceOn={voiceOn}
          onToggleVoice={toggleVoice}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((v) => !v)}
        />
        {process.env.NODE_ENV === "development" && <DevStateControls state={state} onEvent={onDevEvent} />}
      </footer>
    </div>
  );
}

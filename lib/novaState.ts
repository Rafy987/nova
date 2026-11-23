/**
 * NOVA's state machine (pure, no React).
 *
 *   idle ──LISTEN──▶ listening ──STOP_LISTENING──▶ thinking ──REPLY_START──▶ speaking ──REPLY_END──▶ idle
 *                       │ CANCEL ▶ idle                                     │ LISTEN (barge-in) ▶ listening
 *   any ──FAIL──▶ error ──RESET / LISTEN──▶ ...
 */

export type NovaState = "idle" | "listening" | "thinking" | "speaking" | "error";

export type NovaEvent =
  | "LISTEN" //         user starts talking (push-to-talk down)
  | "STOP_LISTENING" // user stops talking -> send to the model
  | "CANCEL" //         nothing heard / user aborted
  | "REPLY_START" //    first audio of the answer starts
  | "REPLY_END" //      answer finished speaking
  | "FAIL" //           any error
  | "RESET"; //         back to idle

const TRANSITIONS: Record<NovaState, Partial<Record<NovaEvent, NovaState>>> = {
  idle: { LISTEN: "listening", FAIL: "error" },
  listening: { STOP_LISTENING: "thinking", CANCEL: "idle", FAIL: "error", RESET: "idle" },
  thinking: { REPLY_START: "speaking", LISTEN: "listening", FAIL: "error", RESET: "idle" },
  speaking: { REPLY_END: "idle", LISTEN: "listening", FAIL: "error", RESET: "idle" },
  error: { RESET: "idle", LISTEN: "listening" },
};

/** Next state for an event. Invalid events are ignored (state stays the same). */
export function transition(state: NovaState, event: NovaEvent): NovaState {
  return TRANSITIONS[state][event] ?? state;
}

export function canTransition(state: NovaState, event: NovaEvent): boolean {
  return TRANSITIONS[state][event] !== undefined;
}

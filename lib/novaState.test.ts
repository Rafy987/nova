import { describe, expect, it } from "vitest";
import { canTransition, transition } from "./novaState";

describe("NOVA state machine", () => {
  it("runs the happy path idle → listening → thinking → speaking → idle", () => {
    let s = transition("idle", "LISTEN");
    expect(s).toBe("listening");
    s = transition(s, "STOP_LISTENING");
    expect(s).toBe("thinking");
    s = transition(s, "REPLY_START");
    expect(s).toBe("speaking");
    s = transition(s, "REPLY_END");
    expect(s).toBe("idle");
  });

  it("supports barge-in: speaking → listening", () => {
    expect(transition("speaking", "LISTEN")).toBe("listening");
  });

  it("cancel while listening returns to idle", () => {
    expect(transition("listening", "CANCEL")).toBe("idle");
  });

  it("any active state can fail, and error resets to idle", () => {
    for (const s of ["idle", "listening", "thinking", "speaking"] as const) {
      expect(transition(s, "FAIL")).toBe("error");
    }
    expect(transition("error", "RESET")).toBe("idle");
  });

  it("ignores invalid events", () => {
    expect(transition("idle", "REPLY_END")).toBe("idle");
    expect(transition("idle", "STOP_LISTENING")).toBe("idle");
    expect(canTransition("idle", "REPLY_START")).toBe(false);
    expect(canTransition("idle", "LISTEN")).toBe(true);
  });
});

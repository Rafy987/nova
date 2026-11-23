import { describe, expect, it } from "vitest";
import { cleanText, fullText, joinResults } from "./transcript";
import { isTypingTarget } from "./keyboard";

describe("joinResults", () => {
  it("separates final and interim text", () => {
    const t = joinResults([
      { transcript: "what is", isFinal: true },
      { transcript: " the weather", isFinal: true },
      { transcript: " in lahore", isFinal: false },
    ]);
    expect(t).toEqual({ final: "what is the weather", interim: "in lahore" });
  });

  it("handles no results", () => {
    expect(joinResults([])).toEqual({ final: "", interim: "" });
  });
});

describe("cleanText / fullText", () => {
  it("collapses whitespace", () => {
    expect(cleanText("  hello   there \n")).toBe("hello there");
  });
  it("joins final + interim", () => {
    expect(fullText({ final: "set a timer", interim: "for five minutes" })).toBe(
      "set a timer for five minutes",
    );
    expect(fullText({ final: "", interim: "" })).toBe("");
  });
});

describe("isTypingTarget", () => {
  it("is true for text fields and contenteditable", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "textarea" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });
  it("is false for buttons, body and null", () => {
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget({ tagName: "BODY" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

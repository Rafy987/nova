import { describe, expect, it } from "vitest";
import { createSentenceChunker } from "./sentences";
import { pickVoice, type VoiceInfo } from "./voices";

describe("sentence chunker", () => {
  it("emits complete sentences and keeps the rest", () => {
    const c = createSentenceChunker();
    expect(c.push("Hello there. How are you? I'm")).toEqual(["Hello there.", "How are you?"]);
    expect(c.flush()).toEqual(["I'm"]);
  });

  it("works when sentences arrive in small pieces", () => {
    const c = createSentenceChunker();
    const out = [...c.push("Hel"), ...c.push("lo. Wo"), ...c.push("rld! "), ...c.flush()];
    expect(out).toEqual(["Hello.", "World!"]);
  });

  it("waits for a space, so decimals and abbreviations are not cut", () => {
    const c = createSentenceChunker();
    expect(c.push("Pi is 3.")).toEqual([]);
    expect(c.push("14 today. Dr. Khan, e.g. a doctor, agrees. A. Rafay too. Ok")).toEqual([
      "Pi is 3.14 today.",
      "Dr. Khan, e.g. a doctor, agrees.",
      "A. Rafay too.",
    ]);
  });

  it("splits Urdu sentences", () => {
    const c = createSentenceChunker();
    expect(c.push("یہ اچھا ہے۔ آپ کیسے ہیں؟ ")).toEqual(["یہ اچھا ہے۔", "آپ کیسے ہیں؟"]);
  });

  it("splits on newlines and cuts very long text", () => {
    const c = createSentenceChunker(40);
    expect(c.push("Line one\nLine two\n")).toEqual(["Line one", "Line two"]);
    const long = c.push("word ".repeat(30));
    expect(long.length).toBeGreaterThan(0);
    for (const s of long) expect(s.length).toBeLessThanOrEqual(40);
  });
});

const v = (name: string, lang: string, localService = false): VoiceInfo => ({ name, lang, localService });
const EDGE = [
  v("Microsoft David - English (United States)", "en-US", true),
  v("Microsoft Zira - English (United States)", "en-US", true),
  v("Microsoft Ava Multilingual Online (Natural) - English (United States)", "en-US"),
  v("Microsoft Ava Online (Natural) - English (United States)", "en-US"),
  v("Microsoft Neerja Online (Natural) - English (India)", "en-IN"),
  v("Microsoft Asad Online (Natural) - Urdu (Pakistan)", "ur-PK"),
];
const CHROME = [
  v("Microsoft Zira - English (United States)", "en-US", true),
  v("Google US English", "en-US"),
  v("Google हिन्दी", "hi-IN"),
];
const ELECTRON = [v("Microsoft Zira - English (United States)", "en-US", true)];

describe("pickVoice", () => {
  it("prefers natural English voices", () => {
    expect(pickVoice(EDGE, "english")?.name).toBe("Microsoft Ava Online (Natural) - English (United States)");
    expect(pickVoice(CHROME, "english")?.name).toBe("Google US English");
    expect(pickVoice(ELECTRON, "english")?.name).toContain("Zira");
  });

  it("uses an Indian-English voice for Roman Urdu, else English", () => {
    expect(pickVoice(EDGE, "roman-urdu")?.lang).toBe("en-IN");
    expect(pickVoice(CHROME, "roman-urdu")?.name).toBe("Google US English");
  });

  it("returns an Urdu voice only when one exists", () => {
    expect(pickVoice(EDGE, "urdu-script")?.lang).toBe("ur-PK");
    expect(pickVoice(CHROME, "urdu-script")).toBeNull(); // Hindi is not Urdu
    expect(pickVoice([], "english")).toBeNull();
  });
});

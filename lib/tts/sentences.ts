/**
 * Split streaming text into sentences so NOVA can start speaking the first one early.
 * A sentence ends at . ! ? (and Urdu ۔ ؟) FOLLOWED BY whitespace — waiting for the space
 * means "3.5" or "e.g." mid-stream are never cut. Newlines also end a sentence.
 */

// Words that end with "." but don't end a sentence.
const ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "vs", "e.g", "i.e", "approx", "mt"]);

const BOUNDARY = /(?:[.!?۔؟]+["'”’)\]]*\s+|\n+)/g;

function isAbbreviation(textBeforeDot: string): boolean {
  const word = /(\S+)$/.exec(textBeforeDot)?.[1]?.toLowerCase() ?? "";
  if (ABBREVIATIONS.has(word)) return true;
  return /^[a-z]$/i.test(word); // initials like "A. Khan"
}

export function createSentenceChunker(maxLen = 220) {
  let buffer = "";

  function cutLong(out: string[]) {
    // No punctuation for a long time: cut at a comma or space so speech isn't delayed.
    while (buffer.length > maxLen) {
      const head = buffer.slice(0, maxLen);
      let cut = Math.max(head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf("، "));
      if (cut < maxLen * 0.4) cut = head.lastIndexOf(" ");
      if (cut <= 0) cut = maxLen;
      out.push(buffer.slice(0, cut + 1).trim());
      buffer = buffer.slice(cut + 1);
    }
  }

  return {
    /** Add streamed text; returns sentences that are now complete. */
    push(text: string): string[] {
      buffer += text;
      const out: string[] = [];
      let start = 0;
      BOUNDARY.lastIndex = 0;
      for (let m = BOUNDARY.exec(buffer); m; m = BOUNDARY.exec(buffer)) {
        const end = m.index + m[0].length;
        const isSingleDot = m[0].trimEnd() === ".";
        if (isSingleDot && isAbbreviation(buffer.slice(start, m.index))) continue;
        const sentence = buffer.slice(start, end).trim();
        if (sentence) out.push(sentence);
        start = end;
      }
      buffer = buffer.slice(start);
      cutLong(out);
      return out;
    },

    /** Stream finished: return whatever is left. */
    flush(): string[] {
      const rest = buffer.trim();
      buffer = "";
      return rest ? [rest] : [];
    },
  };
}

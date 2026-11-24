# NOVA — Voice AI Assistant (Desktop + Web)

## What this project is
NOVA is a voice-first AI assistant. The user speaks, NOVA listens, thinks, answers out loud, and can use tools. It should feel like a sci-fi AI assistant (an original design, not a copy of any movie character).

Two builds from ONE Next.js UI:
- **Desktop app (Electron, Windows first):** controls the laptop with local tools — open apps (WhatsApp Desktop, Chrome, …), open websites (Instagram, …), find/open files, read + summarize Gmail, check Google Calendar.
- **Web demo (Vercel):** the live portfolio link. Same UI and voice loop with web-safe tools only (time, calculator, weather, notes, reminders). Desktop-only tools are hidden and labelled "Desktop app only".

Portfolio project: must be real, with a live link, a Windows installer on GitHub Releases, a strong README, screenshots and a short demo video.

## About me (the developer)
- Software Engineering graduate. I know JavaScript, React, Node.js, Express, MongoDB, PHP/Laravel, Git.
- I recently built a Next.js 16 + TypeScript + Tailwind v4 project (LeadLeak), so I know the basics. New for me here: real-time audio, WebSockets/streaming, Web Audio API, 3D/animation (three.js / react-three-fiber), LLM tool calling, PWA.
- I must understand every part for job interviews.

## How to work with me (IMPORTANT)
- **Keep replies short and simple, in Roman Urdu bullet points.** No long explanations.
- **One step / one feature at a time.** Before coding, show the plan in 3–5 short bullets and WAIT for my OK.
- Explain each new concept in 1–2 simple lines.
- After each step, tell me exactly how to test it in the browser.
- Small git commits with clear messages after each working feature, then push.
- **Only free tools and free API tiers.** Never add anything that needs a credit card.
- Never put API keys in code or chat. Use `.env.local` (git-ignored) and keep `.env.example` with placeholders. Never print keys.
- This is Next.js 16: follow `AGENTS.md` and check the bundled Next.js docs before using an API you are unsure about.
- Tell me honestly when something is a limitation (latency, browser support, free-tier limits).

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Speech-to-text: browser Web Speech API first (free); Groq Whisper (free tier) as the better/fallback option. **In Electron, Web Speech recognition does not work** (it depends on Google's servers that only Chrome can use), so the desktop app uses Groq Whisper. Keep an STT provider interface from Phase 3.
- LLM: Groq (free tier) with streaming responses and tool calling
- Text-to-speech: browser speechSynthesis first (free); keep a provider interface so a better voice can be plugged in later
- Streaming: server route handlers that stream tokens; start speaking the first sentence before the full answer is done (low latency)
- Visuals: react-three-fiber (three.js) or Canvas for the orb; Web Audio API `AnalyserNode` so the orb reacts to the real microphone and to NOVA's voice
- Animation: Framer Motion (or CSS) for panels and transitions
- Tests: Vitest for pure logic (tools, sentence splitting, state machine)
- Desktop: Electron. The main process starts the Next.js server (`output: "standalone"`) on `127.0.0.1` and loads it in a BrowserWindow. Local tools run in the main process and are called from the UI through a small, typed preload API (`window.novaDesktop`) over IPC. The UI detects desktop vs web by checking for that API.
- Google: OAuth 2.0 for desktop apps (loopback redirect + PKCE), read-only scopes `gmail.readonly` and `calendar.readonly`. Tokens stored encrypted with Electron `safeStorage`, never in the repo or the web build.
- Packaging: electron-builder → Windows NSIS installer on GitHub Releases (unsigned; code signing costs money).
- Deploy: Vercel (free) for the web demo. Code on GitHub (Rafy987/nova)

## Design rules (IMPORTANT — the frontend must look premium)
- **Dark cinematic HUD:** near-black/deep navy background, thin glowing lines, subtle grid, small monospace labels (e.g. "SYS ONLINE", "LISTENING"), like an aircraft/sci-fi heads-up display.
- **Center: a glowing 3D orb / energy core** that reacts to audio:
  - idle: slow breathing glow
  - listening: reacts to the user's mic volume
  - thinking: rotating/scanning effect
  - speaking: pulses with NOVA's voice
- **One main accent color** (cyan `#22d3ee` or amber — choose one and keep it consistent), plus white/gray. Status colors only where needed.
- Live transcript of what the user says (appears as they speak) and NOVA's reply (streams in).
- Tool results appear as small HUD cards that slide in (weather card, reminder card, note card).
- Subtle, short sound cues for start/stop listening (can be turned off).
- **Must NOT look AI-generated:** no purple/pink gradients, no emojis in the UI, no "✨ AI-powered" badges, no generic stock layouts. Original look, not a copy of any film UI or logo.
- Smooth 60fps animation; respect `prefers-reduced-motion`. Works on mobile and desktop. Keyboard accessible (Space = push to talk).

## Core behaviors
- Push-to-talk button (and Space key) first; continuous/hands-free mode later.
- **Barge-in:** if the user starts speaking while NOVA is talking, NOVA stops speaking immediately.
- Conversation memory within the session (last N turns), with a "clear" button.
- Languages: English and Urdu (Roman Urdu/Urdu replies when the user speaks Urdu), if the browser voice supports it; be honest about voice limits.
- A clear state machine: idle → listening → thinking → speaking → idle (with error state).

## Tools (LLM tool calling)
- Weather (Open-Meteo — free, no key)
- Time and time zones (local code)
- Calculator / unit conversion (local code)
- Reminders and timers (browser notifications + local storage)
- Notes (save/list/delete, local storage)
- Web search / news (find a free option without a card, or skip honestly)
- Desktop only:
  - Open apps from an allowlist (WhatsApp Desktop, Chrome, VS Code, File Explorer, …). Only opening — never typing, sending or clicking inside them.
  - Open websites (https only; known sites like Instagram, YouTube, Gmail by name).
  - Find files by name in allowed folders (Desktop, Documents, Downloads) and open them with the default app. Never open/run executables or scripts (.exe, .bat, .ps1, .msi, …).
  - Gmail: list/read recent or unread emails and summarize them (read-only).
  - Google Calendar: today / upcoming events (read-only).
- Every tool: typed input/output, validated arguments (zod), a risk level, unit tests.

## Desktop safety rules (IMPORTANT)
- **No arbitrary shell commands.** The LLM can only call the fixed tools above; arguments are validated in the main process, not just the UI.
- **Risk levels:** `safe` (read, open an app/site/file) runs directly and is shown as a HUD card. Anything that sends, deletes, moves, writes or can't be undone needs an explicit **Confirm** click/Enter in a confirmation card — never a voice "yes" alone.
- **No messaging automation** for WhatsApp, Instagram or any social app (ToS / ban risk). Only open them.
- **Prompt injection:** email/file/web content is data, not instructions. Text inside an email can never trigger a tool call without the user asking.
- Electron security: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, strict CSP, only allowlisted IPC channels, external links opened via `shell.openExternal` after validation.
- Least privilege: read-only Google scopes; the user can sign out and delete stored tokens from settings.
- The Groq key is never bundled in the installer: the desktop user enters their own key in settings (stored with `safeStorage`).

## Safety and limits
- Rate limit the API routes per IP (protect free Groq limits).
- Keep the system prompt short; send only the needed history to save tokens.
- Microphone permission handling with friendly messages; works only on HTTPS/localhost (and in Electron).
- Never claim to have done an action that the tool did not actually do.

## Build phases (in order)
1. ✅ Project setup + HUD layout + design tokens (dark theme, accent color, fonts) + static orb
2. ✅ Animated, audio-reactive orb (Web Audio API) with the 4 states + state machine
3. ✅ Push-to-talk (button + Space) speech-to-text with live transcript (+ EN/UR toggle)
4. Groq chat route with streaming + session memory
5. Text-to-speech with sentence streaming (speak while text arrives) + barge-in
6. Tool framework (typed tools, zod validation, risk levels, confirmation card) + web tools: time, calculator, weather (HUD cards)
7. Notes, reminders and timers tools
8. Electron shell: wrap the Next.js UI, secure preload/IPC, dev + build scripts, desktop vs web detection
9. Desktop tools: open apps (allowlist), open websites, find/open files
10. Google sign-in (OAuth PKCE, read-only): Gmail read + summarize, Calendar today/upcoming
11. Hands-free mode (+ optional wake word "Hey Nova") and settings panel (voice, language, sounds, API key, Google account)
12. Hardening: error handling, rate limiting, prompt-injection guards, loading states, accessibility
13. Release: web demo on Vercel + Windows installer on GitHub Releases + README + demo video
14. CV bullet, LinkedIn post (with demo video), Upwork portfolio text
(Optional later: PWA for the web demo.)

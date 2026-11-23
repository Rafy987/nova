# NOVA — Live Voice AI Assistant

## What this project is
NOVA is a voice-first AI assistant in the browser. The user speaks, NOVA listens, thinks, answers out loud, and can use tools (weather, reminders, notes, web search, calculator, time zones). It should feel like a sci-fi AI assistant (an original design, not a copy of any movie character).

Portfolio project: it must be real, deployed on Vercel with a live link, with a strong README, screenshots and a short demo GIF/video. Later it becomes an installable mobile app (PWA), and maybe a React Native app.

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
- Speech-to-text: browser Web Speech API first (free); Groq Whisper (free tier) as the better/fallback option
- LLM: Groq (free tier) with streaming responses and tool calling
- Text-to-speech: browser speechSynthesis first (free); keep a provider interface so a better voice can be plugged in later
- Streaming: server route handlers that stream tokens; start speaking the first sentence before the full answer is done (low latency)
- Visuals: react-three-fiber (three.js) or Canvas for the orb; Web Audio API `AnalyserNode` so the orb reacts to the real microphone and to NOVA's voice
- Animation: Framer Motion (or CSS) for panels and transitions
- Tests: Vitest for pure logic (tools, sentence splitting, state machine)
- Deploy: Vercel (free). Code on GitHub (Rafy987/nova)

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
- Every tool: typed input/output, validated arguments, unit tests.

## Safety and limits
- Rate limit the API routes per IP (protect free Groq limits).
- Keep the system prompt short; send only the needed history to save tokens.
- Microphone permission handling with friendly messages; works only on HTTPS/localhost.
- Never claim to have done an action that the tool did not actually do.

## Build phases (in order)
1. Project setup + HUD layout + design tokens (dark theme, accent color, fonts) + static orb
2. Animated, audio-reactive orb (Web Audio API) with the 4 states
3. Push-to-talk speech-to-text with live transcript
4. Groq chat route with streaming + session memory
5. Text-to-speech with sentence streaming (speak while text arrives) + barge-in
6. Tool calling: time, calculator, weather (with HUD cards)
7. Reminders, timers and notes tools
8. Hands-free mode (+ optional wake word "Hey Nova") and settings panel (voice, language, sounds)
9. Error handling, rate limiting, loading states, accessibility
10. Deploy on Vercel + README + demo GIF
11. PWA: installable on phones (manifest, icons, offline shell)
12. CV bullet, LinkedIn post (with demo video), Upwork portfolio text

# Ready2Interview

**Practice the interview before the real one.**

A voice-first English job-interview practice simulator. Meet Sarah or David in a professional virtual interview room, answer by microphone or typing, earn career-training XP, and receive a practical training report.

> **Learning tool only:** Scores and coaching are for practice, not a real hiring assessment.

## What works

- **Reliable English interview practice:** a staged interview moves through introduction, background, role skills, collaboration, problem solving, impact, growth, and candidate questions/closing.
- **24 career paths:** General / Any Job, Software Engineering, Information Systems, Cybersecurity, AI / Machine Learning, Data Analysis / Data Science, IT Support, Product Management, Project Management, Marketing, Finance / Accounting, Human Resources, Sales, UX/UI Design, Business Analysis, Customer Service, Healthcare / Nursing, Education / Teaching, Engineering, Administrative / Office, Operations / Supply Chain, Legal / Law, Graphic Design / Creative, and Hospitality / Tourism.
- **Sarah or David:** visibly distinct professional interviewer portraits, matching participant identity, personality choices, and browser voice preference when a suitable installed voice is available.
- **Real conversation fallback:** deterministic stages never break, while local analysis can ask one targeted follow-up about missing ownership, detail, results, or measurement. Optional AI can add a bounded answer-specific follow-up using a small in-session evidence summary.
- **Clear voice and typed answering:** use **Answer with Microphone** to convert speech into editable text, see a visible Listening state, then Stop Listening or Finish Answer. Typing remains available when microphone access or speech recognition is unavailable.
- **Practice / Real Interview modes:** Practice pauses after each answer with concise answer-derived feedback and Continue, Retry, and Hear Feedback actions. Real mode keeps detailed coaching for the final report and limits learning aids during the live interview.
- **Career game layer:** XP, levels, streaks, achievements, **+30 sec Extra Time**, Hint, Second Chance, 2× XP, and question replay stay in browser `localStorage`.
- **Demo speed:** a three-question path and short preparation timers let a reviewer see the full flow in about a minute.
- **Partial reports:** End Interview safely creates a report from completed answers instead of losing progress.

## Languages and translations

The reliable spoken and locally scored interview language is **English** in this iteration.

The interface and supplemental translation system supports:

- English
- Arabic (with RTL interface layout)
- Spanish
- French
- German
- Hindi

Choose an interface language and translation language on the setup screen. During an interview, change the translation language or toggle subtitles without restarting. English source questions remain visible; the selected translation appears beneath them. Report translations work the same way globally and on each feedback card.

The candidate's original spoken/transcribed or typed answer is always preserved exactly as submitted. The app never replaces it with a translation.

## Run without AI — complete fallback

1. Double-click `index.html` and open it in Microsoft Edge or Google Chrome.
2. Enter the name you want to use for this interview, then choose a career, language preferences, interviewer, and **Demo speed** if you want a short run. The name stays only in the current browser session.
3. Use the Sun/Moon button in the header to choose light or dark mode. That visual preference stays in this browser.
4. Start the interview. Type answers or use browser microphone recognition when it is available.

The fallback is complete: deterministic interview stages, professional office UI, contextual local follow-ups, immediate Practice feedback, scoring, multilingual subtitles/translations, XP, power-ups, and a detailed final report all work with no key, no server, and no network.

Use **Preview an example report** to see invented demo content immediately.

## Manual UI quality check

Before presenting the app, use **Demo speed** to complete setup → interview → feedback → report in about a minute. Check the same path with typing only, keyboard navigation, and an unavailable microphone.

- Review the compact phone journey at 360×800, 375×812, 390×844, 412×915, and 430×932, plus tablet, desktop, and phone landscape. Check more than overflow: the header/HUD must remain fully visible, setup cards must be touch-friendly, Sarah or David must stay visible with each question, and answer/feedback/report controls must remain easy to reach.
- Check both light and dark themes on setup, interview, feedback, the End Interview dialog, and the report. While answering, verify the clock-led Answer Time countdown, the +30 sec Extra Time result (including after 0:00), and the clear Listening state; reload after switching each theme to confirm the browser-local preference persists without changing game progress or language preferences.
- Switch the interface through Arabic (RTL), German, and Hindi: localized chrome, the candidate field, selected cards, interview identity panel, dialog, and report must wrap cleanly; English interview prompts must remain LTR.
- Verify blank and whitespace-only names are blocked with a focused inline error. Complete a real report and confirm the candidate name is shown only for that active session, never on the example report.
- After each real next question, keyboard focus should land on the visible question; it must never remain in hidden feedback. Check reduced motion and forced-colors modes retain a visible focus indicator.

## Optional live AI follow-ups and report coaching

The AI path is optional. It only adds a bounded, answer-specific follow-up and optional coaching; it never controls or can break the core interview sequence.

1. Create `.env` in this project folder from `.env.example`.
2. Add your own key locally:

   ```env
   ANTHROPIC_API_KEY=your-real-key-goes-here
   ```

3. Start the local-only server:

   ```bash
   python server/server.py
   ```

   On some Mac/Linux systems use `python3 server/server.py`.

4. Open [http://localhost:5000](http://localhost:5000).

The server binds only to `127.0.0.1`, so it is not exposed to the local network.

### Privacy and key safety

- `.env` is ignored by Git and must never be committed.
- Only `server/server.py` reads the API key.
- The browser calls only narrow local routes: `/api/status`, `/api/follow-up`, and `/api/report`.
- The browser never receives the API key, server prompts, provider diagnostics, or raw provider response.
- The fallback path keeps all practice text in the browser. In optional AI mode, the answer/question data needed for the follow-up or report is sent through the local proxy to Anthropic; the app itself does not save interview text to GitHub or a database.
- If the key, AI service, microphone, speech recognition, or text-to-speech fails, the visible English question and typed-answer path still work.

## GitHub Pages note

GitHub Pages can host the complete static fallback app, but it cannot safely store a secret key or run the local Python proxy. For an AI-enabled public deployment, use a secure server-side or serverless proxy that keeps the same narrow request validation and holds the key as a secret.

## Project structure

```text
index.html              Single-screen setup → interview → report experience
css/style.css           Responsive office scene, RTL, accessibility styles
js/i18n.js              Six-language registry, UI strings, browser preferences
js/interview-state.js   Explicit lifecycle transitions and control rules
js/questions.js         Career catalog and deterministic staged question plans
js/speech.js            Cancellation-safe browser TTS/STT wrapper
js/ai.js                Narrow client for the local secure proxy
js/feedback.js          Offline English scoring and multilingual report fallback
js/game.js              Browser-only XP, streaks, achievements, and power-ups
js/ui.js                Icons, HUD, toasts, and compact power-up rendering
js/app.js               Interview flow, recovery controls, translation rendering
server/server.py        Local-only standard-library AI proxy
sample-data/data.js     Completely invented example interview
.env.example            Key variable name only
```

Built with Claude Code during the KKU Claude Code hackathon.
Started on 2026-10-01.

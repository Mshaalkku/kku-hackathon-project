/* ===========================================================
   Interview Quest — AI layer (client side)
   Talks ONLY to our own local proxy (server/server.py) at
   /api/chat — the Anthropic API key never reaches the browser.
   If the proxy or key is missing, every call here rejects and
   app.js falls back to the rule-based interview automatically.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const REPORT_SCHEMA_HINT =
    '{"overallScore": number 0-100, "strengths": [string, ...2-4], "weaknesses": [string, ...2-4], ' +
    '"englishFeedback": string, "perQuestion": [{"question": string, "tip": string, "improvedExample": string}, ...], ' +
    '"nextSteps": [string, ...2-3]}';

  const PERSONALITY_DESC = {
    friendly: "warm, encouraging, puts the candidate at ease, light small talk, genuinely supportive tone",
    professional: "neutral, courteous, efficient — a standard calm corporate interview tone",
    strict: "formal and terse, minimal small talk, higher expectations, presses for specifics",
  };

  async function checkStatus() {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.aiAvailable;
    } catch (e) {
      return false;
    }
  }

  async function chat(system, messages, maxTokens) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages, max_tokens: maxTokens || 400 }),
    });
    if (!res.ok) throw new Error("network_error");
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "ai_error");
    return data.text;
  }

  function buildSystemPrompt(ctx) {
    const personality = PERSONALITY_DESC[ctx.personality] || PERSONALITY_DESC.professional;
    return [
      `You are ${ctx.interviewerName}, a professional job interviewer conducting a realistic, SPOKEN-style mock interview for a ${ctx.roleLabel} position at ${ctx.difficulty} difficulty.`,
      "This is a PRACTICE tool for an English-language learner rehearsing job interviews — not a real hiring decision.",
      "",
      "Rules:",
      "- Speak naturally, like a real spoken interview: short, warm or professional paragraphs (2-4 sentences). No markdown, no bullet lists, no numbering.",
      "- Ask exactly ONE question or follow-up per turn. Never ask two questions at once.",
      "- Listen closely to what the candidate actually said. When it adds value, ask ONE brief, specific follow-up about something they just mentioned before moving to a new topic. Don't follow up on every answer — move on when an answer was already complete.",
      `- Plan for a total of about ${ctx.totalQuestions} main topics across the whole interview (follow-ups are extra, not counted).`,
      `- Your tone: ${personality}.`,
      "- Never grade or score the candidate out loud during the interview.",
      `- When, and only when, you have asked your final main question and the candidate has answered it, give a brief warm closing remark thanking them for their time, then end your message with the exact token [INTERVIEW_COMPLETE] alone on its own final line.`,
    ].join("\n");
  }

  function parseTurn(text) {
    const isComplete = text.includes("[INTERVIEW_COMPLETE]");
    const displayText = text.replace("[INTERVIEW_COMPLETE]", "").trim();
    return { isComplete, displayText };
  }

  async function getOpeningTurn(ctx) {
    const system = buildSystemPrompt(ctx);
    const messages = [
      { role: "user", content: "[The interview is starting now. Greet the candidate briefly, introduce yourself by name, and ask your first question.]" },
    ];
    const text = await chat(system, messages, 300);
    const updated = messages.concat([{ role: "assistant", content: text }]);
    return { turn: parseTurn(text), messages: updated };
  }

  async function getNextTurn(ctx, priorMessages, userAnswerText, isFinalAnswer) {
    const system = buildSystemPrompt(ctx);
    let answer = userAnswerText || "(The candidate chose to skip this question.)";
    if (isFinalAnswer) {
      answer += "\n\n[This was the final planned answer. Give a short, natural closing thank-you now and end with [INTERVIEW_COMPLETE] on its own final line.]";
    }
    const messages = priorMessages.concat([{ role: "user", content: answer }]);
    const text = await chat(system, messages, 300);
    const updated = messages.concat([{ role: "assistant", content: text }]);
    return { turn: parseTurn(text), messages: updated };
  }

  async function getHint(questionText) {
    const system =
      "You are a supportive interview coach. In 1-2 short sentences, give structural guidance for how to answer the question well " +
      "(for example, what to include or how to frame it). Do NOT write the actual answer for the candidate.";
    const messages = [{ role: "user", content: `Question: "${questionText}"` }];
    const text = await chat(system, messages, 120);
    return text.trim();
  }

  function stripJsonFences(text) {
    let clean = text.trim();
    clean = clean.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    return clean;
  }

  async function getReport(transcript, ctx) {
    const system =
      "You are an expert, encouraging English-speaking interview coach reviewing a completed mock interview practice session. " +
      "Be specific and constructive — this is for learning, not real hiring. " +
      "Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON, matching exactly this shape: " +
      REPORT_SCHEMA_HINT;
    const userContent = JSON.stringify({
      role: ctx.roleLabel,
      difficulty: ctx.difficulty,
      mode: ctx.mode,
      transcript: transcript.map((t) => ({ question: t.question, answer: t.answer })),
    });
    const text = await chat(system, [{ role: "user", content: userContent }], 1400);
    return JSON.parse(stripJsonFences(text));
  }

  IQ.ai = {
    checkStatus,
    buildSystemPrompt,
    getOpeningTurn,
    getNextTurn,
    getHint,
    getReport,
  };
})();

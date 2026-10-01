/* ===========================================================
   Interview Quest — rule-based feedback engine
   Used for: (1) instant practice-mode quick tips (always, even
   with AI enabled — keeps latency low), and (2) the full fallback
   report when the AI interviewer is unavailable.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const FILLER_WORDS = ["um", "uh", "erm", "like", "you know", "sort of", "kind of", "basically", "actually", "i mean", "literally"];

  const STAR_PATTERNS = {
    situation: /\b(when i|there was a time|in my (previous|last|current)|at my (previous|last|current)?\s*(job|role|company)|one time|back when)\b/i,
    task: /\b(i (needed|had) to|my (task|job|responsibility) was|i was responsible for|the goal was)\b/i,
    action: /\b(i (decided|implemented|created|organized|built|led|managed|contacted|developed|designed|solved|resolved|proposed|handled))\b/i,
    result: /\b(as a result|the result was|we (achieved|increased|reduced|improved)|i (learned|ended up)|%|percent|\d+)\b/i,
  };

  function countFillers(text) {
    const lower = " " + text.toLowerCase() + " ";
    let count = 0;
    const found = [];
    FILLER_WORDS.forEach((word) => {
      const re = new RegExp("\\b" + word.replace(/ /g, "\\s+") + "\\b", "g");
      const matches = lower.match(re);
      if (matches) {
        count += matches.length;
        found.push(word);
      }
    });
    return { count, found };
  }

  function detectStarParts(text) {
    const parts = {};
    let hits = 0;
    Object.keys(STAR_PATTERNS).forEach((key) => {
      const hit = STAR_PATTERNS[key].test(text);
      parts[key] = hit;
      if (hit) hits++;
    });
    return { parts, hits };
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function analyzeAnswer(text) {
    const trimmed = (text || "").trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const fillers = countFillers(trimmed);
    const star = detectStarParts(trimmed);

    const lengthScore = clamp(Math.round((wordCount / 60) * 25), 0, 25);
    const fillerPenalty = clamp(fillers.count * 4, 0, 20);
    const starBonus = star.hits * 8;
    const score = clamp(30 + lengthScore + starBonus - fillerPenalty, 0, 100);

    let quickTip;
    if (wordCount === 0) {
      quickTip = "No answer was given — try to say at least a few sentences, even a rough attempt helps you practice.";
    } else if (fillers.count >= 3) {
      quickTip = "Try to cut down on filler words like 'um' and 'like' — a short silent pause sounds more confident than filling the gap.";
    } else if (wordCount < 15) {
      quickTip = "Try adding more detail — a short, specific example makes your answer much stronger.";
    } else if (!star.parts.result) {
      quickTip = "Good detail! Try adding a concrete result or outcome at the end — a number helps if you have one.";
    } else if (!star.parts.action) {
      quickTip = "Nice context — now be explicit about the exact action YOU personally took, not just the situation.";
    } else {
      quickTip = "Solid, well-structured answer — clear and specific.";
    }

    return { wordCount, fillerCount: fillers.count, fillersFound: fillers.found, starParts: star.parts, starHits: star.hits, score, quickTip };
  }

  function buildImprovedExample() {
    return (
      "Situation: Briefly set the scene — where and when this happened.\n" +
      "Task: What were you specifically responsible for?\n" +
      "Action: What exact steps did YOU take?\n" +
      "Result: What happened afterward? A number or clear outcome makes it stronger.\n\n" +
      "Tip: aim for about 45-90 seconds when spoken aloud."
    );
  }

  function average(nums) {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  /**
   * Build a full end-of-interview report from a transcript of
   * { question, answer, analysis } entries, using only local heuristics.
   */
  function buildReport(transcript) {
    const analyses = transcript.map((t) => t.analysis || analyzeAnswer(t.answer));
    const avgScore = average(analyses.map((a) => a.score));
    const avgWordCount = average(analyses.map((a) => a.wordCount));
    const totalFillers = analyses.reduce((sum, a) => sum + a.fillerCount, 0);
    const starHitRate = average(analyses.map((a) => a.starHits / 4));

    const strengths = [];
    const weaknesses = [];

    if (avgWordCount >= 30) strengths.push("You give detailed, substantive answers.");
    if (totalFillers === 0) strengths.push("Very clean delivery — no filler words detected.");
    if (starHitRate >= 0.5) strengths.push("You naturally structure answers with situation, action and result.");
    if (avgScore >= 75) strengths.push("Consistently strong answers across the interview.");
    if (!strengths.length) strengths.push("You completed the full interview — that's the hardest part of practicing!");

    if (totalFillers >= 5) weaknesses.push("Watch filler words like 'um' and 'like' — they can make you sound less confident.");
    if (avgWordCount < 15) weaknesses.push("Many answers were quite short — add specific examples and detail.");
    if (starHitRate < 0.3) weaknesses.push("Try structuring answers with Situation → Task → Action → Result.");
    if (avgScore < 50) weaknesses.push("Focus on fuller, more specific answers overall.");
    if (!weaknesses.length) weaknesses.push("Keep practicing — look for small ways to add numbers or concrete outcomes.");

    const englishFeedback =
      totalFillers > 0
        ? `We noticed about ${totalFillers} filler word${totalFillers === 1 ? "" : "s"} across your answers (e.g. "um", "like"). Pausing silently instead sounds more confident. Your average answer was about ${Math.round(avgWordCount)} words — ${avgWordCount < 20 ? "try expanding with a specific example next time." : "a good amount of detail."}`
        : `Clean delivery with no filler words detected. Your average answer was about ${Math.round(avgWordCount)} words — ${avgWordCount < 20 ? "try expanding with a specific example next time." : "a good amount of detail."}`;

    const nextSteps = [
      "Practice the STAR structure (Situation, Task, Action, Result) out loud for your top 3 go-to stories.",
      "Record yourself answering one question and count your filler words.",
    ];
    if (avgWordCount < 20) nextSteps.push("Prepare 2-3 specific stories in advance so you always have concrete details ready.");

    return {
      overallScore: Math.round(avgScore),
      strengths,
      weaknesses,
      englishFeedback,
      perQuestion: transcript.map((t, i) => ({
        question: t.question,
        tip: (analyses[i] && analyses[i].quickTip) || "",
        improvedExample: buildImprovedExample(),
      })),
      nextSteps,
    };
  }

  IQ.feedback = {
    analyzeAnswer,
    buildImprovedExample,
    buildReport,
  };
})();

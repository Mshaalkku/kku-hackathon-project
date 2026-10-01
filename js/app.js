/* ===========================================================
   Interview Quest — main controller
   Orchestrates: setup choices -> live AI interview (adaptive,
   content-aware follow-ups) with automatic fallback to the
   rule-based question bank at any point it's needed -> game
   rewards -> final report.
   =========================================================== */
(function () {
  "use strict";

  // ---------------- module state ----------------
  let gameState = null;
  let session = null;
  let aiAvailableCached = false;
  let micState = "idle"; // idle | listening

  const choices = { role: "general", difficulty: "medium", gender: "female", personality: "friendly", mode: "practice", demoSpeed: false };

  // ---------------- cached DOM refs (set in init) ----------------
  let el = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    gameState = IQ.game.load();
    IQ.ui.renderHUD(gameState);
    renderPlayerSummary();
    buildSetupOptionGrids();
    wireStaticButtons();

    aiAvailableCached = await IQ.ai.checkStatus();
    updateAIStatusNote();
  }

  function cacheDom() {
    const ids = [
      "player-summary", "ai-status-note", "btn-start-interview", "btn-load-example",
      "interviewer-avatar", "interviewer-initial", "interviewer-name", "interviewer-role-label", "interviewer-status",
      "question-progress", "progress-dots", "question-text", "prep-timer",
      "hint-panel", "hint-text", "quick-tip-panel", "quick-tip-text",
      "live-transcript", "answer-input", "btn-mic", "mic-status-label", "btn-send-answer", "btn-skip-question",
      "powerup-bar", "btn-play-again", "btn-back-setup",
      "report-mode-note", "report-example-banner", "report-score-ring", "report-score-value",
      "report-xp-gained", "report-level-banner", "report-achievements",
      "report-strengths", "report-weaknesses", "report-english-feedback", "report-per-question", "report-next-steps",
    ];
    ids.forEach((id) => (el[toCamel(id)] = document.getElementById(id)));
  }
  function toCamel(id) {
    return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  // =========================================================
  // Setup screen
  // =========================================================
  function renderPlayerSummary() {
    if (gameState.interviewsCompleted > 0) {
      const p = IQ.game.xpProgress(gameState.xp);
      el.playerSummary.hidden = false;
      el.playerSummary.textContent = `Welcome back! Level ${p.level} · ${gameState.xp} XP · ${gameState.streak}-day streak`;
    } else {
      el.playerSummary.hidden = true;
    }
  }

  function buildSetupOptionGrids() {
    renderGrid("role-grid", IQ.questions.ROLES.map((r) => ({ value: r.id, label: r.label })), "role");
    renderGrid(
      "difficulty-grid",
      IQ.questions.DIFFICULTIES.map((d) => ({ value: d.id, label: d.label, sub: d.questionCount + " questions" })),
      "difficulty"
    );
    renderGrid(
      "gender-grid",
      [{ value: "female", label: "Sarah", sub: "female voice" }, { value: "male", label: "David", sub: "male voice" }],
      "gender"
    );
    renderGrid(
      "personality-grid",
      [{ value: "friendly", label: "Friendly" }, { value: "professional", label: "Professional" }, { value: "strict", label: "Strict" }],
      "personality"
    );
    renderGrid(
      "mode-grid",
      [{ value: "practice", label: "Practice Mode", sub: "Tips as you go" }, { value: "real", label: "Real Interview Mode", sub: "Feedback at the end" }],
      "mode"
    );
  }

  function renderGrid(containerId, items, key) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.setAttribute("aria-pressed", String(choices[key] === item.value));
      btn.innerHTML = item.label + (item.sub ? '<span class="option-sub">' + item.sub + "</span>" : "");
      btn.addEventListener("click", () => {
        choices[key] = item.value;
        renderGrid(containerId, items, key);
      });
      container.appendChild(btn);
    });
  }

  function updateAIStatusNote() {
    if (aiAvailableCached) {
      el.aiStatusNote.textContent = "Live AI interviewer is ready — your conversation will adapt to what you actually say.";
      el.aiStatusNote.className = "ai-status-note is-live";
    } else {
      el.aiStatusNote.textContent = "No AI key detected on the server — using the built-in practice question bank (still fully playable). See README to enable live AI.";
      el.aiStatusNote.className = "ai-status-note is-fallback";
    }
  }

  function wireStaticButtons() {
    el.btnStartInterview.addEventListener("click", startInterview);
    el.btnLoadExample.addEventListener("click", loadExampleReport);
    el.btnMic.addEventListener("click", onMicClick);
    el.btnSendAnswer.addEventListener("click", onSendAnswer);
    el.btnSkipQuestion.addEventListener("click", () => submitAnswer("", { skipped: true }));
    el.btnPlayAgain.addEventListener("click", backToSetup);
    el.btnBackSetup.addEventListener("click", backToSetup);
  }

  function backToSetup() {
    IQ.speech.stopSpeaking();
    IQ.speech.stopListening();
    renderPlayerSummary();
    IQ.ui.showView("view-setup");
  }

  // =========================================================
  // Session lifecycle
  // =========================================================
  function roleLabelFor(id) {
    const r = IQ.questions.ROLES.find((x) => x.id === id);
    return r ? r.label : "General";
  }

  function totalQuestionsFor(difficultyId, demoSpeed) {
    if (demoSpeed) return 3;
    const d = IQ.questions.DIFFICULTIES.find((x) => x.id === difficultyId);
    return d ? d.questionCount : 6;
  }

  function newSession(c) {
    const totalQuestions = totalQuestionsFor(c.difficulty, c.demoSpeed);
    return {
      roleId: c.role,
      roleLabel: roleLabelFor(c.role),
      difficultyId: c.difficulty,
      gender: c.gender,
      personality: c.personality,
      mode: c.mode,
      demoSpeed: c.demoSpeed,
      interviewerName: c.gender === "male" ? "David" : "Sarah",
      usingAI: false,
      totalQuestions,
      aiMessages: [],
      fallbackQuestions: IQ.questions.getQuestionSet(c.role, c.difficulty).slice(0, totalQuestions),
      fallbackIndex: 0,
      currentIsFallbackFollowUp: false,
      currentQuestionText: "",
      currentHint: "",
      turnsAsked: 0,
      transcript: [],
      xpEarned: 0,
      activePowerUps: { doubleXPNext: false },
      isComplete: false,
      prepTimer: null,
      prepRemaining: 0,
      hintUsedForCurrent: false,
      secondChanceUsedForCurrent: false,
    };
  }

  function buildCtx() {
    return {
      interviewerName: session.interviewerName,
      roleLabel: session.roleLabel,
      difficulty: session.difficultyId,
      personality: session.personality,
      totalQuestions: session.totalQuestions,
      mode: session.mode,
    };
  }

  async function startInterview() {
    session = newSession(choices);
    session.usingAI = aiAvailableCached;

    IQ.ui.showView("view-interview");
    el.interviewerInitial.textContent = session.interviewerName.charAt(0);
    el.interviewerName.textContent = session.interviewerName;
    el.interviewerRoleLabel.textContent = session.roleLabel + " interview · " + capitalize(session.difficultyId);
    IQ.ui.renderPowerUps(gameState, usePowerUp);
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    el.answerInput.value = "";
    el.liveTranscript.textContent = "";

    await askOpeningQuestion();
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  async function askOpeningQuestion() {
    if (session.usingAI) {
      try {
        const { turn, messages } = await IQ.ai.getOpeningTurn(buildCtx());
        session.aiMessages = messages;
        session.currentQuestionText = turn.displayText;
      } catch (e) {
        session.usingAI = false;
        IQ.ui.toast("AI interviewer unavailable — using the built-in practice question bank.", "error");
        setFallbackQuestion(0);
      }
    } else {
      setFallbackQuestion(0);
    }
    await presentCurrentQuestion();
  }

  function setFallbackQuestion(index) {
    session.fallbackIndex = index;
    session.currentIsFallbackFollowUp = false;
    const q = session.fallbackQuestions[index];
    session.currentQuestionText = q.text;
    session.currentHint = q.hint;
  }

  // =========================================================
  // Presenting a question / listening for the answer
  // =========================================================
  async function presentCurrentQuestion() {
    session.turnsAsked += 1;
    session.hintUsedForCurrent = false;
    session.secondChanceUsedForCurrent = false;
    renderQuestionProgress();

    el.questionText.textContent = session.currentQuestionText;
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    el.answerInput.value = "";
    el.liveTranscript.textContent = "";

    setInterviewerStatus("Speaking…");
    el.interviewerAvatar.classList.add("is-speaking");
    setMicEnabled(false);
    await IQ.speech.speak(session.currentQuestionText, { gender: session.gender, personality: session.personality });
    el.interviewerAvatar.classList.remove("is-speaking");

    if (session.isComplete) return; // closing remark already spoken, report is taking over

    setInterviewerStatus("Your turn — listening for your answer…");
    startPrepTimer();
    setMicEnabled(true);
  }

  function setInterviewerStatus(text) {
    el.interviewerStatus.textContent = text;
  }

  function renderQuestionProgress() {
    let total, currentIdx;
    if (session.usingAI) {
      el.questionProgress.textContent = `Question ${session.turnsAsked} (of about ${session.totalQuestions})`;
      total = session.totalQuestions;
      currentIdx = session.turnsAsked - 1;
    } else {
      el.questionProgress.textContent = `Question ${session.fallbackIndex + 1} of ${session.fallbackQuestions.length}`;
      total = session.fallbackQuestions.length;
      currentIdx = session.fallbackIndex;
    }
    el.progressDots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      if (i < currentIdx) dot.className = "is-done";
      else if (i === currentIdx) dot.className = "is-current";
      el.progressDots.appendChild(dot);
    }
  }

  // =========================================================
  // Microphone / text input
  // =========================================================
  function setMicEnabled(enabled) {
    el.btnMic.setAttribute("aria-disabled", enabled ? "false" : "true");
    if (!enabled) {
      micState = "idle";
    }
    updateMicUI();
  }

  function updateMicUI() {
    el.btnMic.classList.toggle("is-listening", micState === "listening");
    el.btnMic.innerHTML = IQ.ui.icon("mic", "mic-icon");
    if (micState === "listening") {
      el.micStatusLabel.textContent = "Listening — tap to stop";
      el.btnMic.setAttribute("aria-label", "Stop recording");
    } else if (!IQ.speech.hasSTT) {
      el.micStatusLabel.textContent = "Speech recognition isn't supported in this browser — please type your answer.";
      el.btnMic.setAttribute("aria-label", "Microphone unavailable");
    } else {
      el.micStatusLabel.textContent = "Tap the mic, or type below";
      el.btnMic.setAttribute("aria-label", "Start answering with your microphone");
    }
  }

  function onMicClick() {
    if (el.btnMic.getAttribute("aria-disabled") === "true") return;
    if (!IQ.speech.hasSTT) {
      IQ.ui.toast("Speech recognition isn't supported in this browser. Try Chrome or Edge, or just type your answer.", "error");
      return;
    }
    if (micState === "idle") {
      const started = IQ.speech.startListening({
        onInterim: (t) => { el.liveTranscript.textContent = t; },
        onFinal: (buf) => { el.answerInput.value = buf; },
        onEnd: () => { micState = "idle"; updateMicUI(); el.liveTranscript.textContent = ""; },
        onError: (err) => { IQ.ui.toast("Microphone error: " + err, "error"); micState = "idle"; updateMicUI(); },
      });
      if (started) { micState = "listening"; updateMicUI(); }
    } else {
      IQ.speech.stopListening();
      micState = "idle";
      updateMicUI();
    }
  }

  function onSendAnswer() {
    const text = el.answerInput.value.trim();
    if (!text) {
      IQ.ui.toast("Please say or type an answer first.");
      return;
    }
    submitAnswer(text, {});
  }

  // =========================================================
  // Prep ("Think Time") timer — cosmetic nudge, never blocking
  // =========================================================
  function startPrepTimer() {
    clearPrepTimer();
    session.prepRemaining = session.demoSpeed ? 8 : 20;
    el.prepTimer.hidden = false;
    updatePrepTimerText();
    session.prepTimer = setInterval(() => {
      session.prepRemaining -= 1;
      if (session.prepRemaining <= 0) { clearPrepTimer(); return; }
      updatePrepTimerText();
    }, 1000);
  }
  function updatePrepTimerText() {
    el.prepTimer.textContent = "Take a moment to think… " + session.prepRemaining + "s";
  }
  function extendPrepTimer(sec) {
    if (!session.prepTimer) { startPrepTimer(); }
    session.prepRemaining += sec;
    updatePrepTimerText();
  }
  function clearPrepTimer() {
    if (session.prepTimer) { clearInterval(session.prepTimer); session.prepTimer = null; }
    el.prepTimer.hidden = true;
  }

  // =========================================================
  // Submitting an answer -> XP -> next turn (AI or fallback)
  // =========================================================
  async function submitAnswer(rawText, opts) {
    if (!session || session.isComplete) return;
    opts = opts || {};
    IQ.speech.stopListening();
    micState = "idle";
    setAnswerUIBusy(true);

    const analysis = IQ.feedback.analyzeAnswer(rawText);
    session.transcript.push({
      question: session.currentQuestionText,
      answer: rawText,
      analysis,
      awardedXP: 0,
      skipped: !!opts.skipped,
      hintUsed: session.hintUsedForCurrent,
      secondChanceUsed: session.secondChanceUsedForCurrent,
    });

    if (!opts.skipped) {
      const xpGain = IQ.game.answerXP(analysis, session.activePowerUps.doubleXPNext);
      session.activePowerUps.doubleXPNext = false;
      session.xpEarned += xpGain;
      session.transcript[session.transcript.length - 1].awardedXP = xpGain;
      gameState.xp += xpGain;
      IQ.game.save(gameState);
      IQ.ui.renderHUD(gameState);
      IQ.ui.toast("+" + xpGain + " XP", "success");
    }

    if (session.mode === "practice" && !opts.skipped) {
      el.quickTipPanel.hidden = false;
      el.quickTipText.textContent = analysis.quickTip;
    } else {
      el.quickTipPanel.hidden = true;
    }

    // ---- decide the next turn ----
    if (session.usingAI) {
      try {
        const isFinalAnswer = session.transcript.length >= session.totalQuestions;
        const { turn, messages } = await IQ.ai.getNextTurn(
          buildCtx(),
          session.aiMessages,
          rawText || "(The candidate skipped this question.)",
          isFinalAnswer
        );
        session.aiMessages = messages;
        if (turn.isComplete) {
          await finishInterview(turn.displayText);
          return;
        }
        session.currentQuestionText = turn.displayText;
      } catch (e) {
        session.usingAI = false;
        IQ.ui.toast("Lost connection to the AI interviewer — switching to the practice question bank for the rest of this session.", "error");
        const nextIndex = Math.min(session.transcript.length, session.fallbackQuestions.length - 1);
        if (session.transcript.length >= session.fallbackQuestions.length) {
          await finishInterview();
          return;
        }
        setFallbackQuestion(nextIndex);
      }
    } else {
      const shouldFollowUp = !opts.skipped && !session.currentIsFallbackFollowUp && analysis.wordCount > 0 && analysis.wordCount < 15;
      if (shouldFollowUp) {
        session.currentIsFallbackFollowUp = true;
        session.currentQuestionText = IQ.questions.GENERIC_FOLLOW_UP;
      } else {
        const nextIndex = session.fallbackIndex + 1;
        if (nextIndex >= session.fallbackQuestions.length) {
          await finishInterview();
          return;
        }
        setFallbackQuestion(nextIndex);
      }
    }

    setAnswerUIBusy(false);
    await presentCurrentQuestion();
  }

  function setAnswerUIBusy(busy) {
    el.btnSendAnswer.disabled = busy;
    el.btnSkipQuestion.disabled = busy;
    setMicEnabled(!busy);
    if (busy) setInterviewerStatus("Thinking…");
  }

  // =========================================================
  // Power-ups
  // =========================================================
  async function usePowerUp(key) {
    if (!session || session.isComplete) return;

    if (key === "replay") {
      el.interviewerAvatar.classList.add("is-speaking");
      await IQ.speech.speak(session.currentQuestionText, { gender: session.gender, personality: session.personality });
      el.interviewerAvatar.classList.remove("is-speaking");
      return;
    }

    if (!IQ.game.consumePowerUp(gameState, key)) {
      IQ.ui.toast("None left — earn more by completing interviews.");
      return;
    }
    IQ.ui.renderHUD(gameState);
    IQ.ui.renderPowerUps(gameState, usePowerUp);

    if (key === "thinkTime") {
      extendPrepTimer(session.demoSpeed ? 10 : 20);
      IQ.ui.toast("+ extra thinking time", "success");
    } else if (key === "doubleXP") {
      session.activePowerUps.doubleXPNext = true;
      IQ.ui.toast("2x XP active for your next answer!", "success");
    } else if (key === "hint") {
      session.hintUsedForCurrent = true;
      await showHint();
    } else if (key === "secondChance") {
      await useSecondChance();
    }
  }

  async function showHint() {
    el.hintPanel.hidden = false;
    el.hintText.textContent = "Thinking of a hint…";
    let text;
    if (session.usingAI) {
      try {
        text = await IQ.ai.getHint(session.currentQuestionText);
      } catch (e) {
        text = session.currentHint || IQ.questions.getHint(session.currentQuestionText);
      }
    } else {
      text = session.currentHint || IQ.questions.getHint(session.currentQuestionText);
    }
    el.hintText.textContent = text;
  }

  async function useSecondChance() {
    if (!session.transcript.length) {
      IQ.ui.toast("Nothing to redo yet.");
      return;
    }
    const lastEntry = session.transcript.pop();

    // Undo the XP earned by the replaced attempt, so retries cannot be farmed.
    if (lastEntry.awardedXP) {
      session.xpEarned = Math.max(0, session.xpEarned - lastEntry.awardedXP);
      gameState.xp = Math.max(0, gameState.xp - lastEntry.awardedXP);
      IQ.game.save(gameState);
      IQ.ui.renderHUD(gameState);
    }

    if (session.usingAI) {
      session.aiMessages = session.aiMessages.slice(0, -2);
    } else if (lastEntry.question === IQ.questions.GENERIC_FOLLOW_UP) {
      session.currentIsFallbackFollowUp = true;
    } else {
      session.currentIsFallbackFollowUp = false;
      const q = session.fallbackQuestions[session.fallbackIndex];
      session.currentHint = q.hint;
    }

    session.currentQuestionText = lastEntry.question;
    session.secondChanceUsedForCurrent = true;
    el.questionText.textContent = session.currentQuestionText + " (let's try that one again)";
    el.answerInput.value = "";
    el.liveTranscript.textContent = "";
    setMicEnabled(true);
    await showHint();
  }

  // =========================================================
  // Finishing the interview -> report
  // =========================================================
  async function finishInterview(closingText) {
    session.isComplete = true;
    clearPrepTimer();
    setMicEnabled(false);
    IQ.ui.renderPowerUps(gameState, usePowerUp);

    const text = closingText || "Thank you — that's everything I needed to ask today. Great job completing the interview!";
    el.questionText.textContent = text;
    el.interviewerAvatar.classList.add("is-speaking");
    setInterviewerStatus("Wrapping up…");
    await IQ.speech.speak(text, { gender: session.gender, personality: session.personality });
    el.interviewerAvatar.classList.remove("is-speaking");

    setInterviewerStatus("Interview complete — preparing your report…");
    await buildAndShowReport();
  }

  async function buildAndShowReport() {
    let report;
    if (session.usingAI) {
      try {
        report = await IQ.ai.getReport(session.transcript, buildCtx());
      } catch (e) {
        report = IQ.feedback.buildReport(session.transcript);
        IQ.ui.toast("Could not reach the AI for the final report — showing the practice-based report instead.", "error");
      }
    } else {
      report = IQ.feedback.buildReport(session.transcript);
    }

    const totalFillers = session.transcript.reduce((sum, t) => sum + (t.analysis ? t.analysis.fillerCount : 0), 0);
    const starAnswers = session.transcript.filter((t) => t.analysis && t.analysis.starHits >= 3).length;
    const completionXP = 20 + (session.mode === "real" ? 30 : 0) + ({ easy: 0, medium: 10, hard: 20 }[session.difficultyId] || 0);

    const result = IQ.game.completeInterview(gameState, {
      mode: session.mode,
      usingAI: session.usingAI,
      difficulty: session.difficultyId,
      totalFillers,
      starAnswers,
      completionXP,
    });
    session.xpEarned += completionXP;
    IQ.ui.renderHUD(gameState);

    renderReport(report, {
      xpGained: session.xpEarned,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      newAchievements: result.newAchievements,
      isExample: false,
      transcript: session.transcript,
      roleLabel: session.roleLabel,
      difficulty: session.difficultyId,
      mode: session.mode,
      usingAI: session.usingAI,
    });
    IQ.ui.showView("view-report");
  }

  function loadExampleReport() {
    const sample = IQ.sampleData;
    renderReport(sample.report, {
      xpGained: 0,
      leveledUp: false,
      newLevel: null,
      newAchievements: [],
      isExample: true,
      transcript: sample.transcript,
      roleLabel: sample.meta.roleLabel,
      difficulty: sample.meta.difficulty,
      mode: sample.meta.mode,
      usingAI: sample.meta.usingAI,
    });
    IQ.ui.showView("view-report");
  }

  // =========================================================
  // Report rendering
  // =========================================================
  function scoreColor(score) {
    if (score >= 75) return "var(--success)";
    if (score >= 45) return "var(--xp)";
    return "var(--danger)";
  }

  function fillList(ulEl, items) {
    ulEl.innerHTML = "";
    (items || []).forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      ulEl.appendChild(li);
    });
  }

  function renderReport(report, meta) {
    el.reportModeNote.textContent =
      `${meta.roleLabel} · ${capitalize(meta.difficulty)} · ${meta.mode === "real" ? "Real Interview Mode" : "Practice Mode"} · ` +
      (meta.usingAI ? "Live AI interviewer" : "Practice question bank");
    el.reportExampleBanner.hidden = !meta.isExample;

    const score = Math.max(0, Math.min(100, Math.round(report.overallScore || 0)));
    el.reportScoreRing.style.setProperty("--pct", score);
    el.reportScoreRing.style.setProperty("--score-color", scoreColor(score));
    el.reportScoreValue.textContent = score;

    el.reportXpGained.textContent = "+" + meta.xpGained + " XP";
    if (meta.leveledUp) {
      el.reportLevelBanner.hidden = false;
      el.reportLevelBanner.textContent = "Level up! You reached Level " + meta.newLevel;
    } else {
      el.reportLevelBanner.hidden = true;
    }

    if (meta.newAchievements && meta.newAchievements.length) {
      el.reportAchievements.hidden = false;
      el.reportAchievements.innerHTML = "";
      meta.newAchievements.forEach((a) => {
        const chip = document.createElement("span");
        chip.className = "achievement-chip";
        chip.title = a.desc;
        chip.innerHTML = IQ.ui.icon("star") + "<span></span>";
        chip.querySelector("span").textContent = a.name;
        el.reportAchievements.appendChild(chip);
      });
    } else {
      el.reportAchievements.hidden = true;
    }

    fillList(el.reportStrengths, report.strengths);
    fillList(el.reportWeaknesses, report.weaknesses);
    el.reportEnglishFeedback.textContent = report.englishFeedback || "";

    el.reportPerQuestion.innerHTML = "";
    (report.perQuestion || []).forEach((pq, i) => {
      const t = (meta.transcript && meta.transcript[i]) || {};
      const card = document.createElement("div");
      card.className = "pq-card";

      const qEl = document.createElement("div");
      qEl.className = "pq-question";
      qEl.textContent = pq.question || t.question || "Question " + (i + 1);
      card.appendChild(qEl);

      if (t.answer) {
        const aEl = document.createElement("div");
        aEl.className = "pq-answer";
        aEl.textContent = '"' + t.answer + '"';
        card.appendChild(aEl);
      }

      if (pq.tip) {
        const tipLabel = document.createElement("div");
        tipLabel.className = "pq-label";
        tipLabel.textContent = "Tip";
        const tipEl = document.createElement("p");
        tipEl.className = "pq-tip";
        tipEl.textContent = pq.tip;
        card.appendChild(tipLabel);
        card.appendChild(tipEl);
      }

      if (pq.improvedExample) {
        const impLabel = document.createElement("div");
        impLabel.className = "pq-label";
        impLabel.textContent = "Example of a stronger answer";
        const impEl = document.createElement("div");
        impEl.className = "pq-improved";
        impEl.textContent = pq.improvedExample;
        card.appendChild(impLabel);
        card.appendChild(impEl);
      }

      el.reportPerQuestion.appendChild(card);
    });

    fillList(el.reportNextSteps, report.nextSteps);
  }
})();

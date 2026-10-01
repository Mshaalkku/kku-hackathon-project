/* ===========================================================
   Interview Quest — staged interview controller
   A deterministic English plan guarantees a complete offline session.
   AI can add a bounded, validated follow-up but cannot control stages.
   =========================================================== */
(function () {
  "use strict";

  let gameState;
  let session;
  let state;
  let aiAvailableCached = false;
  let operationId = 0;
  let activeRequest = null;
  let reportModel = null;
  let el = {};

  const choices = {
    role: "general", difficulty: "medium", gender: "female", personality: "friendly", mode: "practice", demoSpeed: false,
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    state = IQ.interviewState.create();
    gameState = IQ.game.load();
    IQ.ui.renderHUD(gameState);
    buildLanguageSelectors();
    renderInterface();
    wireStaticButtons();
    renderPlayerSummary();
    aiAvailableCached = await IQ.ai.checkStatus();
    updateAIStatusNote();
  }

  function cacheDom() {
    const ids = [
      "player-summary", "ai-status-note", "interface-language-select", "translation-language-select", "interview-language-select", "interview-language-note",
      "btn-start-interview", "btn-load-example", "demo-speed-toggle", "interview-translation-language-select", "subtitle-toggle", "btn-end-interview",
      "interviewer-character", "character-sarah", "character-david", "interviewer-name", "interviewer-role-label", "interviewer-status", "stage-label", "question-progress", "progress-dots",
      "question-text", "question-translation", "question-translation-text", "prep-timer", "hint-panel", "hint-text", "hint-translation", "quick-tip-panel", "quick-tip-text",
      "live-transcript", "answer-input", "mic-status-label", "btn-start-answer", "btn-stop-answer", "btn-finish-answer", "btn-skip-question", "btn-repeat-question", "powerup-bar",
      "end-interview-dialog", "btn-cancel-end", "btn-confirm-end", "btn-play-again", "btn-back-setup", "report-global-translation-toggle",
      "report-mode-note", "report-example-banner", "report-score-ring", "report-score-value", "report-xp-gained", "report-level-banner", "report-achievements",
      "report-strongest-skill", "report-biggest-improvement", "report-summary", "report-strengths", "report-weaknesses", "report-english-feedback", "report-per-question", "report-next-steps",
    ];
    ids.forEach((id) => { el[toCamel(id)] = document.getElementById(id); });
  }

  function toCamel(id) { return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); }
  function t(key, variables) { return IQ.i18n.t(key, variables); }
  function currentTranslationLanguage() { return IQ.i18n.preferences.translationLanguage; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function capitalize(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ""; }

  function buildLanguageSelectors() {
    const languageOptions = IQ.i18n.LANGUAGE_ORDER.map((id) => IQ.i18n.LANGUAGES[id]);
    function fill(select, selected, filter) {
      select.innerHTML = "";
      languageOptions.filter(filter || (() => true)).forEach((language) => {
        const option = document.createElement("option");
        option.value = language.id;
        option.textContent = `${language.nativeLabel} — ${language.label}`;
        option.selected = selected === language.id;
        select.appendChild(option);
      });
    }
    const preferences = IQ.i18n.preferences;
    fill(el.interfaceLanguageSelect, preferences.interfaceLanguage);
    fill(el.translationLanguageSelect, preferences.translationLanguage);
    fill(el.interviewTranslationLanguageSelect, preferences.translationLanguage);
    fill(el.interviewLanguageSelect, preferences.interviewLanguage, (language) => language.interviewSupported);
  }

  function renderInterface() {
    IQ.i18n.applyDocumentLanguage();
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    buildSetupOptionGrids();
    const preferences = IQ.i18n.preferences;
    [el.interfaceLanguageSelect, el.translationLanguageSelect, el.interviewTranslationLanguageSelect].forEach((select) => { if (select) select.value = preferences[select === el.interfaceLanguageSelect ? "interfaceLanguage" : "translationLanguage"]; });
    el.interviewLanguageSelect.value = preferences.interviewLanguage;
    el.interviewLanguageNote.textContent = t("EnglishOnly");
    if (session && !session.complete) renderCurrentTurn();
    if (reportModel) renderReport(reportModel.report, reportModel.meta);
  }

  function wireStaticButtons() {
    el.interfaceLanguageSelect.addEventListener("change", () => { IQ.i18n.setInterfaceLanguage(el.interfaceLanguageSelect.value); renderInterface(); });
    [el.translationLanguageSelect, el.interviewTranslationLanguageSelect].forEach((select) => select.addEventListener("change", () => {
      IQ.i18n.setTranslationLanguage(select.value);
      renderInterface();
    }));
    el.interviewLanguageSelect.addEventListener("change", () => { IQ.i18n.setInterviewLanguage(el.interviewLanguageSelect.value); renderInterface(); });
    el.demoSpeedToggle.addEventListener("change", () => { choices.demoSpeed = el.demoSpeedToggle.checked; });
    el.btnStartInterview.addEventListener("click", startInterview);
    el.btnLoadExample.addEventListener("click", loadExampleReport);
    el.btnStartAnswer.addEventListener("click", startAnswer);
    el.btnStopAnswer.addEventListener("click", stopAnswer);
    el.btnFinishAnswer.addEventListener("click", finishAnswer);
    el.btnSkipQuestion.addEventListener("click", () => submitAnswer("", { skipped: true }));
    el.btnRepeatQuestion.addEventListener("click", () => presentCurrentQuestion({ preserveInput: true }));
    el.btnEndInterview.addEventListener("click", showEndDialog);
    el.btnConfirmEnd.addEventListener("click", () => endInterviewEarly());
    el.btnCancelEnd.addEventListener("click", () => { if (el.endInterviewDialog.open) el.endInterviewDialog.close(); });
    el.btnPlayAgain.addEventListener("click", backToSetup);
    el.btnBackSetup.addEventListener("click", backToSetup);
    el.subtitleToggle.addEventListener("change", () => renderQuestionTranslation());
    el.reportGlobalTranslationToggle.addEventListener("change", () => { if (reportModel) renderReport(reportModel.report, reportModel.meta); });
  }

  function renderPlayerSummary() {
    if (!gameState.interviewsCompleted) { el.playerSummary.hidden = true; return; }
    const progress = IQ.game.xpProgress(gameState.xp);
    el.playerSummary.hidden = false;
    el.playerSummary.textContent = `Welcome back! Level ${progress.level} · ${gameState.xp} XP · ${gameState.streak}-day streak`;
  }

  function buildSetupOptionGrids() {
    renderGrid("role-grid", IQ.questions.ROLES.map((role) => ({ value: role.id, label: IQ.i18n.getText(role.labelText) })), "role");
    renderGrid("difficulty-grid", IQ.questions.DIFFICULTIES.map((difficulty) => ({ value: difficulty.id, label: difficulty.label, sub: `${difficulty.questionCount} questions` })), "difficulty");
    renderGrid("gender-grid", [{ value: "female", label: "Sarah", sub: "career interviewer" }, { value: "male", label: "David", sub: "career interviewer" }], "gender");
    renderGrid("personality-grid", [{ value: "friendly", label: "Friendly" }, { value: "professional", label: "Professional" }, { value: "strict", label: "Strict" }], "personality");
    renderGrid("mode-grid", [{ value: "practice", label: t("practiceMode"), sub: "Tips as you go" }, { value: "real", label: t("realMode"), sub: "Feedback at the end" }], "mode");
    el.demoSpeedToggle.checked = choices.demoSpeed;
  }

  function renderGrid(id, items, choiceKey) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = "";
    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-btn";
      button.setAttribute("aria-pressed", String(choices[choiceKey] === item.value));
      button.textContent = item.label;
      if (item.sub) { const sub = document.createElement("span"); sub.className = "option-sub"; sub.textContent = item.sub; button.appendChild(sub); }
      button.addEventListener("click", () => { choices[choiceKey] = item.value; buildSetupOptionGrids(); });
      container.appendChild(button);
    });
  }

  function updateAIStatusNote() {
    el.aiStatusNote.textContent = aiAvailableCached
      ? "Live AI follow-ups are ready. The core interview plan remains reliable and on this device."
      : "The built-in interview plan is ready. Add no key to use the complete offline fallback.";
    el.aiStatusNote.className = `ai-status-note ${aiAvailableCached ? "is-live" : "is-fallback"}`;
  }

  function roleLabelFor(id) { return IQ.i18n.getText(IQ.questions.getCareer(id).label, "en"); }

  function newSession() {
    const plan = IQ.questions.getPlan(choices.role, choices.difficulty, choices.demoSpeed);
    return {
      id: ++operationId,
      roleId: choices.role,
      roleLabel: roleLabelFor(choices.role),
      difficultyId: choices.difficulty,
      gender: choices.gender,
      personality: choices.personality,
      mode: choices.mode,
      demoSpeed: choices.demoSpeed,
      interviewerName: choices.gender === "male" ? "David" : "Sarah",
      usingAI: aiAvailableCached,
      plan,
      mainIndex: 0,
      currentQuestion: plan[0],
      currentTurnKind: "main",
      followUpsUsed: 0,
      followUpBudget: choices.demoSpeed ? 1 : IQ.questions.getDifficulty(choices.difficulty).followUpBudget,
      followedMainIds: new Set(),
      transcript: [],
      xpEarned: 0,
      activePowerUps: { doubleXPNext: false },
      hintUsedForCurrent: false,
      lastSubmission: null,
      prepTimer: null,
      prepRemaining: 0,
      pendingFinish: false,
      complete: false,
      reportCompleted: false,
    };
  }

  async function startInterview() {
    cancelActiveWork();
    session = newSession();
    state.set(IQ.interviewState.PHASES.SETUP);
    IQ.ui.showView("view-interview");
    el.interviewerName.textContent = session.interviewerName;
    el.interviewerRoleLabel.textContent = `${session.roleLabel} · ${capitalize(session.difficultyId)}`;
    el.characterSarah.hidden = session.gender !== "female";
    el.characterDavid.hidden = session.gender !== "male";
    el.subtitleToggle.checked = true;
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    renderPowerUps();
    await presentCurrentQuestion();
  }

  function isCurrent(token, allowComplete) { return Boolean(session && token === session.id && (allowComplete || !session.complete)); }

  async function presentCurrentQuestion(options) {
    const opts = options || {};
    if (!session || !session.currentQuestion || session.complete) return;
    const token = ++operationId;
    session.id = token;
    cancelActiveWork({ keepSpeech: false });
    state.set(IQ.interviewState.PHASES.PRESENTING);
    session.hintUsedForCurrent = false;
    clearPrepTimer();
    renderCurrentTurn({ preserveInput: opts.preserveInput });
    updateControls();
    setInterviewerState("speaking", t("speaking"));
    const result = await IQ.speech.speak(session.currentQuestion.text.en, {
      gender: session.gender,
      personality: session.personality,
    });
    if (!isCurrent(token)) return;
    if (state.phase !== IQ.interviewState.PHASES.PRESENTING) return;
    state.set(IQ.interviewState.PHASES.READY);
    setInterviewerState("waiting", t("yourTurn"));
    if (!opts.preserveInput) startPrepTimer();
    updateControls();
    if (!result.ok && result.reason !== "unsupported" && result.reason !== "end") IQ.ui.toast("The question is visible on screen, so you can continue without audio.");
  }

  function renderCurrentTurn(options) {
    const opts = options || {};
    const question = session.currentQuestion;
    el.stageLabel.textContent = IQ.i18n.getText(IQ.questions.STAGE_LABELS[question.stage] || { en: "Follow-up" });
    const completedMain = session.mainIndex;
    const totalMain = session.plan.length;
    el.questionProgress.textContent = `${t("interviewProgress")} · ${Math.min(completedMain + 1, totalMain)} / ${totalMain}`;
    el.progressDots.innerHTML = "";
    for (let index = 0; index < totalMain; index += 1) {
      const dot = document.createElement("span");
      dot.className = index < session.mainIndex ? "is-done" : index === session.mainIndex ? "is-current" : "";
      el.progressDots.appendChild(dot);
    }
    el.questionText.textContent = question.text.en;
    el.questionText.dir = "ltr";
    renderQuestionTranslation();
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    if (!opts.preserveInput) { el.answerInput.value = ""; el.liveTranscript.textContent = ""; }
  }

  function renderQuestionTranslation() {
    if (!session || !session.currentQuestion) return;
    const locale = currentTranslationLanguage();
    const text = IQ.i18n.getText(session.currentQuestion.text, locale);
    const visible = el.subtitleToggle.checked && locale !== "en" && text && text !== session.currentQuestion.text.en;
    el.questionTranslation.hidden = !visible;
    el.questionTranslationText.textContent = text;
    el.questionTranslation.dir = IQ.i18n.getLanguage(locale).dir;
  }

  function setInterviewerState(kind, label) {
    if (!el.interviewerCharacter) return;
    el.interviewerCharacter.className = `interviewer-character is-${kind}`;
    el.interviewerStatus.textContent = label;
  }

  function updateControls() {
    const controls = state.controls();
    el.btnStartAnswer.disabled = !controls.canStartAnswer || !IQ.speech.hasSTT;
    el.btnStopAnswer.disabled = !controls.canStopAnswer;
    el.btnFinishAnswer.disabled = !controls.canFinishAnswer;
    el.btnSkipQuestion.disabled = !controls.canSkip;
    el.btnRepeatQuestion.disabled = !controls.canRepeat;
    el.btnEndInterview.disabled = !controls.canEnd;
    el.answerInput.disabled = state.phase === IQ.interviewState.PHASES.SUBMITTING || state.phase === IQ.interviewState.PHASES.CLOSING;
    if (state.phase === IQ.interviewState.PHASES.RECORDING) {
      el.micStatusLabel.textContent = `${t("listening")} — ${t("stopAnswer")} keeps your text editable.`;
    } else if (!IQ.speech.hasSTT) {
      el.micStatusLabel.textContent = "Speech recognition is unavailable in this browser. Type your English answer instead.";
    } else if (state.phase === IQ.interviewState.PHASES.SUBMITTING) {
      el.micStatusLabel.textContent = t("processing");
    } else if (state.phase === IQ.interviewState.PHASES.READY) {
      el.micStatusLabel.textContent = "Your answer stays editable. Start recording or type when ready.";
    }
    renderPowerUps();
  }

  function startAnswer() {
    if (!state.can("record")) return;
    if (!IQ.speech.hasSTT) { IQ.ui.toast("Speech recognition is unavailable. You can type your answer."); return; }
    const token = session.id;
    const response = IQ.speech.startListening({
      onStart: () => {
        if (!isCurrent(token) || !state.can("record")) return;
        state.transition("record");
        setInterviewerState("listening", t("listening"));
        updateControls();
      },
      onInterim: (event) => { if (isCurrent(token)) el.liveTranscript.textContent = event.text ? `… ${event.text}` : ""; },
      onFinal: (event) => { if (isCurrent(token)) el.answerInput.value = event.text; },
      onError: (reason) => { if (isCurrent(token)) handleSpeechError(reason); },
      onEnd: () => {
        if (!isCurrent(token)) return;
        el.liveTranscript.textContent = "";
        const shouldSubmit = session.pendingFinish;
        session.pendingFinish = false;
        if (state.phase === IQ.interviewState.PHASES.RECORDING || state.phase === IQ.interviewState.PHASES.STOPPING) state.set(IQ.interviewState.PHASES.READY);
        setInterviewerState("waiting", t("yourTurn"));
        updateControls();
        if (shouldSubmit) finishAnswer();
      },
    }, { initialText: el.answerInput.value, language: "en-US" });
    if (!response.started) handleSpeechError("start_failed");
  }

  function handleSpeechError(reason) {
    const messages = {
      not_allowed: "Microphone access was blocked. Type your answer, or allow microphone access and try again.",
      no_speech: "No speech was detected. Your typed text is still available; try again if you wish.",
      audio_capture: "No microphone was found. You can type your answer instead.",
      network: "Speech recognition is temporarily unavailable. Continue by typing your answer.",
      unsupported: "Speech recognition is unavailable in this browser. Continue by typing.",
      start_failed: "The microphone could not start. Continue by typing your answer.",
    };
    session.pendingFinish = false;
    if (state.phase === IQ.interviewState.PHASES.RECORDING || state.phase === IQ.interviewState.PHASES.STOPPING) state.set(IQ.interviewState.PHASES.READY);
    setInterviewerState("waiting", t("yourTurn"));
    updateControls();
    if (reason !== "aborted") IQ.ui.toast(messages[reason] || "Voice input stopped. Your typed answer is still available.", "error");
  }

  function stopAnswer() {
    if (!state.can("stop")) return;
    state.transition("stop");
    updateControls();
    if (!IQ.speech.stopListening()) {
      state.set(IQ.interviewState.PHASES.READY);
      updateControls();
    }
  }

  function finishAnswer() {
    if (!session || session.complete) return;
    if (state.phase === IQ.interviewState.PHASES.RECORDING) {
      session.pendingFinish = true;
      stopAnswer();
      return;
    }
    if (state.phase === IQ.interviewState.PHASES.STOPPING) { session.pendingFinish = true; return; }
    if (!state.can("submit")) return;
    const answer = el.answerInput.value.trim();
    if (!answer) { IQ.ui.toast("Please say or type an answer first, or choose Skip Question."); return; }
    submitAnswer(answer, {});
  }

  function startPrepTimer() {
    clearPrepTimer();
    session.prepRemaining = session.demoSpeed ? 8 : 20;
    el.prepTimer.hidden = false;
    updatePrepTimer();
    session.prepTimer = setInterval(() => {
      session.prepRemaining -= 1;
      if (session.prepRemaining <= 0) { clearPrepTimer(); return; }
      updatePrepTimer();
    }, 1000);
  }
  function updatePrepTimer() { el.prepTimer.textContent = `Take a moment to think… ${session.prepRemaining}s`; }
  function extendPrepTimer(seconds) { if (!session.prepTimer) startPrepTimer(); session.prepRemaining += seconds; updatePrepTimer(); }
  function clearPrepTimer() { if (session && session.prepTimer) clearInterval(session.prepTimer); if (session) session.prepTimer = null; el.prepTimer.hidden = true; }

  async function submitAnswer(rawText, options) {
    const opts = options || {};
    if (!session || session.complete || !state.can(opts.skipped ? "skip" : "submit")) return;
    const token = session.id;
    state.transition(opts.skipped ? "skip" : "submit");
    clearPrepTimer();
    IQ.speech.abortListening();
    session.pendingFinish = false;
    setInterviewerState("thinking", t("thinking"));
    updateControls();
    const snapshot = {
      mainIndex: session.mainIndex,
      currentQuestion: clone(session.currentQuestion),
      currentTurnKind: session.currentTurnKind,
      followUpsUsed: session.followUpsUsed,
      followedMainIds: Array.from(session.followedMainIds),
      transcriptLength: session.transcript.length,
      xpEarned: session.xpEarned,
      doubleXPNext: session.activePowerUps.doubleXPNext,
    };
    const analysis = IQ.feedback.analyzeAnswer(rawText);
    const entry = {
      questionId: session.currentQuestion.id,
      question: session.currentQuestion.text.en,
      questionText: clone(session.currentQuestion.text),
      answer: rawText,
      analysis,
      awardedXP: 0,
      skipped: Boolean(opts.skipped),
      hintUsed: session.hintUsedForCurrent,
      turnKind: session.currentTurnKind,
      stage: session.currentQuestion.stage,
    };
    session.transcript.push(entry);
    session.lastSubmission = snapshot;
    if (!opts.skipped) {
      const gained = IQ.game.answerXP(analysis, session.activePowerUps.doubleXPNext);
      session.activePowerUps.doubleXPNext = false;
      entry.awardedXP = gained;
      session.xpEarned += gained;
      gameState.xp += gained;
      IQ.game.save(gameState);
      IQ.ui.renderHUD(gameState);
    }
    if (session.mode === "practice" && !opts.skipped) {
      el.quickTipPanel.hidden = false;
      el.quickTipText.textContent = analysis.quickTip;
    }
    try {
      await decideNextTurn(entry, opts, token);
    } catch (error) {
      if (isCurrent(token)) advanceMainQuestion();
    }
    if (!isCurrent(token)) return;
    if (session.complete) return;
    await presentCurrentQuestion();
  }

  async function decideNextTurn(entry, opts, token) {
    const isMain = session.currentTurnKind === "main";
    const question = session.currentQuestion;
    const canFollow = isMain && !opts.skipped && question.followUpEligible && !session.followedMainIds.has(question.id) && session.followUpsUsed < session.followUpBudget;
    if (!canFollow) { advanceMainQuestion(); return; }
    let decision = { action: "advance" };
    if (session.usingAI) {
      activeRequest = new AbortController();
      try {
        decision = await IQ.ai.requestFollowUp({
          roleId: session.roleId, stage: question.stage, questionId: question.id, questionEn: question.text.en,
          answer: entry.answer, personality: session.personality, translationLanguage: currentTranslationLanguage(),
        }, { signal: activeRequest.signal });
      } catch (error) {
        if (error.name === "AbortError") return;
        session.usingAI = false;
      } finally {
        activeRequest = null;
      }
    }
    if (!isCurrent(token)) return;
    if (decision.action === "follow_up") {
      setFollowUpQuestion(question, { en: decision.questionEn, ...decision.questionTranslation });
      return;
    }
    if (!session.usingAI && entry.analysis.wordCount > 0 && entry.analysis.wordCount < 15) {
      setFollowUpQuestion(question, IQ.questions.getFollowUp(question).text);
      return;
    }
    advanceMainQuestion();
  }

  function setFollowUpQuestion(parentQuestion, text) {
    session.followedMainIds.add(parentQuestion.id);
    session.followUpsUsed += 1;
    session.currentTurnKind = "follow_up";
    session.currentQuestion = {
      id: `${parentQuestion.id}-follow-up-${session.followUpsUsed}`,
      parentId: parentQuestion.id,
      roleId: parentQuestion.roleId,
      stage: parentQuestion.stage,
      text: { ...text },
      hint: parentQuestion.hint,
      isFollowUp: true,
      followUpEligible: false,
      isClosing: false,
    };
  }

  function advanceMainQuestion() {
    if (session.currentTurnKind === "main") session.mainIndex += 1;
    else session.mainIndex += 1;
    session.currentTurnKind = "main";
    if (session.mainIndex >= session.plan.length) { finishInterview({ partial: false }); return; }
    session.currentQuestion = session.plan[session.mainIndex];
  }

  function renderPowerUps() {
    if (!session || session.complete || !el.powerupBar) return;
    IQ.ui.renderPowerUps(gameState, usePowerUp, { disabled: state.controls().isBusy || state.phase === IQ.interviewState.PHASES.RECORDING });
  }

  async function usePowerUp(key) {
    if (!session || session.complete || state.controls().isBusy) return;
    if (key === "replay") { await presentCurrentQuestion({ preserveInput: true }); return; }
    if (key === "secondChance" && (!session.lastSubmission || !session.transcript.length)) {
      IQ.ui.toast("Nothing has been submitted yet, so there is nothing to redo.");
      return;
    }
    if (!IQ.game.consumePowerUp(gameState, key)) { IQ.ui.toast("None left — complete interviews to earn more."); return; }
    if (key === "thinkTime") { extendPrepTimer(session.demoSpeed ? 10 : 20); IQ.ui.toast("Extra thinking time added.", "success"); }
    if (key === "doubleXP") { session.activePowerUps.doubleXPNext = true; IQ.ui.toast("2× XP is active for your next answer.", "success"); }
    if (key === "hint") { session.hintUsedForCurrent = true; showHint(); }
    if (key === "secondChance") useSecondChance();
    IQ.ui.renderHUD(gameState);
    renderPowerUps();
  }

  function showHint() {
    const hint = session.currentQuestion.hint || {};
    el.hintPanel.hidden = false;
    el.hintText.textContent = hint.en || IQ.questions.getHint(session.currentQuestion.text.en);
    const locale = currentTranslationLanguage();
    const translation = IQ.i18n.getText(hint, locale);
    const show = locale !== "en" && translation && translation !== hint.en;
    el.hintTranslation.hidden = !show;
    el.hintTranslation.textContent = show ? translation : "";
    el.hintTranslation.dir = IQ.i18n.getLanguage(locale).dir;
  }

  function useSecondChance() {
    const snapshot = session.lastSubmission;
    if (!snapshot) return;
    const removed = session.transcript.pop();
    if (removed && removed.awardedXP) {
      gameState.xp = Math.max(0, gameState.xp - removed.awardedXP);
      session.xpEarned = Math.max(0, session.xpEarned - removed.awardedXP);
      IQ.game.save(gameState);
      IQ.ui.renderHUD(gameState);
    }
    session.mainIndex = snapshot.mainIndex;
    session.currentQuestion = snapshot.currentQuestion;
    session.currentTurnKind = snapshot.currentTurnKind;
    session.followUpsUsed = snapshot.followUpsUsed;
    session.followedMainIds = new Set(snapshot.followedMainIds);
    session.activePowerUps.doubleXPNext = snapshot.doubleXPNext;
    session.lastSubmission = null;
    state.set(IQ.interviewState.PHASES.READY);
    renderCurrentTurn();
    el.questionText.textContent += " (try this one again)";
    setInterviewerState("waiting", t("yourTurn"));
    updateControls();
    showHint();
  }

  function showEndDialog() {
    if (!session || !state.controls().canEnd) return;
    if (typeof el.endInterviewDialog.showModal === "function") el.endInterviewDialog.showModal();
    else if (window.confirm("End this interview and view a partial report?")) endInterviewEarly();
  }

  function endInterviewEarly() {
    if (el.endInterviewDialog.open) el.endInterviewDialog.close();
    if (!session || session.complete) return;
    finishInterview({ partial: true, skipClosingSpeech: true });
  }

  async function finishInterview(options) {
    const opts = options || {};
    if (!session || session.complete) return;
    const token = ++operationId;
    session.id = token;
    session.complete = true;
    cancelActiveWork();
    if (!session || session.id !== token) return;
    state.set(IQ.interviewState.PHASES.CLOSING);
    setInterviewerState("thinking", "Preparing your training report…");
    updateControls();
    if (!opts.skipClosingSpeech) {
      const closing = "Thank you for practicing with me today. Your training report is ready.";
      el.questionText.textContent = closing;
      await IQ.speech.speak(closing, { gender: session.gender, personality: session.personality });
    }
    if (!isCurrent(token, true)) return;
    await buildAndShowReport(Boolean(opts.partial));
  }

  async function buildAndShowReport(isPartial) {
    let report = IQ.feedback.buildReport(session.transcript, { plannedQuestions: session.plan.length, isPartial });
    if (session.usingAI && session.transcript.length) {
      activeRequest = new AbortController();
      try {
        const aiReport = await IQ.ai.requestReport({
          roleId: session.roleId, difficulty: session.difficultyId, mode: session.mode, translationLanguage: currentTranslationLanguage(),
          entries: session.transcript.map((entry) => ({ questionId: entry.questionId, questionEn: entry.question, answer: entry.answer, skipped: entry.skipped })),
        }, { signal: activeRequest.signal });
        report = IQ.feedback.mergeAIReport(report, aiReport);
      } catch (error) {
        if (error.name !== "AbortError") IQ.ui.toast("Your complete local training report is ready; AI coaching was unavailable.");
      } finally { activeRequest = null; }
    }
    const totalFillers = session.transcript.reduce((sum, entry) => sum + (entry.analysis ? entry.analysis.fillerCount : 0), 0);
    const starAnswers = session.transcript.filter((entry) => entry.analysis && entry.analysis.starHits >= 3).length;
    const completionXP = isPartial ? 0 : 20 + (session.mode === "real" ? 30 : 0) + ({ easy: 0, medium: 10, hard: 20 }[session.difficultyId] || 0);
    let result = { leveledUp: false, newAchievements: [] };
    if (!session.reportCompleted) {
      result = IQ.game.completeInterview(gameState, { mode: session.mode, usingAI: session.usingAI, difficulty: session.difficultyId, totalFillers, starAnswers, completionXP });
      session.reportCompleted = true;
      session.xpEarned += completionXP;
      IQ.ui.renderHUD(gameState);
    }
    const meta = { xpGained: session.xpEarned, leveledUp: result.leveledUp, newLevel: result.newLevel, newAchievements: result.newAchievements, isExample: false, transcript: session.transcript, roleLabel: session.roleLabel, difficulty: session.difficultyId, mode: session.mode, usingAI: session.usingAI, isPartial };
    reportModel = { report, meta };
    state.set(IQ.interviewState.PHASES.REPORT);
    renderReport(report, meta);
    IQ.ui.showView("view-report");
  }

  function scoreColor(score) { return score >= 75 ? "var(--success)" : score >= 45 ? "var(--xp)" : "var(--danger)"; }
  function createList(container, values, translationValues, showTranslation) {
    container.innerHTML = "";
    (values || []).forEach((value, index) => {
      const item = document.createElement("li");
      item.textContent = value;
      if (showTranslation && translationValues && translationValues[index]) item.appendChild(translationNode(translationValues[index]));
      container.appendChild(item);
    });
  }

  function translationNode(text) {
    const node = document.createElement("div");
    node.className = "translation-block report-translation";
    node.dir = IQ.i18n.getLanguage(currentTranslationLanguage()).dir;
    node.innerHTML = `<span class="translation-label">${escapeHTML(t("translation"))}</span>`;
    const content = document.createElement("span");
    content.textContent = text;
    node.appendChild(content);
    return node;
  }

  function escapeHTML(value) { const element = document.createElement("span"); element.textContent = value; return element.innerHTML; }

  function renderReport(report, meta) {
    const locale = currentTranslationLanguage();
    const translation = (report.translations || {})[locale] || {};
    const showTranslation = el.reportGlobalTranslationToggle.checked && locale !== "en";
    el.reportModeNote.textContent = `${meta.roleLabel} · ${capitalize(meta.difficulty)} · ${meta.mode === "real" ? t("realMode") : t("practiceMode")} · ${meta.isPartial ? t("partialReport") : "Completed"}`;
    el.reportExampleBanner.hidden = !meta.isExample;
    const score = Math.max(0, Math.min(100, Math.round(report.overallScore || 0)));
    el.reportScoreRing.style.setProperty("--pct", score);
    el.reportScoreRing.style.setProperty("--score-color", scoreColor(score));
    el.reportScoreValue.textContent = score;
    el.reportXpGained.textContent = `+${meta.xpGained} XP`;
    el.reportStrongestSkill.textContent = report.strongestSkill || (report.strengths || [""])[0];
    el.reportBiggestImprovement.textContent = report.biggestImprovement || (report.weaknesses || [""])[0];
    el.reportSummary.innerHTML = "";
    const summary = document.createElement("p"); summary.textContent = report.summary || ""; el.reportSummary.appendChild(summary);
    if (showTranslation && translation.summary) el.reportSummary.appendChild(translationNode(translation.summary));
    if (meta.leveledUp) { el.reportLevelBanner.hidden = false; el.reportLevelBanner.textContent = `Level up! You reached Level ${meta.newLevel}.`; } else el.reportLevelBanner.hidden = true;
    el.reportAchievements.hidden = !(meta.newAchievements && meta.newAchievements.length);
    el.reportAchievements.innerHTML = "";
    (meta.newAchievements || []).forEach((achievement) => { const chip = document.createElement("span"); chip.className = "achievement-chip"; chip.title = achievement.desc; chip.innerHTML = IQ.ui.icon("star"); const label = document.createElement("span"); label.textContent = achievement.name; chip.appendChild(label); el.reportAchievements.appendChild(chip); });
    createList(el.reportStrengths, report.strengths, translation.strengths, showTranslation);
    createList(el.reportWeaknesses, report.weaknesses, translation.weaknesses, showTranslation);
    el.reportEnglishFeedback.innerHTML = "";
    const feedback = document.createElement("span"); feedback.textContent = report.englishFeedback || ""; el.reportEnglishFeedback.appendChild(feedback);
    if (showTranslation && translation.englishFeedback) el.reportEnglishFeedback.appendChild(translationNode(translation.englishFeedback));
    renderPerQuestion(report, meta, locale, showTranslation);
    createList(el.reportNextSteps, report.nextSteps, translation.nextSteps, showTranslation);
  }

  function renderPerQuestion(report, meta, locale, globalTranslation) {
    el.reportPerQuestion.innerHTML = "";
    (report.perQuestion || []).forEach((item, index) => {
      const transcript = (meta.transcript || []).find((entry) => entry.questionId === item.questionId) || (meta.transcript || [])[index] || {};
      const card = document.createElement("article"); card.className = "pq-card";
      const question = document.createElement("h3"); question.className = "pq-question"; question.textContent = item.question || transcript.question || `Question ${index + 1}`; question.dir = "ltr"; card.appendChild(question);
      const qTranslation = item.questionText ? IQ.i18n.getText(item.questionText, locale) : transcript.questionText ? IQ.i18n.getText(transcript.questionText, locale) : "";
      if (globalTranslation && qTranslation && qTranslation !== question.textContent) card.appendChild(translationNode(qTranslation));
      if (Object.prototype.hasOwnProperty.call(transcript, "answer")) {
        const label = document.createElement("div"); label.className = "pq-label"; label.textContent = t("answerOriginal"); card.appendChild(label);
        const answer = document.createElement("blockquote"); answer.className = "pq-answer"; answer.textContent = transcript.answer || "— Skipped —"; answer.dir = "auto"; card.appendChild(answer);
      }
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "card-translation-toggle btn btn-text"; toggle.setAttribute("aria-expanded", String(globalTranslation)); toggle.textContent = globalTranslation ? t("hideTranslation") : t("showTranslation"); card.appendChild(toggle);
      const translationArea = document.createElement("div"); translationArea.className = "card-translation-area"; translationArea.hidden = !globalTranslation;
      const content = () => {
        card.querySelectorAll(".card-coaching").forEach((node) => node.remove());
        const coaching = document.createElement("div"); coaching.className = "card-coaching";
        const tipLabel = document.createElement("div"); tipLabel.className = "pq-label"; tipLabel.textContent = "Coach tip"; coaching.appendChild(tipLabel);
        const tip = document.createElement("p"); tip.className = "pq-tip"; tip.textContent = item.tip || ""; coaching.appendChild(tip);
        const exampleLabel = document.createElement("div"); exampleLabel.className = "pq-label"; exampleLabel.textContent = "Example of a stronger answer"; coaching.appendChild(exampleLabel);
        const example = document.createElement("div"); example.className = "pq-improved"; example.textContent = item.improvedExample || ""; coaching.appendChild(example);
        card.insertBefore(coaching, toggle);
        translationArea.innerHTML = "";
        const translated = (item.translation || {})[locale] || {};
        if (locale !== "en" && (translated.tip || translated.improvedExample)) {
          if (translated.tip) translationArea.appendChild(translationNode(translated.tip));
          if (translated.improvedExample) translationArea.appendChild(translationNode(translated.improvedExample));
        } else if (locale !== "en") translationArea.textContent = t("translationUnavailable");
      };
      content();
      card.appendChild(translationArea);
      toggle.addEventListener("click", () => { translationArea.hidden = !translationArea.hidden; toggle.setAttribute("aria-expanded", String(!translationArea.hidden)); toggle.textContent = translationArea.hidden ? t("showTranslation") : t("hideTranslation"); });
      el.reportPerQuestion.appendChild(card);
    });
  }

  function loadExampleReport() {
    const sample = IQ.sampleData;
    const transcript = sample.transcript.map((entry, index) => ({ ...entry, questionId: `sample-${index + 1}`, questionText: { en: entry.question }, analysis: IQ.feedback.analyzeAnswer(entry.answer) }));
    const report = IQ.feedback.buildReport(transcript, { plannedQuestions: 3 });
    reportModel = { report, meta: { xpGained: 0, leveledUp: false, newLevel: null, newAchievements: [], isExample: true, transcript, roleLabel: sample.meta.roleLabel, difficulty: sample.meta.difficulty, mode: sample.meta.mode, usingAI: false, isPartial: false } };
    state.set(IQ.interviewState.PHASES.REPORT);
    renderReport(reportModel.report, reportModel.meta);
    IQ.ui.showView("view-report");
  }

  function cancelActiveWork(options) {
    const opts = options || {};
    clearPrepTimer();
    if (activeRequest) { activeRequest.abort(); activeRequest = null; }
    IQ.speech.abortListening();
    if (!opts.keepSpeech) IQ.speech.stopSpeaking();
  }

  function interruptTurn() {
    operationId += 1;
    if (session) session.id = operationId;
    cancelActiveWork();
  }

  function backToSetup() {
    interruptTurn();
    session = null;
    state.set(IQ.interviewState.PHASES.SETUP);
    renderPlayerSummary();
    IQ.ui.showView("view-setup");
  }
})();

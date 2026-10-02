/* ===========================================================
   Ready2Interview — staged interview controller
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
  let endDialogConfirmed = false;
  let el = {};

  const INTERVIEWERS = {
    sarah: { id: "sarah", labelKey: "interviewerSarah", visualId: "sarah", voicePreference: "female" },
    david: { id: "david", labelKey: "interviewerDavid", visualId: "david", voicePreference: "male" },
  };
  const choices = {
    role: "general", difficulty: "medium", interviewer: "sarah", personality: "friendly", mode: "practice", demoSpeed: false,
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    state = IQ.interviewState.create();
    gameState = IQ.game.load();
    IQ.ui.renderHUD(gameState);
    buildLanguageSelectors();
    renderInterface();
    renderThemeToggle();
    wireStaticButtons();
    renderPlayerSummary();
    aiAvailableCached = await IQ.ai.checkStatus();
    updateAIStatusNote();
  }

  function cacheDom() {
    const ids = [
      "theme-toggle", "player-summary", "candidate-name", "candidate-name-error", "session-candidate", "report-candidate-name", "ai-status-note", "interface-language-select", "translation-language-select", "interview-language-select", "interview-language-note",
      "btn-start-interview", "btn-load-example", "demo-speed-toggle", "interview-translation-language-select", "subtitle-toggle", "btn-end-interview",
      "interviewer-character", "character-sarah", "character-david", "interviewer-name", "interviewer-role-label", "interviewer-status", "stage-label", "question-progress", "progress-dots",
      "question-text", "question-translation", "question-translation-text", "prep-timer", "hint-panel", "hint-text", "hint-translation", "quick-tip-panel", "quick-tip-text",
      "office-scene", "practice-feedback-panel", "feedback-score", "feedback-strength", "feedback-strength-translation", "feedback-improvement", "feedback-improvement-translation", "feedback-indicators", "feedback-tip-text", "feedback-tip-translation", "btn-continue-interview", "btn-retry-answer", "btn-hear-feedback",
      "live-transcript", "answer-input", "mic-status-label", "btn-start-answer", "btn-stop-answer", "btn-finish-answer", "btn-skip-question", "btn-repeat-question", "powerup-bar",
      "end-interview-dialog", "btn-cancel-end", "btn-confirm-end", "btn-play-again", "btn-back-setup", "report-global-translation-toggle",
      "report-mode-note", "report-example-banner", "report-score-ring", "report-score-value", "report-xp-gained", "report-level-banner", "report-achievements",
      "report-strongest-skill", "report-biggest-improvement", "report-summary", "report-strengths", "report-weaknesses", "report-metrics", "report-english-feedback", "report-per-question", "report-next-steps",
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
    document.title = `Ready2Interview — ${t("appTagline")}`;
    document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
    document.querySelectorAll("[data-i18n-title]").forEach((node) => { node.title = t(node.dataset.i18nTitle); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    renderThemeToggle();
    buildSetupOptionGrids();
    const preferences = IQ.i18n.preferences;
    [el.interfaceLanguageSelect, el.translationLanguageSelect, el.interviewTranslationLanguageSelect].forEach((select) => { if (select) select.value = preferences[select === el.interfaceLanguageSelect ? "interfaceLanguage" : "translationLanguage"]; });
    el.interviewLanguageSelect.value = preferences.interviewLanguage;
    el.interviewLanguageNote.textContent = t("EnglishOnly");
    renderPlayerSummary();
    updateAIStatusNote();
    IQ.ui.renderHUD(gameState);
    if (session && !session.complete) {
      session.interviewerName = interviewerDisplayName(session.interviewer);
      el.interviewerName.textContent = session.interviewerName;
      el.interviewerRoleLabel.textContent = interviewerRoleLabel();
      renderSessionCandidate();
      renderCurrentTurn();
      if (state.phase === IQ.interviewState.PHASES.REVIEWING && session.pendingPracticeEntry) {
        renderPracticeFeedback(session.pendingPracticeEntry);
      }
      updateControls();
    }
    if (reportModel) renderReport(reportModel.report, reportModel.meta);
  }

  function renderThemeToggle() {
    if (!el.themeToggle || !IQ.theme) return;
    const isDark = IQ.theme.value === "dark";
    const nextAction = t(isDark ? "themeSwitchToLight" : "themeSwitchToDark");
    el.themeToggle.innerHTML = IQ.ui.icon(isDark ? "sun" : "moon");
    el.themeToggle.setAttribute("aria-pressed", String(isDark));
    el.themeToggle.setAttribute("aria-label", nextAction);
    el.themeToggle.title = nextAction;
  }

  function setCandidateNameError(message) {
    const hasError = Boolean(message);
    el.candidateName.setAttribute("aria-invalid", String(hasError));
    el.candidateNameError.hidden = !hasError;
    el.candidateNameError.textContent = message || "";
  }

  function renderSessionCandidate() {
    const candidateName = session && session.candidateName ? session.candidateName : "";
    el.sessionCandidate.hidden = !candidateName;
    el.sessionCandidate.textContent = candidateName ? t("practicingAs", { name: candidateName }) : "";
  }

  function wireStaticButtons() {
    el.themeToggle.addEventListener("click", () => {
      IQ.theme.toggle();
      renderThemeToggle();
    });
    el.candidateName.addEventListener("input", () => {
      if (el.candidateName.value.trim()) setCandidateNameError("");
    });
    el.interfaceLanguageSelect.addEventListener("change", () => { IQ.i18n.setInterfaceLanguage(el.interfaceLanguageSelect.value); renderInterface(); });
    [el.translationLanguageSelect, el.interviewTranslationLanguageSelect].forEach((select) => select.addEventListener("change", () => {
      IQ.i18n.setTranslationLanguage(select.value);
      renderInterface();
    }));
    el.interviewLanguageSelect.addEventListener("change", () => { IQ.i18n.setInterviewLanguage(el.interviewLanguageSelect.value); renderInterface(); });
    el.demoSpeedToggle.addEventListener("change", () => { choices.demoSpeed = el.demoSpeedToggle.checked; });
    el.btnStartInterview.addEventListener("click", startInterview);
    el.btnLoadExample.addEventListener("click", loadExampleReport);
    document.querySelectorAll(".button-icon").forEach((icon) => { icon.innerHTML = IQ.ui.icon("mic"); });
    document.querySelectorAll(".voice-helper-icon").forEach((icon) => { icon.innerHTML = IQ.ui.icon("mic"); });
    el.btnStartAnswer.addEventListener("click", startAnswer);
    el.btnStopAnswer.addEventListener("click", stopAnswer);
    el.btnFinishAnswer.addEventListener("click", finishAnswer);
    el.btnSkipQuestion.addEventListener("click", () => submitAnswer("", { skipped: true }));
    el.btnRepeatQuestion.addEventListener("click", () => presentCurrentQuestion({ preserveInput: true }));
    el.btnContinueInterview.addEventListener("click", continueAfterFeedback);
    el.btnRetryAnswer.addEventListener("click", retryPracticeAnswer);
    el.btnHearFeedback.addEventListener("click", hearPracticeFeedback);
    el.btnEndInterview.addEventListener("click", showEndDialog);
    el.btnConfirmEnd.addEventListener("click", () => endInterviewEarly());
    el.btnCancelEnd.addEventListener("click", () => { if (el.endInterviewDialog.open) el.endInterviewDialog.close(); });
    el.endInterviewDialog.addEventListener("close", () => {
      if (!endDialogConfirmed) restoreEndInterviewFocus();
      endDialogConfirmed = false;
    });
    el.btnPlayAgain.addEventListener("click", backToSetup);
    el.btnBackSetup.addEventListener("click", backToSetup);
    el.subtitleToggle.addEventListener("change", () => renderQuestionTranslation());
    el.reportGlobalTranslationToggle.addEventListener("change", () => { if (reportModel) renderReport(reportModel.report, reportModel.meta); });
  }

  function renderPlayerSummary() {
    if (!gameState.interviewsCompleted) { el.playerSummary.hidden = true; return; }
    const progress = IQ.game.xpProgress(gameState.xp);
    el.playerSummary.hidden = false;
    el.playerSummary.textContent = t("playerSummary", { level: progress.level, xp: gameState.xp, streak: gameState.streak });
  }

  function buildSetupOptionGrids() {
    renderGrid("role-grid", IQ.questions.ROLES.map((role) => ({ value: role.id, label: IQ.i18n.getText(role.labelText, IQ.i18n.preferences.interfaceLanguage) })), "role");
    renderGrid("difficulty-grid", IQ.questions.DIFFICULTIES.map((difficulty) => ({ value: difficulty.id, label: t(`difficulty${capitalize(difficulty.id)}`), sub: `${difficulty.questionCount} ${t("questions")}` })), "difficulty");
    renderGrid("gender-grid", [{ value: "sarah", label: interviewerDisplayName(INTERVIEWERS.sarah), sub: t("interviewerTitle") }, { value: "david", label: interviewerDisplayName(INTERVIEWERS.david), sub: t("interviewerTitle") }], "interviewer");
    renderGrid("personality-grid", [{ value: "friendly", label: t("personalityFriendly") }, { value: "professional", label: t("personalityProfessional") }, { value: "strict", label: t("personalityStrict") }], "personality");
    renderGrid("mode-grid", [{ value: "practice", label: t("practiceMode"), sub: t("practiceFeedback") }, { value: "real", label: t("realMode"), sub: t("communicationFeedback") }], "mode");
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
      const selected = choices[choiceKey] === item.value;
      button.setAttribute("aria-pressed", String(selected));
      button.setAttribute("aria-label", selected ? t("selectedOption", { label: item.label }) : t("option", { label: item.label }));
      if (choiceKey === "interviewer" && item.value === "david") {
        button.classList.add("has-interviewer-portrait");
        const portrait = document.createElement("span");
        portrait.className = "interviewer-option-portrait interviewer-option-david";
        portrait.setAttribute("aria-hidden", "true");
        portrait.innerHTML = '<svg viewBox="0 0 48 48" focusable="false"><path class="portrait-jacket" d="M9 48c2-13 8-19 15-20 7 1 13 7 15 20z"/><path class="portrait-shirt" d="m18 29 6 7 6-7 2 12H16z"/><path class="portrait-tie" d="m22 30h4l-1 6 1 8-2 3-2-3 1-8z"/><path class="portrait-skin" d="M14 17c0-10 4-15 10-15s10 5 10 15v6c0 7-4 11-10 11s-10-4-10-11z"/><path class="portrait-hair" d="M13 18C13 7 18 1 25 1c7 0 11 5 10 17-5-4-14-6-22 0z"/><path class="portrait-brow" d="M17 20h5m4 0h5"/><circle class="portrait-eye" cx="19" cy="23" r="1.2"/><circle class="portrait-eye" cx="29" cy="23" r="1.2"/><path class="portrait-beard" d="M15 27c2 5 5 7 9 7s7-2 9-7c-5 4-13 4-18 0z"/></svg>';
        button.appendChild(portrait);
      }
      const label = document.createElement("span");
      label.className = "option-label";
      label.textContent = item.label;
      button.appendChild(label);
      if (item.sub) { const sub = document.createElement("span"); sub.className = "option-sub"; sub.textContent = item.sub; button.appendChild(sub); }
      button.addEventListener("click", () => { choices[choiceKey] = item.value; buildSetupOptionGrids(); });
      container.appendChild(button);
    });
  }

  function updateAIStatusNote() {
    el.aiStatusNote.textContent = aiAvailableCached ? t("aiLiveReady") : t("aiFallbackReady");
    el.aiStatusNote.className = `ai-status-note ${aiAvailableCached ? "is-live" : "is-fallback"}`;
  }

  function roleLabelFor(id) { return IQ.i18n.getText(IQ.questions.getCareer(id).label, IQ.i18n.preferences.interfaceLanguage); }
  function labelForDifficulty(id) { return t(`difficulty${capitalize(id)}`); }
  function interviewerDisplayName(interviewer) { return t((interviewer || INTERVIEWERS.sarah).labelKey); }
  function interviewerRoleLabel() {
    return t("interviewerRoleLabel", {
      interviewer: interviewerDisplayName(session.interviewer),
      role: roleLabelFor(session.roleId),
      difficulty: labelForDifficulty(session.difficultyId),
    });
  }

  function newSession(candidateName) {
    const plan = IQ.questions.getPlan(choices.role, choices.difficulty, choices.demoSpeed);
    const interviewer = INTERVIEWERS[choices.interviewer] || INTERVIEWERS.sarah;
    return {
      id: ++operationId,
      candidateName,
      roleId: choices.role,
      roleLabel: roleLabelFor(choices.role),
      difficultyId: choices.difficulty,
      interviewer,
      personality: choices.personality,
      mode: choices.mode,
      demoSpeed: choices.demoSpeed,
      interviewerName: interviewerDisplayName(interviewer),
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
      pendingTurn: null,
      pendingPracticeEntry: null,
      conversationMemory: { answeredQuestionIds: [], followUpKinds: [], topics: [], technologies: [], missingEvidence: [], metrics: { answers: 0, words: 0, fillers: 0, starParts: { situation: 0, task: 0, action: 0, result: 0 } } },
      complete: false,
      reportCompleted: false,
    };
  }

  async function startInterview() {
    const candidateName = el.candidateName.value.trim();
    if (!candidateName) {
      setCandidateNameError(t("candidateNameRequired"));
      requestAnimationFrame(() => el.candidateName.focus());
      return;
    }
    setCandidateNameError("");
    cancelActiveWork();
    session = newSession(candidateName);
    state.set(IQ.interviewState.PHASES.SETUP);
    IQ.ui.showView("view-interview");
    el.interviewerName.textContent = session.interviewerName;
    el.interviewerRoleLabel.textContent = interviewerRoleLabel();
    renderSessionCandidate();
    el.characterSarah.hidden = session.interviewer.visualId !== "sarah";
    el.characterDavid.hidden = session.interviewer.visualId !== "david";
    el.subtitleToggle.checked = true;
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    el.practiceFeedbackPanel.hidden = true;
    renderPowerUps();
    await presentCurrentQuestion();
  }

  function isCurrent(token, allowComplete) { return Boolean(session && token === session.id && (allowComplete || !session.complete)); }

  async function presentCurrentQuestion(options) {
    const opts = options || {};
    if (!session || !session.currentQuestion || session.complete) return;
    const preservedHint = Boolean(opts.preserveInput && session.hintUsedForCurrent);
    const preservedPrepRemaining = opts.preserveInput ? session.prepRemaining : 0;
    const token = ++operationId;
    session.id = token;
    cancelActiveWork({ keepSpeech: false });
    state.set(IQ.interviewState.PHASES.PRESENTING);
    session.hintUsedForCurrent = preservedHint;
    clearPrepTimer();
    renderCurrentTurn({ preserveInput: opts.preserveInput });
    if (preservedHint) showHint();
    updateControls();
    setInterviewerState("speaking", t("speaking"));
    const speechOptions = { gender: session.interviewer.voicePreference, interviewerId: session.interviewer.id, personality: session.personality };
    if (opts.reaction && opts.reaction.en) {
      el.interviewerStatus.textContent = opts.reaction.en;
      await IQ.speech.speak(opts.reaction.en, speechOptions);
      if (!isCurrent(token)) return;
    }
    const result = await IQ.speech.speak(session.currentQuestion.text.en, speechOptions);
    if (!isCurrent(token)) return;
    if (state.phase !== IQ.interviewState.PHASES.PRESENTING) return;
    state.set(IQ.interviewState.PHASES.READY);
    setInterviewerState("waiting", t("yourTurn"));
    if (opts.preserveInput && preservedPrepRemaining > 0) restorePrepTimer(preservedPrepRemaining);
    else if (!opts.preserveInput) startPrepTimer();
    updateControls();
    if (opts.focusQuestion) focusCurrentQuestion();
    if (!result.ok && result.reason !== "unsupported" && result.reason !== "end") IQ.ui.toast(t("voiceUnavailable"));
  }

  function focusCurrentQuestion() {
    requestAnimationFrame(() => {
      if (!session || session.complete || !el.questionText) return;
      try { el.questionText.focus({ preventScroll: false }); }
      catch (error) { el.questionText.focus(); }
    });
  }

  function renderCurrentTurn(options) {
    const opts = options || {};
    const question = session.currentQuestion;
    el.stageLabel.textContent = question.isFollowUp ? t("followUp") : IQ.i18n.getText(IQ.questions.STAGE_LABELS[question.stage] || { en: t("followUp") });
    const completedMain = session.mainIndex;
    const totalMain = session.plan.length;
    el.questionProgress.textContent = `${t("interviewProgress")} · ${t("questionProgress", { current: Math.min(completedMain + 1, totalMain), total: totalMain })}`;
    el.progressDots.innerHTML = "";
    for (let index = 0; index < totalMain; index += 1) {
      const dot = document.createElement("span");
      const isCurrent = index === session.mainIndex;
      dot.className = index < session.mainIndex ? "is-done" : isCurrent ? "is-current" : "";
      el.progressDots.appendChild(dot);
    }
    el.questionText.textContent = question.text.en;
    el.questionText.dir = "ltr";
    renderQuestionTranslation();
    el.hintPanel.hidden = true;
    el.quickTipPanel.hidden = true;
    el.practiceFeedbackPanel.hidden = true;
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
    const isRecording = state.phase === IQ.interviewState.PHASES.RECORDING;
    const isStopping = state.phase === IQ.interviewState.PHASES.STOPPING;
    el.btnStartAnswer.disabled = !controls.canStartAnswer || !IQ.speech.hasSTT;
    el.btnStartAnswer.setAttribute("aria-pressed", String(isRecording || isStopping));
    el.btnStopAnswer.disabled = !controls.canStopAnswer;
    el.btnFinishAnswer.disabled = !controls.canFinishAnswer;
    el.btnSkipQuestion.disabled = !controls.canSkip;
    el.btnRepeatQuestion.disabled = !controls.canRepeat;
    el.btnEndInterview.disabled = !controls.canEnd;
    el.btnContinueInterview.disabled = !controls.canContinue;
    el.btnRetryAnswer.disabled = !controls.canRetry;
    el.btnHearFeedback.disabled = !controls.canHearFeedback;
    el.answerInput.disabled = state.phase === IQ.interviewState.PHASES.SUBMITTING || state.phase === IQ.interviewState.PHASES.CLOSING || state.phase === IQ.interviewState.PHASES.REVIEWING;
    el.answerInput.setAttribute("aria-describedby", isRecording ? "mic-status-label" : "voice-answer-helper mic-status-label");
    const answerArea = el.answerInput.closest(".answer-area");
    if (answerArea) answerArea.dataset.recording = String(isRecording || isStopping);
    if (isRecording) {
      el.micStatusLabel.textContent = t("listeningStatus", { listening: t("listening"), stopAnswer: t("stopAnswer") });
    } else if (isStopping) {
      el.micStatusLabel.textContent = t("stoppingMicrophone");
    } else if (!IQ.speech.hasSTT) {
      el.micStatusLabel.textContent = t("speakFallback");
    } else if (state.phase === IQ.interviewState.PHASES.SUBMITTING) {
      el.micStatusLabel.textContent = t("processing");
    } else if (state.phase === IQ.interviewState.PHASES.REVIEWING) {
      el.micStatusLabel.textContent = t("applyBeforeNext");
    } else if (state.phase === IQ.interviewState.PHASES.READY) {
      el.micStatusLabel.textContent = t("typingAvailable");
    }
    renderPowerUps();
  }

  function startAnswer() {
    if (!state.can("record")) return;
    if (!IQ.speech.hasSTT) { IQ.ui.toast(t("speechUnavailableToast")); return; }
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
      onEnd: (event) => {
        if (!isCurrent(token)) return;
        if (event && event.text) el.answerInput.value = event.text;
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
      not_allowed: t("speechNotAllowed"),
      no_speech: t("speechNoSpeech"),
      audio_capture: t("speechAudioCapture"),
      network: t("speechNetwork"),
      unsupported: t("speechUnsupported"),
      start_failed: t("speechStartFailed"),
    };
    session.pendingFinish = false;
    if (state.phase === IQ.interviewState.PHASES.RECORDING || state.phase === IQ.interviewState.PHASES.STOPPING) state.set(IQ.interviewState.PHASES.READY);
    setInterviewerState("waiting", t("yourTurn"));
    updateControls();
    if (reason !== "aborted") IQ.ui.toast(messages[reason] || t("speechStopped"), "error");
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
    if (!answer) { IQ.ui.toast(t("answerRequired")); return; }
    submitAnswer(answer, {});
  }

  function schedulePrepTimer() {
    session.prepTimer = setInterval(() => {
      session.prepRemaining = Math.max(0, session.prepRemaining - 1);
      updatePrepTimer();
      if (session.prepRemaining === 0) clearPrepTimer({ keepVisible: true });
    }, 1000);
  }

  function restorePrepTimer(remaining) {
    if (!remaining || remaining <= 0) return;
    clearPrepTimer();
    session.prepRemaining = remaining;
    el.prepTimer.hidden = false;
    updatePrepTimer();
    schedulePrepTimer();
  }

  function startPrepTimer() {
    session.prepRemaining = session.demoSpeed ? 8 : 20;
    el.prepTimer.hidden = false;
    updatePrepTimer();
    schedulePrepTimer();
  }
  function updatePrepTimer() {
    const seconds = Math.max(0, session.prepRemaining);
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    el.prepTimer.innerHTML = IQ.ui.icon("clock", "timer-icon") + `<span class="timer-copy">${t("answerTime")}</span><time datetime="PT${seconds}S">${t("prepTimer", { time, seconds })}</time>`;
    el.prepTimer.setAttribute("aria-label", t("answerTimeRemaining", { seconds }));
    el.prepTimer.classList.toggle("is-expired", seconds === 0);
  }
  function extendPrepTimer(seconds) {
    clearPrepTimer({ keepVisible: true });
    session.prepRemaining = Math.max(0, session.prepRemaining) + seconds;
    el.prepTimer.hidden = false;
    updatePrepTimer();
    schedulePrepTimer();
  }
  function clearPrepTimer(options) {
    const opts = options || {};
    if (session && session.prepTimer) clearInterval(session.prepTimer);
    if (session) session.prepTimer = null;
    if (!opts.keepVisible) el.prepTimer.hidden = true;
  }

  function updateCandidateMemory(entry) {
    const memory = session.conversationMemory;
    const analysis = entry.analysis;
    if (!entry.skipped) {
      memory.answeredQuestionIds.push(entry.questionId);
      memory.topics.push(entry.stage);
      memory.technologies = Array.from(new Set(memory.technologies.concat(analysis.technologies || []))).slice(0, 8);
      memory.metrics.answers += 1;
      memory.metrics.words += analysis.wordCount;
      memory.metrics.fillers += analysis.fillerCount;
      Object.keys(memory.metrics.starParts).forEach((part) => { if (analysis.starParts[part]) memory.metrics.starParts[part] += 1; });
      if (!analysis.specificity) memory.missingEvidence.push("specificity");
      if (!analysis.ownership) memory.missingEvidence.push("action");
      if (!analysis.starParts.result) memory.missingEvidence.push("result");
      memory.missingEvidence = Array.from(new Set(memory.missingEvidence)).slice(-4);
    }
  }

  function memorySummary() {
    const memory = session.conversationMemory;
    return {
      coveredStages: Array.from(new Set(memory.topics)).slice(-6),
      technologies: memory.technologies.slice(0, 6),
      gaps: memory.missingEvidence.slice(-3),
      priorFollowUpKinds: memory.followUpKinds.slice(-3),
    };
  }

  function localFollowUpKind(entry, question) {
    const analysis = entry.analysis;
    const tried = session.conversationMemory.followUpKinds;
    const candidates = [];
    if (!analysis.ownership) candidates.push("action");
    if (!analysis.starParts.result) candidates.push("result");
    if (!analysis.specificity || analysis.wordCount < 18) candidates.push("specificity");
    if (question.stage === "impact" && !analysis.metric) candidates.push("metric");
    return candidates.find((kind) => !tried.includes(kind)) || candidates[0] || null;
  }

  async function submitAnswer(rawText, options) {
    const opts = options || {};
    if (!session || session.complete || !state.can(opts.skipped ? "skip" : "submit")) return;
    const token = session.id;
    state.transition(opts.skipped ? "skip" : "submit");
    const snapshot = {
      mainIndex: session.mainIndex, currentQuestion: clone(session.currentQuestion), currentTurnKind: session.currentTurnKind,
      followUpsUsed: session.followUpsUsed, followedMainIds: Array.from(session.followedMainIds), transcriptLength: session.transcript.length,
      xpEarned: session.xpEarned, doubleXPNext: session.activePowerUps.doubleXPNext, conversationMemory: clone(session.conversationMemory),
      hintUsedForCurrent: session.hintUsedForCurrent, prepRemaining: session.prepRemaining,
    };
    clearPrepTimer();
    IQ.speech.abortListening();
    session.pendingFinish = false;
    setInterviewerState("thinking", t("thinking"));
    updateControls();
    const analysis = IQ.feedback.analyzeAnswer(rawText);
    const entry = {
      questionId: session.currentQuestion.id, question: session.currentQuestion.text.en, questionText: clone(session.currentQuestion.text), answer: rawText,
      analysis, awardedXP: 0, skipped: Boolean(opts.skipped), hintUsed: session.hintUsedForCurrent, turnKind: session.currentTurnKind, stage: session.currentQuestion.stage,
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
    updateCandidateMemory(entry);
    if (session.mode === "practice" && !opts.skipped) {
      session.pendingPracticeEntry = entry;
      state.transition("review");
      renderPracticeFeedback(entry);
      setInterviewerState("waiting", t("applyBeforeNext"));
      updateControls();
      return;
    }
    await resolveNextTurn(entry, opts, token);
  }

  function renderPracticeFeedback(entry) {
    const feedback = IQ.feedback.buildImmediateFeedback(entry.analysis, IQ.questions.getRoleFocus(session.roleId));
    const interfaceLocale = IQ.i18n.preferences.interfaceLanguage;
    const translationLocale = currentTranslationLanguage();
    el.practiceFeedbackPanel.hidden = false;
    el.feedbackScore.textContent = t("reportScore", { score: feedback.score });
    // English remains the scored and spoken source; a selected translation is shown separately.
    const sourceStrength = feedback.strength.en;
    const sourceImprovement = feedback.improvement.en;
    const translatedStrength = feedback.strength[translationLocale];
    const translatedImprovement = feedback.improvement[translationLocale];
    el.feedbackStrength.textContent = sourceStrength;
    el.feedbackStrength.dir = "ltr";
    el.feedbackImprovement.textContent = sourceImprovement;
    el.feedbackImprovement.dir = "ltr";
    const showStrengthTranslation = translationLocale !== "en" && translatedStrength && translatedStrength !== sourceStrength;
    const showImprovementTranslation = translationLocale !== "en" && translatedImprovement && translatedImprovement !== sourceImprovement;
    el.feedbackStrengthTranslation.hidden = !showStrengthTranslation;
    el.feedbackStrengthTranslation.textContent = showStrengthTranslation ? `${t("translation")}: ${translatedStrength}` : "";
    el.feedbackStrengthTranslation.dir = IQ.i18n.getLanguage(translationLocale).dir;
    el.feedbackImprovementTranslation.hidden = !showImprovementTranslation;
    el.feedbackImprovementTranslation.textContent = showImprovementTranslation ? `${t("translation")}: ${translatedImprovement}` : "";
    el.feedbackImprovementTranslation.dir = IQ.i18n.getLanguage(translationLocale).dir;
    el.feedbackIndicators.innerHTML = "";
    feedback.indicators.forEach((indicator) => {
      const chip = document.createElement("span");
      chip.className = `feedback-indicator is-${indicator.state}`;
      const value = indicator.id === "detail"
        ? t("feedbackWords", { count: entry.analysis.wordCount })
        : indicator.id === "focus"
          ? IQ.i18n.getText(indicator.value, interfaceLocale)
          : indicator.value;
      chip.textContent = `${IQ.i18n.getText(indicator.label, interfaceLocale)}: ${value}`;
      el.feedbackIndicators.appendChild(chip);
    });
    const translation = feedback.tip[translationLocale];
    const sourceTip = feedback.tip.en;
    el.feedbackTipText.textContent = sourceTip;
    el.feedbackTipText.dir = "ltr";
    const showTranslation = translationLocale !== "en" && translation && translation !== sourceTip;
    el.feedbackTipTranslation.hidden = !showTranslation;
    el.feedbackTipTranslation.textContent = showTranslation ? `${t("translation")}: ${translation}` : "";
    el.feedbackTipTranslation.dir = IQ.i18n.getLanguage(translationLocale).dir;
    requestAnimationFrame(() => {
      const title = document.getElementById("practice-feedback-title");
      title.scrollIntoView({ behavior: "smooth", block: "start" });
      try { title.focus({ preventScroll: true }); }
      catch (error) { title.focus(); }
    });
  }

  async function continueAfterFeedback() {
    if (!session || !state.can("continue") || !session.pendingPracticeEntry) return;
    const entry = session.pendingPracticeEntry;
    session.pendingPracticeEntry = null;
    session.lastSubmission = null;
    state.transition("continue");
    el.practiceFeedbackPanel.hidden = true;
    await resolveNextTurn(entry, {}, session.id);
  }

  function retryPracticeAnswer() {
    if (!session || !state.can("retry") || !session.pendingPracticeEntry || !session.lastSubmission) return;
    const entry = session.pendingPracticeEntry;
    const snapshot = session.lastSubmission;
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
    session.conversationMemory = snapshot.conversationMemory;
    session.hintUsedForCurrent = snapshot.hintUsedForCurrent;
    session.lastSubmission = null;
    session.pendingPracticeEntry = null;
    IQ.speech.stopSpeaking();
    state.transition("retry");
    el.practiceFeedbackPanel.hidden = true;
    renderCurrentTurn({ preserveInput: true });
    el.answerInput.value = entry.answer;
    if (snapshot.hintUsedForCurrent) showHint();
    restorePrepTimer(snapshot.prepRemaining);
    setInterviewerState("waiting", t("yourTurn"));
    updateControls();
    focusCurrentQuestion();
  }

  function hearPracticeFeedback() {
    if (!session || !state.controls().canHearFeedback || !session.pendingPracticeEntry) return;
    const feedback = IQ.feedback.buildImmediateFeedback(session.pendingPracticeEntry.analysis, IQ.questions.getRoleFocus(session.roleId));
    IQ.speech.speak(feedback.tip.en, { gender: session.interviewer.voicePreference, interviewerId: session.interviewer.id, personality: session.personality });
  }

  async function resolveNextTurn(entry, opts, token) {
    try { await decideNextTurn(entry, opts, token); } catch (error) { if (isCurrent(token)) advanceMainQuestion(); }
    if (!isCurrent(token) || session.complete) return;
    const reaction = session.pendingTurn;
    session.pendingTurn = null;
    await presentCurrentQuestion({ reaction, focusQuestion: true });
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
          roleId: session.roleId, stage: question.stage, questionId: question.id, questionEn: question.text.en, answer: entry.answer,
          personality: session.personality, translationLanguage: currentTranslationLanguage(), candidateMemory: memorySummary(),
        }, { signal: activeRequest.signal });
      } catch (error) {
        if (error.name === "AbortError") return;
        session.usingAI = false;
      } finally { activeRequest = null; }
    }
    if (!isCurrent(token)) return;
    if (decision.action === "follow_up") {
      setFollowUpQuestion(question, { en: decision.questionEn, ...decision.questionTranslation }, "ai");
      return;
    }
    const localKind = localFollowUpKind(entry, question);
    if (localKind) {
      const local = IQ.questions.getFollowUp(question, localKind);
      setFollowUpQuestion(question, local.text, localKind);
      return;
    }
    advanceMainQuestion();
  }

  function setFollowUpQuestion(parentQuestion, text, kind) {
    session.followedMainIds.add(parentQuestion.id);
    session.followUpsUsed += 1;
    session.conversationMemory.followUpKinds.push(kind || "specificity");
    session.currentTurnKind = "follow_up";
    session.pendingTurn = IQ.questions.getReaction(session.personality, "followUp");
    session.currentQuestion = {
      id: `${parentQuestion.id}-follow-up-${session.followUpsUsed}`, parentId: parentQuestion.id, roleId: parentQuestion.roleId, stage: parentQuestion.stage,
      text: { ...text }, hint: parentQuestion.hint, isFollowUp: true, followUpKind: kind, followUpEligible: false, isClosing: false,
    };
  }

  function advanceMainQuestion() {
    session.mainIndex += 1;
    session.currentTurnKind = "main";
    if (session.mainIndex >= session.plan.length) { finishInterview({ partial: false }); return; }
    session.currentQuestion = session.plan[session.mainIndex];
    session.pendingTurn = IQ.questions.getReaction(session.personality, "transition");
  }

  function renderPowerUps() {
    if (!session || session.complete || !el.powerupBar) return;
    IQ.ui.renderPowerUps(gameState, usePowerUp, { disabled: state.phase !== IQ.interviewState.PHASES.READY });
  }

  async function usePowerUp(key) {
    if (!session || session.complete || state.controls().isBusy) return;
    if (key === "replay") {
      if (session.mode === "real") { IQ.ui.toast(t("replayUnavailableReal")); return; }
      await presentCurrentQuestion({ preserveInput: true }); return;
    }
    if (session.mode === "real" && ["hint", "secondChance"].includes(key)) { IQ.ui.toast(t("learningAidPracticeOnly")); return; }
    if (key === "secondChance" && (!session.lastSubmission || !session.transcript.length)) {
      IQ.ui.toast(t("nothingToRedo"));
      return;
    }
    if (!IQ.game.consumePowerUp(gameState, key)) { IQ.ui.toast(t("noPowerUpsLeft")); return; }
    if (key === "thinkTime") { extendPrepTimer(30); IQ.ui.toast(t("extraThinkTime"), "success"); }
    if (key === "doubleXP") { session.activePowerUps.doubleXPNext = true; IQ.ui.toast(t("doubleXpActive"), "success"); }
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
    session.conversationMemory = snapshot.conversationMemory || session.conversationMemory;
    session.lastSubmission = null;
    state.set(IQ.interviewState.PHASES.READY);
    renderCurrentTurn();
    el.questionText.textContent += ` ${t("retryQuestionSuffix")}`;
    setInterviewerState("waiting", t("yourTurn"));
    updateControls();
    showHint();
  }

  function showEndDialog() {
    if (!session || !state.controls().canEnd) return;
    if (typeof el.endInterviewDialog.showModal === "function") {
      el.endInterviewDialog.showModal();
      requestAnimationFrame(() => el.btnCancelEnd.focus());
    } else if (window.confirm(`${t("endDialogTitle")}\n\n${t("endDialogDescription")}`)) {
      endInterviewEarly();
    }
  }

  function restoreEndInterviewFocus() {
    requestAnimationFrame(() => {
      if (!session || session.complete) return;
      try { el.btnEndInterview.focus({ preventScroll: true }); }
      catch (error) { el.btnEndInterview.focus(); }
    });
  }

  function endInterviewEarly() {
    endDialogConfirmed = true;
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
    setInterviewerState("thinking", t("preparingReport"));
    updateControls();
    if (!opts.skipClosingSpeech) {
      const closing = "Thank you for practicing with me today. Your training report is ready.";
      el.questionText.textContent = closing;
      await IQ.speech.speak(closing, { gender: session.interviewer.voicePreference, interviewerId: session.interviewer.id, personality: session.personality });
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
        if (error.name !== "AbortError") IQ.ui.toast(t("aiCoachingUnavailable"));
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
    const meta = { xpGained: session.xpEarned, leveledUp: result.leveledUp, newLevel: result.newLevel, newAchievements: result.newAchievements, isExample: false, candidateName: session.candidateName, transcript: session.transcript, roleLabel: session.roleLabel, difficulty: session.difficultyId, mode: session.mode, usingAI: session.usingAI, isPartial };
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
      item.dir = "ltr";
      if (showTranslation && translationValues && translationValues[index] && translationValues[index] !== value) item.appendChild(translationNode(translationValues[index]));
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
    const roleLabel = meta.isExample ? meta.roleLabel : roleLabelFor(session ? session.roleId : choices.role);
    const candidateName = meta.isExample ? "" : (meta.candidateName || "");
    el.reportCandidateName.hidden = !candidateName;
    el.reportCandidateName.textContent = candidateName ? t("trainingReportFor", { name: candidateName }) : "";
    const difficulty = labelForDifficulty(meta.difficulty);
    el.reportModeNote.textContent = t("reportModeNote", { role: roleLabel, difficulty, mode: meta.mode === "real" ? t("realMode") : t("practiceMode"), status: meta.isPartial ? t("partialReport") : t("completed") });
    el.reportExampleBanner.hidden = !meta.isExample;
    const score = Math.max(0, Math.min(100, Math.round(report.overallScore || 0)));
    el.reportScoreRing.style.setProperty("--pct", score);
    el.reportScoreRing.style.setProperty("--score-color", scoreColor(score));
    el.reportScoreValue.textContent = score;
    el.reportXpGained.textContent = t("xpGained", { xp: meta.xpGained });
    el.reportStrongestSkill.textContent = report.strongestSkill || (report.strengths || [""])[0];
    el.reportStrongestSkill.dir = "ltr";
    el.reportBiggestImprovement.textContent = report.biggestImprovement || (report.weaknesses || [""])[0];
    el.reportBiggestImprovement.dir = "ltr";
    el.reportSummary.innerHTML = "";
    const summary = document.createElement("p"); summary.textContent = report.summary || ""; summary.dir = "ltr"; el.reportSummary.appendChild(summary);
    if (showTranslation && translation.summary && translation.summary !== summary.textContent) el.reportSummary.appendChild(translationNode(translation.summary));
    if (meta.leveledUp) { el.reportLevelBanner.hidden = false; el.reportLevelBanner.textContent = t("levelUp", { level: meta.newLevel }); } else el.reportLevelBanner.hidden = true;
    el.reportAchievements.hidden = !(meta.newAchievements && meta.newAchievements.length);
    el.reportAchievements.innerHTML = "";
    (meta.newAchievements || []).forEach((achievement) => { const chip = document.createElement("span"); chip.className = "achievement-chip"; chip.title = IQ.game.getAchievementDescription(achievement); chip.innerHTML = IQ.ui.icon("star"); const label = document.createElement("span"); label.textContent = IQ.game.getAchievementName(achievement); chip.appendChild(label); el.reportAchievements.appendChild(chip); });
    createList(el.reportStrengths, report.strengths, translation.strengths, showTranslation);
    createList(el.reportWeaknesses, report.weaknesses, translation.weaknesses, showTranslation);
    renderReportMetrics(report.metrics || [], locale, showTranslation);
    el.reportEnglishFeedback.innerHTML = "";
    const feedback = document.createElement("span"); feedback.textContent = report.englishFeedback || ""; feedback.dir = "ltr"; el.reportEnglishFeedback.appendChild(feedback);
    if (showTranslation && translation.englishFeedback && translation.englishFeedback !== feedback.textContent) el.reportEnglishFeedback.appendChild(translationNode(translation.englishFeedback));
    renderPerQuestion(report, meta, locale, showTranslation);
    createList(el.reportNextSteps, report.nextSteps, translation.nextSteps, showTranslation);
  }

  function renderReportMetrics(metrics, locale, showTranslation) {
    el.reportMetrics.innerHTML = "";
    metrics.forEach((item) => {
      const card = document.createElement("article");
      card.className = "report-metric";
      const heading = document.createElement("div"); heading.className = "metric-heading";
      const title = document.createElement("h3"); title.textContent = IQ.i18n.getText(item.label, IQ.i18n.preferences.interfaceLanguage) || item.id;
      const score = document.createElement("span"); score.className = "metric-score"; score.textContent = t("reportScore", { score: item.score });
      heading.append(title, score); card.appendChild(heading);
      const track = document.createElement("div"); track.className = "metric-track"; track.setAttribute("role", "progressbar"); track.setAttribute("aria-label", title.textContent); track.setAttribute("aria-valuemin", "0"); track.setAttribute("aria-valuemax", "100"); track.setAttribute("aria-valuenow", String(item.score));
      const fill = document.createElement("div"); fill.className = "metric-fill"; fill.style.width = `${item.score}%`; track.appendChild(fill); card.appendChild(track);
      const description = document.createElement("p"); description.textContent = IQ.i18n.getText(item.description, IQ.i18n.preferences.interfaceLanguage); card.appendChild(description);
      if (showTranslation && item.label && item.label[locale] && locale !== IQ.i18n.preferences.interfaceLanguage) {
        const translated = document.createElement("div"); translated.className = "translation-block report-translation"; translated.dir = IQ.i18n.getLanguage(locale).dir;
        translated.textContent = `${item.label[locale]} — ${(item.description || {})[locale] || ""}`; card.appendChild(translated);
      }
      el.reportMetrics.appendChild(card);
    });
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
        const answer = document.createElement("blockquote"); answer.className = "pq-answer"; answer.textContent = transcript.answer || `— ${t("skipped")} —`; answer.dir = "auto"; card.appendChild(answer);
      }
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "card-translation-toggle btn btn-text"; toggle.setAttribute("aria-expanded", String(globalTranslation)); toggle.textContent = globalTranslation ? t("hideTranslation") : t("showTranslation"); card.appendChild(toggle);
      const translationArea = document.createElement("div"); translationArea.className = "card-translation-area"; translationArea.hidden = !globalTranslation;
      const content = () => {
        card.querySelectorAll(".card-coaching").forEach((node) => node.remove());
        const coaching = document.createElement("div"); coaching.className = "card-coaching";
        const tipLabel = document.createElement("div"); tipLabel.className = "pq-label"; tipLabel.textContent = t("coachTip"); coaching.appendChild(tipLabel);
        const tip = document.createElement("p"); tip.className = "pq-tip"; tip.textContent = item.tip || ""; coaching.appendChild(tip);
        const exampleLabel = document.createElement("div"); exampleLabel.className = "pq-label"; exampleLabel.textContent = t("strongerExample"); coaching.appendChild(exampleLabel);
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
    reportModel = null;
    el.candidateName.value = "";
    setCandidateNameError("");
    el.sessionCandidate.hidden = true;
    el.sessionCandidate.textContent = "";
    state.set(IQ.interviewState.PHASES.SETUP);
    renderPlayerSummary();
    IQ.ui.showView("view-setup");
  }
})();

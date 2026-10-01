/* ===========================================================
   Interview Quest — interview lifecycle state machine
   Keeps voice, AI, and UI actions in a safe, explicit order.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const PHASES = Object.freeze({
    SETUP: "setup",
    PRESENTING: "presenting",
    READY: "ready",
    RECORDING: "recording",
    STOPPING: "stopping",
    SUBMITTING: "submitting",
    REVIEWING: "reviewing",
    CLOSING: "closing",
    REPORT: "report",
  });

  const TRANSITIONS = Object.freeze({
    [PHASES.SETUP]: { start: PHASES.PRESENTING, preview: PHASES.REPORT },
    [PHASES.PRESENTING]: { spoken: PHASES.READY, cancel: PHASES.CLOSING, fail: PHASES.READY },
    [PHASES.READY]: {
      record: PHASES.RECORDING,
      submit: PHASES.SUBMITTING,
      skip: PHASES.SUBMITTING,
      repeat: PHASES.PRESENTING,
      end: PHASES.CLOSING,
    },
    [PHASES.RECORDING]: {
      stop: PHASES.STOPPING,
      finish: PHASES.STOPPING,
      repeat: PHASES.PRESENTING,
      end: PHASES.CLOSING,
      fail: PHASES.READY,
    },
    [PHASES.STOPPING]: { stopped: PHASES.READY, submit: PHASES.SUBMITTING, fail: PHASES.READY, end: PHASES.CLOSING },
    [PHASES.SUBMITTING]: { review: PHASES.REVIEWING, next: PHASES.PRESENTING, fail: PHASES.PRESENTING, end: PHASES.CLOSING },
    [PHASES.REVIEWING]: { continue: PHASES.PRESENTING, retry: PHASES.READY, repeat: PHASES.REVIEWING, end: PHASES.CLOSING },
    [PHASES.CLOSING]: { report: PHASES.REPORT, cancel: PHASES.READY },
    [PHASES.REPORT]: { restart: PHASES.SETUP },
  });

  function can(phase, action) {
    return Boolean(TRANSITIONS[phase] && TRANSITIONS[phase][action]);
  }

  function transition(phase, action) {
    return can(phase, action) ? TRANSITIONS[phase][action] : phase;
  }

  function controlsFor(phase) {
    return {
      canStartAnswer: phase === PHASES.READY,
      canStopAnswer: phase === PHASES.RECORDING,
      canFinishAnswer: phase === PHASES.READY || phase === PHASES.RECORDING || phase === PHASES.STOPPING,
      canSkip: phase === PHASES.READY,
      canRepeat: phase === PHASES.READY || phase === PHASES.RECORDING,
      canContinue: phase === PHASES.REVIEWING,
      canRetry: phase === PHASES.REVIEWING,
      canHearFeedback: phase === PHASES.REVIEWING,
      canEnd: phase !== PHASES.SETUP && phase !== PHASES.REPORT && phase !== PHASES.CLOSING,
      isBusy: phase === PHASES.PRESENTING || phase === PHASES.STOPPING || phase === PHASES.SUBMITTING || phase === PHASES.CLOSING,
    };
  }

  function create(initialPhase) {
    let phase = initialPhase || PHASES.SETUP;
    return {
      get phase() {
        return phase;
      },
      can(action) {
        return can(phase, action);
      },
      transition(action) {
        const next = transition(phase, action);
        const changed = next !== phase;
        phase = next;
        return { phase, changed };
      },
      set(nextPhase) {
        if (!Object.values(PHASES).includes(nextPhase)) return false;
        phase = nextPhase;
        return true;
      },
      controls() {
        return controlsFor(phase);
      },
    };
  }

  IQ.interviewState = { PHASES, TRANSITIONS, can, transition, controlsFor, create };
})();

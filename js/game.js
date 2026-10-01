/* ===========================================================
   Interview Quest — game layer
   XP, levels, streaks, achievements and power-up inventory.
   Everything the user types/says stays in the browser — only
   this progress summary is persisted, in localStorage.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const STORAGE_KEY = "interviewQuestSave";
  const XP_PER_LEVEL = 150;

  const DEFAULT_STATE = {
    xp: 0,
    streak: 0,
    lastPracticeDate: null,
    powerUps: { thinkTime: 1, secondChance: 1, hint: 1, doubleXP: 1 },
    achievements: [],
    interviewsCompleted: 0,
    realModeCompleted: 0,
    aiModeUsed: false,
  };

  const ACHIEVEMENTS = [
    { id: "first_steps", name: "First Steps", desc: "Complete your first interview.", check: (s) => s.interviewsCompleted >= 1 },
    { id: "clean_speaker", name: "Clean Speaker", desc: "Finish an interview with zero filler words.", check: (s, last) => last && last.totalFillers === 0 },
    { id: "star_student", name: "STAR Student", desc: "Use the STAR structure well in 3+ answers in one interview.", check: (s, last) => last && last.starAnswers >= 3 },
    { id: "level_5", name: "Rising Star", desc: "Reach level 5.", check: (s) => levelForXP(s.xp) >= 5 },
    { id: "on_a_roll", name: "On a Roll", desc: "Reach a 3-day practice streak.", check: (s) => s.streak >= 3 },
    { id: "dedicated", name: "Dedicated", desc: "Reach a 7-day practice streak.", check: (s) => s.streak >= 7 },
    { id: "real_deal", name: "The Real Deal", desc: "Complete a Real Interview Mode session.", check: (s) => s.realModeCompleted >= 1 },
    { id: "ai_conversationalist", name: "AI Conversationalist", desc: "Complete an interview with the live AI interviewer.", check: (s) => s.aiModeUsed === true },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredCloneLite(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredCloneLite(DEFAULT_STATE), parsed, {
        powerUps: Object.assign({}, DEFAULT_STATE.powerUps, parsed.powerUps || {}),
      });
    } catch (e) {
      return structuredCloneLite(DEFAULT_STATE);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage unavailable — game still works, just won't persist */
    }
  }

  function structuredCloneLite(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function levelForXP(xp) {
    return 1 + Math.floor(xp / XP_PER_LEVEL);
  }

  function xpProgress(xp) {
    const level = levelForXP(xp);
    const into = xp % XP_PER_LEVEL;
    return { level, into, needed: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
  }

  function answerXP(analysis, doubleXP) {
    let xp = 10;
    if (analysis.wordCount >= 40) xp += 10;
    if (analysis.fillerCount === 0) xp += 10;
    if (analysis.starHits >= 3) xp += 15;
    if (doubleXP) xp *= 2;
    return xp;
  }

  function todayStr() {
    return new Date().toDateString();
  }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  }

  function updateStreak(state) {
    const today = todayStr();
    if (state.lastPracticeDate === today) {
      // already counted today, no change
    } else if (state.lastPracticeDate === yesterdayStr()) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    state.lastPracticeDate = today;
  }

  const POWERUP_KEYS = ["thinkTime", "secondChance", "hint", "doubleXP"];

  function consumePowerUp(state, key) {
    if ((state.powerUps[key] || 0) <= 0) return false;
    state.powerUps[key] -= 1;
    save(state);
    return true;
  }

  /**
   * Call once when an interview finishes.
   * summary: { mode, usingAI, difficulty, totalFillers, starAnswers, completionXP }
   * Returns { leveledUp, newAchievements: [...] }
   */
  function completeInterview(state, summary) {
    const beforeLevel = levelForXP(state.xp);

    state.xp += summary.completionXP || 0;
    state.interviewsCompleted += 1;
    if (summary.mode === "real") state.realModeCompleted += 1;
    if (summary.usingAI) state.aiModeUsed = true;
    updateStreak(state);

    // Reward one random power-up charge for finishing a session.
    const pick = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
    state.powerUps[pick] = (state.powerUps[pick] || 0) + 1;

    const afterLevel = levelForXP(state.xp);
    const newAchievements = [];
    ACHIEVEMENTS.forEach((a) => {
      if (!state.achievements.includes(a.id) && a.check(state, summary)) {
        state.achievements.push(a.id);
        newAchievements.push(a);
      }
    });

    save(state);
    return { leveledUp: afterLevel > beforeLevel, newLevel: afterLevel, newAchievements, rewardedPowerUp: pick };
  }

  IQ.game = {
    load,
    save,
    levelForXP,
    xpProgress,
    answerXP,
    consumePowerUp,
    completeInterview,
    ACHIEVEMENTS,
    XP_PER_LEVEL,
  };
})();

/* ===========================================================
   Interview Quest — browser-local visual theme preference.
   This preference is separate from language and game progress.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const STORAGE_KEY = "interviewQuestTheme";
  const DEFAULT_THEME = "light";
  const THEMES = ["light", "dark"];

  function safeTheme(value) {
    return THEMES.includes(value) ? value : DEFAULT_THEME;
  }

  function load() {
    try {
      return safeTheme(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  let currentTheme = load();

  function apply(theme) {
    currentTheme = safeTheme(theme);
    document.documentElement.dataset.theme = currentTheme;
    return currentTheme;
  }

  function save(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      /* The visual preference remains active for this page. */
    }
  }

  function set(theme) {
    const nextTheme = apply(theme);
    save(nextTheme);
    return nextTheme;
  }

  function toggle() {
    return set(currentTheme === "dark" ? "light" : "dark");
  }

  apply(currentTheme);

  IQ.theme = {
    get value() { return currentTheme; },
    set,
    toggle,
  };
})();

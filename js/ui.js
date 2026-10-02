/* ===========================================================
   Interview Quest — small UI helpers
   Hand-rolled stroke SVG icons (no emoji, no external icon
   library/download), toasts, view switching, HUD + power-up
   rendering. app.js owns the interview/report-specific markup.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const ICON_PATHS = {
    mic: '<path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/><path d="M9 21h6"/>',
    flame: '<path d="M12 2c1 3-3 4-3 8a4 4 0 0 0 8 0c0-2-1-3-1-3s1 2-1 3c-1 .6-2 .2-2-1 0 0-2 2-2 4a3 3 0 0 0 6 0c0-6-4-7-5-11Z"/>',
    star: '<polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.5 5.5 21 7.5 13.5 2 9 9 9"/>',
    bolt: '<polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    retry: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2Z"/>',
    replay: '<path d="M1 4v6h6"/><path d="M3.5 15a9 9 0 1 0 2-9.8L1 10"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/>',
  };

  function icon(name, cls) {
    const inner = ICON_PATHS[name] || "";
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="' +
      (cls || "") +
      '">' +
      inner +
      "</svg>"
    );
  }

  function showView(viewId, focusTarget) {
    document.querySelectorAll(".view").forEach((v) => {
      v.hidden = v.id !== viewId;
    });
    const target = document.getElementById(viewId);
    if (target) {
      try {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      } catch (error) {
        target.scrollIntoView(true);
      }
    }
    window.scrollTo(0, 0);
    const destination = typeof focusTarget === "string"
      ? document.querySelector(focusTarget)
      : focusTarget || (target && target.querySelector("[data-view-focus]"));
    if (!destination) return;
    requestAnimationFrame(() => {
      try {
        destination.focus({ preventScroll: true });
      } catch (error) {
        destination.focus();
      }
    });
  }

  function toast(message, type) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast-" + type : "");
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function renderHUD(state) {
    const hud = document.getElementById("hud");
    if (!hud) return;
    hud.hidden = false;
    const progress = IQ.game.xpProgress(state.xp);
    document.getElementById("hud-level").textContent = IQ.i18n.t("levelValue", { level: progress.level });
    document.getElementById("hud-xp-fill").style.width = progress.pct + "%";
    document.getElementById("hud-xp-text").textContent = IQ.i18n.t("xpValue", { current: progress.into, needed: progress.needed });
    document.getElementById("hud-streak").textContent = IQ.i18n.t("streakValue", { count: state.streak });
    document.getElementById("hud-level-icon").innerHTML = icon("star");
    document.getElementById("hud-streak-icon").innerHTML = icon("flame");
  }

  const POWERUP_DEF = [
    { key: "thinkTime", labelKey: "powerUpThinkTime", benefitKey: "powerUpExtraTimeBenefit", iconName: "clock", id: "pu-thinktime" },
    { key: "secondChance", labelKey: "powerUpSecondChance", iconName: "retry", id: "pu-secondchance" },
    { key: "hint", labelKey: "powerUpHint", iconName: "bulb", id: "pu-hint" },
    { key: "doubleXP", labelKey: "powerUpDoubleXp", iconName: "bolt", id: "pu-doublexp" },
  ];

  function renderPowerUps(state, onUse, options) {
    const opts = options || {};
    const bar = document.getElementById("powerup-bar");
    if (!bar) return;
    bar.innerHTML = "";

    POWERUP_DEF.forEach((def) => {
      const count = state.powerUps[def.key] || 0;
      const label = IQ.i18n.t(def.labelKey);
      const benefit = def.benefitKey ? IQ.i18n.t(def.benefitKey) : "";
      const accessibleLabel = [label, benefit].filter(Boolean).join(" — ");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "powerup-btn" + (def.key === "thinkTime" ? " powerup-extra-time" : "");
      btn.id = def.id;
      const disabled = count <= 0 || Boolean(opts.disabled);
      btn.disabled = disabled;
      btn.title = count <= 0
        ? IQ.i18n.t("powerUpEarnMore")
        : IQ.i18n.t("powerUpAvailable", { label: accessibleLabel, count });
      btn.setAttribute("aria-label", disabled
        ? IQ.i18n.t("powerUpUnavailable", { label: accessibleLabel, count })
        : IQ.i18n.t("powerUpAvailable", { label: accessibleLabel, count }));
      btn.innerHTML = icon(def.iconName) + "<span class=\"powerup-label\">" + label + (benefit ? "<small>" + benefit + "</small>" : "") + "</span><span class=\"powerup-count\" aria-hidden=\"true\">" + count + "</span>";
      btn.addEventListener("click", () => {
        if (disabled) {
          if (count <= 0) toast(IQ.i18n.t("powerUpEarnMoreLabel", { label }));
          return;
        }
        onUse(def.key);
      });
      bar.appendChild(btn);
    });

    const replayLabel = IQ.i18n.t("replayQuestion");
    const replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "powerup-btn";
    replayBtn.id = "pu-replay";
    replayBtn.disabled = Boolean(opts.disabled);
    replayBtn.title = replayLabel;
    replayBtn.setAttribute("aria-label", replayBtn.disabled
      ? IQ.i18n.t("powerUpUnavailable", { label: replayLabel, count: 0 })
      : replayLabel);
    replayBtn.innerHTML = icon("replay") + "<span>" + replayLabel + "</span>";
    replayBtn.addEventListener("click", () => { if (!replayBtn.disabled) onUse("replay"); });
    bar.appendChild(replayBtn);
  }

  IQ.ui = { icon, showView, toast, renderHUD, renderPowerUps, POWERUP_DEF };
})();

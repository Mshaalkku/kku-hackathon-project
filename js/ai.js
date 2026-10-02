/* ===========================================================
   Ready2Interview — narrow client for the local-only AI proxy
   The browser sends bounded data only. API keys and prompts remain
   inside server/server.py and are never sent to the client.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  async function request(path, payload, options) {
    const opts = options || {};
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts.signal,
    });
    if (!response.ok) throw new Error("network_error");
    const data = await response.json();
    if (!data || !data.ok) throw new Error((data && data.error) || "ai_error");
    return data;
  }

  async function checkStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) return false;
      const data = await response.json();
      return Boolean(data.aiAvailable);
    } catch (error) {
      return false;
    }
  }

  function validFollowUp(data) {
    if (!data || (data.action !== "follow_up" && data.action !== "advance")) return null;
    if (data.action === "advance") return { action: "advance" };
    const questionEn = String(data.questionEn || "").trim();
    if (!questionEn || questionEn.length > 360) return null;
    const questionTranslation = data.questionTranslation && typeof data.questionTranslation === "object" ? data.questionTranslation : {};
    return { action: "follow_up", questionEn, questionTranslation };
  }

  async function requestFollowUp(payload, options) {
    const data = await request("/api/follow-up", payload, options);
    const validated = validFollowUp(data);
    if (!validated) throw new Error("malformed_response");
    return validated;
  }

  function normalizeReport(data, validQuestionIds) {
    if (!data || !data.report || typeof data.report !== "object") return null;
    const report = data.report;
    const allowed = new Set(validQuestionIds || []);
    const perQuestion = Array.isArray(report.perQuestion) ? report.perQuestion.filter((item) => item && allowed.has(item.questionId)) : [];
    return {
      summary: typeof report.summary === "string" ? report.summary.slice(0, 500) : "",
      strengths: Array.isArray(report.strengths) ? report.strengths.filter((item) => typeof item === "string").slice(0, 4) : [],
      weaknesses: Array.isArray(report.weaknesses) ? report.weaknesses.filter((item) => typeof item === "string").slice(0, 4) : [],
      englishFeedback: typeof report.englishFeedback === "string" ? report.englishFeedback.slice(0, 700) : "",
      nextSteps: Array.isArray(report.nextSteps) ? report.nextSteps.filter((item) => typeof item === "string").slice(0, 4) : [],
      translations: data.translations && typeof data.translations === "object" ? data.translations : {},
      perQuestion: perQuestion.map((item) => ({
        questionId: item.questionId,
        tip: typeof item.tip === "string" ? item.tip.slice(0, 400) : "",
        improvedExample: typeof item.improvedExample === "string" ? item.improvedExample.slice(0, 700) : "",
        translation: item.translation && typeof item.translation === "object" ? item.translation : {},
      })),
    };
  }

  async function requestReport(payload, options) {
    const data = await request("/api/report", payload, options);
    const report = normalizeReport(data, payload.entries.map((entry) => entry.questionId));
    if (!report) throw new Error("malformed_response");
    return report;
  }

  IQ.ai = { checkStatus, requestFollowUp, requestReport };
})();

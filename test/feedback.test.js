const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadFeedback() {
  const context = { window: { IQ: {} } };
  context.IQ = context.window.IQ;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "feedback.js"), "utf8"), context);
  return context.IQ.feedback;
}

const roleFocus = {
  en: "software design, testing, and delivery",
  ar: "تصميم البرمجيات والاختبار والتسليم",
  es: "diseño, pruebas y entrega de software",
  fr: "conception, tests et livraison de logiciels",
  de: "Softwaredesign, Tests und Lieferung",
  hi: "सॉफ्टवेयर डिज़ाइन, टेस्टिंग और डिलीवरी",
};
const context = {
  question: "To begin, could you introduce yourself and explain what interests you about Software Engineering?",
  stage: "introduction",
  roleId: "software-engineering",
  roleFocus,
};

test("caps an off-question answer and names the missing question target", () => {
  const feedback = loadFeedback();
  const analysis = feedback.analyzeAnswer("I like music and worked hard at school with my team.", context);
  const immediate = feedback.buildImmediateFeedback(analysis, context);
  assert.ok(analysis.score <= 34);
  assert.match(immediate.improvement.en, /why this role interests you/i);
});

test("uses actual answer evidence and real locale coaching", () => {
  const feedback = loadFeedback();
  const answer = "I am interested in software engineering because I enjoy solving user problems. In a Python project, I built and tested a booking feature for students, and we reduced support tickets by 20 percent.";
  const analysis = feedback.analyzeAnswer(answer, context);
  const immediate = feedback.buildImmediateFeedback(analysis, context);
  assert.ok(analysis.score >= 60);
  assert.match(immediate.strength.en, /software design, testing, and delivery|personal action|outcome/i);
  assert.match(immediate.strongerExample.en, /Python/i);
  assert.notEqual(immediate.improvement.ar, immediate.improvement.en);
  assert.notEqual(immediate.howTo.es, immediate.howTo.en);
  assert.match(immediate.why.ar, /السؤال/);
});

test("keeps blank answers at zero and supplies translated report coaching", () => {
  const feedback = loadFeedback();
  const blank = feedback.analyzeAnswer("", context);
  assert.equal(blank.score, 0);
  const report = feedback.buildReport([{ questionId: "one", question: context.question, stage: context.stage, answer: "I am interested in software engineering because I enjoy solving user problems.", analysis: feedback.analyzeAnswer("I am interested in software engineering because I enjoy solving user problems.", context) }], { plannedQuestions: 1, roleId: context.roleId, roleFocus });
  assert.notEqual(report.perQuestion[0].translation.ar.tip, report.perQuestion[0].tip);
  assert.ok(report.translations.ar.strengths[0]);
});

test("renders the immediate stronger-answer targets in the page", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /id="feedback-stronger-example"/);
  assert.match(html, /id="feedback-stronger-example-translation"/);
});

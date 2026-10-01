/* ===========================================================
   Interview Quest — local feedback and report fallback
   Deterministic English-focused coaching; original answers stay intact.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const FILLER_WORDS = ["um", "uh", "erm", "like", "you know", "sort of", "kind of", "basically", "actually", "i mean", "literally"];
  const STAR_PATTERNS = {
    situation: /\b(when i|there was a time|in my (previous|last|current)|at my (previous|last|current)?\s*(job|role|company)|one time|back when)\b/i,
    task: /\b(i (needed|had) to|my (task|job|responsibility) was|i was responsible for|the goal was)\b/i,
    action: /\b(i (decided|implemented|created|organized|built|led|managed|contacted|developed|designed|solved|resolved|proposed|handled|tested|analyzed|improved))\b/i,
    result: /\b(as a result|the result was|we (achieved|increased|reduced|improved)|i (learned|ended up)|%|percent|\d+)\b/i,
  };
  const OWNERSHIP = /\b(i (led|built|created|designed|implemented|decided|organized|analyzed|resolved|tested|improved|communicated|coordinated|supported|recommended)|my (responsibility|contribution|role))\b/i;
  const SPECIFICITY = /\b(project|team|user|customer|client|stakeholder|dashboard|prototype|system|application|campaign|report|process|feature|model|incident|ticket|workshop)\b/i;
  const TECHNOLOGY = /\b(javascript|python|java|sql|excel|figma|tableau|power bi|aws|azure|react|html|css|api|database|machine learning|analytics|prototype)\b/ig;
  const COPY = {
    en: { detail: "You gave a useful amount of detail.", clean: "Your delivery was clean, with no filler words detected.", star: "You used a clear Situation–Task–Action–Result structure.", consistent: "Your answers were consistently strong.", completed: "You completed a valuable practice session.", fillers: "Reduce filler words such as ‘um’ and ‘like’; a short pause can sound more confident.", short: "Add one specific example and a little more detail.", starPractice: "Use STAR: Situation, Task, Action, Result.", fuller: "Make the answer more complete and specific.", numbers: "Add a concrete outcome or measure when you can.", noAnswer: "No answer was given. Even a few sentences create useful practice.", fillerTip: "Replace filler words with a short silent pause.", detailTip: "Add a short, specific example to make this answer stronger.", resultTip: "Add a concrete result or outcome at the end.", actionTip: "Make your personal action explicit, not only the situation.", strongTip: "Solid, well-structured answer with useful detail.", summary: "You completed {answered} of {planned} planned questions. Your next gains will come from clearer examples and concrete outcomes.", stepStar: "Practice the STAR structure out loud with three go-to stories.", stepRecord: "Record one answer and replace filler words with pauses.", stepStories: "Prepare two or three specific stories so you can answer with confidence.", stronger: "Situation: Briefly set the scene.\nTask: Explain your responsibility.\nAction: Say exactly what you did.\nResult: End with a clear outcome or number.\n\nAim for about 45–90 seconds when speaking.", clarity: "Clear detail", structure: "Answer structure", ownership: "Personal ownership", impact: "Impact & outcomes", delivery: "Communication delivery", roleEvidence: "Role evidence", good: "Strong evidence in your responses.", developing: "A useful area to develop in your next answer." },
    ar: { detail: "قدمت قدراً مفيداً من التفاصيل.", clean: "كان أسلوبك واضحاً ولم تُكتشف كلمات حشو.", star: "استخدمت بنية واضحة: الموقف والمهمة والإجراء والنتيجة.", consistent: "كانت إجاباتك قوية باستمرار.", completed: "أكملت جلسة تدريب قيمة.", fillers: "خفف كلمات الحشو مثل «um» و«like»؛ فالوقفة القصيرة قد تبدو أكثر ثقة.", short: "أضف مثالاً محدداً ومزيداً قليلاً من التفاصيل.", starPractice: "استخدم STAR: الموقف، المهمة، الإجراء، النتيجة.", fuller: "اجعل الإجابة أكثر اكتمالاً وتحديداً.", numbers: "أضف نتيجة أو قياساً ملموساً عندما تستطيع.", noAnswer: "لم تُقدَّم إجابة. حتى بضع جمل تمنحك تدريباً مفيداً.", fillerTip: "استبدل كلمات الحشو بوقفة صامتة قصيرة.", detailTip: "أضف مثالاً قصيراً ومحدداً لتقوية إجابتك.", resultTip: "أضف نتيجة أو أثراً ملموساً في النهاية.", actionTip: "وضح الإجراء الذي اتخذته أنت شخصياً، وليس الموقف فقط.", strongTip: "إجابة قوية ومنظمة تتضمن تفاصيل مفيدة.", summary: "أكملت {answered} من أصل {planned} أسئلة مخططة. ستأتي مكاسبك التالية من أمثلة أوضح ونتائج ملموسة.", stepStar: "تدرّب بصوت عالٍ على بنية STAR مع ثلاث قصص جاهزة.", stepRecord: "سجل إجابة واحدة واستبدل كلمات الحشو بوقفات.", stepStories: "حضّر قصتين أو ثلاث قصص محددة لتجيب بثقة.", stronger: "الموقف: اشرح السياق بإيجاز.\nالمهمة: وضح مسؤوليتك.\nالإجراء: قل بالضبط ما فعلته.\nالنتيجة: اختم بأثر واضح أو رقم.\n\nاستهدف نحو 45–90 ثانية عند التحدث.", clarity: "تفاصيل واضحة", structure: "بنية الإجابة", ownership: "المسؤولية الشخصية", impact: "الأثر والنتائج", delivery: "أسلوب التواصل", roleEvidence: "دليل المهارة الوظيفية", good: "دليل قوي في إجاباتك.", developing: "مجال مفيد لتطويره في إجابتك التالية." },
    es: { detail: "Diste una cantidad útil de detalle.", clean: "Tu expresión fue limpia, sin palabras de relleno detectadas.", star: "Usaste una estructura clara de Situación–Tarea–Acción–Resultado.", consistent: "Tus respuestas fueron consistentemente sólidas.", completed: "Completaste una sesión de práctica valiosa.", fillers: "Reduce muletillas como ‘um’ y ‘like’; una pausa breve puede sonar más segura.", short: "Añade un ejemplo específico y algo más de detalle.", starPractice: "Usa STAR: Situación, Tarea, Acción, Resultado.", fuller: "Haz la respuesta más completa y específica.", numbers: "Añade un resultado o medida concreta cuando puedas.", noAnswer: "No se dio una respuesta. Incluso unas frases sirven para practicar.", fillerTip: "Sustituye las muletillas por una breve pausa silenciosa.", detailTip: "Añade un ejemplo breve y específico para reforzar la respuesta.", resultTip: "Añade un resultado concreto al final.", actionTip: "Explica tu acción personal, no solo la situación.", strongTip: "Respuesta sólida y bien estructurada con detalles útiles.", summary: "Completaste {answered} de {planned} preguntas previstas. Tus próximas mejoras vendrán de ejemplos más claros y resultados concretos.", stepStar: "Practica en voz alta la estructura STAR con tres historias preparadas.", stepRecord: "Graba una respuesta y sustituye las muletillas por pausas.", stepStories: "Prepara dos o tres historias específicas para responder con seguridad.", stronger: "Situación: Explica brevemente el contexto.\nTarea: Explica tu responsabilidad.\nAcción: Di exactamente lo que hiciste.\nResultado: Termina con un resultado claro o un número.\n\nIntenta hablar entre 45 y 90 segundos.", clarity: "Detalle claro", structure: "Estructura de respuesta", ownership: "Responsabilidad personal", impact: "Impacto y resultados", delivery: "Comunicación", roleEvidence: "Evidencia del rol", good: "Evidencia sólida en tus respuestas.", developing: "Un área útil para desarrollar en tu próxima respuesta." },
    fr: { detail: "Vous avez donné un niveau de détail utile.", clean: "Votre expression était claire, sans mots de remplissage détectés.", star: "Vous avez utilisé une structure Situation–Tâche–Action–Résultat claire.", consistent: "Vos réponses ont été régulièrement solides.", completed: "Vous avez terminé une séance d'entraînement utile.", fillers: "Réduisez les mots de remplissage comme « um » et « like » ; une courte pause peut paraître plus assurée.", short: "Ajoutez un exemple précis et un peu plus de détails.", starPractice: "Utilisez STAR : Situation, Tâche, Action, Résultat.", fuller: "Rendez la réponse plus complète et précise.", numbers: "Ajoutez un résultat ou une mesure concrète quand c'est possible.", noAnswer: "Aucune réponse n'a été donnée. Quelques phrases suffisent pour pratiquer utilement.", fillerTip: "Remplacez les mots de remplissage par une courte pause silencieuse.", detailTip: "Ajoutez un exemple bref et précis pour renforcer la réponse.", resultTip: "Ajoutez un résultat concret à la fin.", actionTip: "Précisez votre action personnelle, pas seulement la situation.", strongTip: "Réponse solide et bien structurée avec des détails utiles.", summary: "Vous avez répondu à {answered} questions sur {planned}. Vos prochains progrès viendront d'exemples plus clairs et de résultats concrets.", stepStar: "Entraînez-vous à voix haute avec trois histoires STAR prêtes.", stepRecord: "Enregistrez une réponse et remplacez les mots de remplissage par des pauses.", stepStories: "Préparez deux ou trois histoires précises pour répondre avec assurance.", stronger: "Situation : présentez brièvement le contexte.\nTâche : expliquez votre responsabilité.\nAction : dites exactement ce que vous avez fait.\nRésultat : terminez par un effet clair ou un chiffre.\n\nVisez environ 45 à 90 secondes à l'oral.", clarity: "Détail clair", structure: "Structure de réponse", ownership: "Responsabilité personnelle", impact: "Impact et résultats", delivery: "Communication", roleEvidence: "Preuve liée au poste", good: "Éléments solides dans vos réponses.", developing: "Un point utile à développer dans votre prochaine réponse." },
    de: { detail: "Du hast eine hilfreiche Menge an Details genannt.", clean: "Dein Ausdruck war klar; es wurden keine Füllwörter erkannt.", star: "Du hast eine klare Situation–Aufgabe–Handlung–Ergebnis-Struktur verwendet.", consistent: "Deine Antworten waren durchgehend stark.", completed: "Du hast eine wertvolle Übungseinheit abgeschlossen.", fillers: "Reduziere Füllwörter wie „um“ und „like“; eine kurze Pause kann selbstsicherer wirken.", short: "Ergänze ein konkretes Beispiel und etwas mehr Detail.", starPractice: "Nutze STAR: Situation, Aufgabe, Handlung, Ergebnis.", fuller: "Mach die Antwort vollständiger und konkreter.", numbers: "Füge wenn möglich ein konkretes Ergebnis oder Maß hinzu.", noAnswer: "Es wurde keine Antwort gegeben. Schon ein paar Sätze bieten nützliche Übung.", fillerTip: "Ersetze Füllwörter durch eine kurze stille Pause.", detailTip: "Ergänze ein kurzes, konkretes Beispiel, um die Antwort zu stärken.", resultTip: "Füge am Ende ein konkretes Ergebnis hinzu.", actionTip: "Mache deine persönliche Handlung deutlich, nicht nur die Situation.", strongTip: "Solide, gut strukturierte Antwort mit hilfreichen Details.", summary: "Du hast {answered} von {planned} geplanten Fragen beantwortet. Deine nächsten Fortschritte kommen durch klarere Beispiele und konkrete Ergebnisse.", stepStar: "Übe die STAR-Struktur laut mit drei vorbereiteten Geschichten.", stepRecord: "Nimm eine Antwort auf und ersetze Füllwörter durch Pausen.", stepStories: "Bereite zwei oder drei konkrete Geschichten vor, damit du selbstsicher antwortest.", stronger: "Situation: Beschreibe kurz den Kontext.\nAufgabe: Erkläre deine Verantwortung.\nHandlung: Sage genau, was du getan hast.\nErgebnis: Schliesse mit einem klaren Ergebnis oder einer Zahl.\n\nStrebe beim Sprechen etwa 45–90 Sekunden an.", clarity: "Klare Details", structure: "Antwortstruktur", ownership: "Persönliche Verantwortung", impact: "Wirkung und Ergebnisse", delivery: "Kommunikation", roleEvidence: "Rollenbeleg", good: "Starke Belege in deinen Antworten.", developing: "Ein hilfreicher Bereich für deine nächste Antwort." },
    hi: { detail: "आपने उपयोगी मात्रा में विवरण दिया।", clean: "आपकी प्रस्तुति साफ़ थी; कोई भराव शब्द नहीं मिला।", star: "आपने स्पष्ट स्थिति–कार्य–कार्रवाई–परिणाम संरचना का उपयोग किया।", consistent: "आपके उत्तर लगातार मजबूत रहे।", completed: "आपने एक मूल्यवान अभ्यास सत्र पूरा किया।", fillers: "‘um’ और ‘like’ जैसे भराव शब्द कम करें; छोटा विराम अधिक आत्मविश्वासी लग सकता है।", short: "एक विशिष्ट उदाहरण और थोड़ा अधिक विवरण जोड़ें।", starPractice: "STAR उपयोग करें: स्थिति, कार्य, कार्रवाई, परिणाम।", fuller: "उत्तर को अधिक पूर्ण और विशिष्ट बनाएँ।", numbers: "जहाँ संभव हो ठोस परिणाम या माप जोड़ें।", noAnswer: "कोई उत्तर नहीं दिया गया। कुछ वाक्य भी उपयोगी अभ्यास देते हैं।", fillerTip: "भराव शब्दों को छोटे मौन विराम से बदलें।", detailTip: "उत्तर को मजबूत बनाने के लिए छोटा, विशिष्ट उदाहरण जोड़ें।", resultTip: "अंत में ठोस परिणाम जोड़ें।", actionTip: "केवल स्थिति नहीं, अपनी व्यक्तिगत कार्रवाई स्पष्ट करें।", strongTip: "उपयोगी विवरण के साथ ठोस, सुव्यवस्थित उत्तर।", summary: "आपने {planned} में से {answered} नियोजित प्रश्न पूरे किए। आपकी अगली प्रगति स्पष्ट उदाहरणों और ठोस परिणामों से आएगी।", stepStar: "तीन तैयार कहानियों के साथ STAR संरचना का ज़ोर से अभ्यास करें।", stepRecord: "एक उत्तर रिकॉर्ड करें और भराव शब्दों को विराम से बदलें।", stepStories: "आत्मविश्वास से उत्तर देने के लिए दो या तीन विशिष्ट कहानियाँ तैयार करें।", stronger: "स्थिति: संदर्भ संक्षेप में बताइए।\nकार्य: अपनी जिम्मेदारी समझाइए।\nकार्रवाई: ठीक-ठीक बताइए कि आपने क्या किया।\nपरिणाम: स्पष्ट प्रभाव या संख्या के साथ समाप्त करें।\n\nबोलते समय लगभग 45–90 सेकंड का लक्ष्य रखें।", clarity: "स्पष्ट विवरण", structure: "उत्तर संरचना", ownership: "व्यक्तिगत जिम्मेदारी", impact: "प्रभाव और परिणाम", delivery: "संचार प्रस्तुति", roleEvidence: "भूमिका प्रमाण", good: "आपके उत्तरों में मजबूत प्रमाण।", developing: "आपके अगले उत्तर में विकसित करने योग्य क्षेत्र।" },
  };

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
  function replace(template, values) { return String(template || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ""); }
  function localized(key, values) { return Object.fromEntries(Object.keys(COPY).map((locale) => [locale, replace((COPY[locale] || COPY.en)[key] || COPY.en[key], values)])); }

  function countFillers(text) {
    const lower = ` ${String(text || "").toLowerCase()} `;
    let count = 0;
    const found = [];
    FILLER_WORDS.forEach((word) => {
      const matches = lower.match(new RegExp(`\\b${word.replace(/ /g, "\\s+")}\\b`, "g"));
      if (matches) { count += matches.length; found.push(word); }
    });
    return { count, found };
  }

  function detectStarParts(text) {
    const parts = {};
    let hits = 0;
    Object.keys(STAR_PATTERNS).forEach((key) => { parts[key] = STAR_PATTERNS[key].test(text); if (parts[key]) hits += 1; });
    return { parts, hits };
  }

  function analyzeAnswer(text) {
    const trimmed = String(text || "").trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const fillers = countFillers(trimmed);
    const star = detectStarParts(trimmed);
    const ownership = OWNERSHIP.test(trimmed) || star.parts.action;
    const specificity = SPECIFICITY.test(trimmed) || wordCount >= 28;
    const metric = /\b\d+(?:\.\d+)?\s*(%|percent|users?|customers?|hours?|days?|weeks?|tickets?|projects?)?\b/i.test(trimmed);
    const technologies = Array.from(new Set((trimmed.match(TECHNOLOGY) || []).map((value) => value.toLowerCase()))).slice(0, 4);
    const score = clamp(25 + clamp(Math.round((wordCount / 60) * 28), 0, 28) + star.hits * 8 + (ownership ? 7 : 0) + (specificity ? 6 : 0) - clamp(fillers.count * 4, 0, 20), 0, 100);
    let quickTipKey = "strongTip";
    if (!wordCount) quickTipKey = "noAnswer";
    else if (fillers.count >= 3) quickTipKey = "fillerTip";
    else if (!specificity || wordCount < 15) quickTipKey = "detailTip";
    else if (!star.parts.action || !ownership) quickTipKey = "actionTip";
    else if (!star.parts.result) quickTipKey = "resultTip";
    return { wordCount, fillerCount: fillers.count, fillersFound: fillers.found, starParts: star.parts, starHits: star.hits, ownership, specificity, metric, technologies, score, quickTip: COPY.en[quickTipKey], quickTipKey };
  }

  function buildImprovedExample(locale) { return (COPY[locale] || COPY.en).stronger; }

  function buildImmediateFeedback(analysis, roleFocus) {
    const improvementKey = analysis.quickTipKey;
    const strengthKey = analysis.starHits >= 3 ? "star" : analysis.fillerCount === 0 && analysis.wordCount >= 20 ? "clean" : analysis.specificity ? "detail" : "completed";
    const indicators = [
      { id: "detail", label: localized("clarity"), value: `${analysis.wordCount} words`, state: analysis.wordCount >= 20 ? "good" : "watch" },
      { id: "star", label: { en: "STAR", ar: "STAR", es: "STAR", fr: "STAR", de: "STAR", hi: "STAR" }, value: `${analysis.starHits}/4`, state: analysis.starHits >= 3 ? "good" : "watch" },
      { id: "fillers", label: { en: "Fillers", ar: "كلمات الحشو", es: "Muletillas", fr: "Mots de remplissage", de: "Füllwörter", hi: "भराव शब्द" }, value: analysis.fillerCount ? String(analysis.fillerCount) : "0", state: analysis.fillerCount === 0 ? "good" : "watch" },
      { id: "focus", label: { en: "Role focus", ar: "تركيز الوظيفة", es: "Enfoque del puesto", fr: "Focus du poste", de: "Rollenfokus", hi: "भूमिका फोकस" }, value: roleFocus && roleFocus.en ? roleFocus.en : "Relevant evidence", state: analysis.specificity ? "good" : "watch" },
    ];
    return { score: analysis.score, strength: localized(strengthKey), improvement: localized(improvementKey), tip: localized(improvementKey), strongerExample: Object.fromEntries(Object.keys(COPY).map((locale) => [locale, buildImprovedExample(locale)])), indicators };
  }

  function metric(id, key, score, analysis) {
    return {
      id,
      label: localized(key),
      score: Math.round(clamp(score, 0, 100)),
      description: localized(score >= 65 ? "good" : "developing"),
      evidence: { averageWords: Math.round(analysis.avgWords || 0), fillers: analysis.fillers || 0, starRate: analysis.starRate || 0 },
    };
  }

  function buildReport(transcript, options) {
    const opts = options || {};
    const entries = transcript || [];
    const answeredEntries = entries.filter((entry) => !entry.skipped && String(entry.answer || "").trim());
    const analyses = answeredEntries.map((entry) => entry.analysis || analyzeAnswer(entry.answer));
    const answered = answeredEntries.length;
    const avgScore = average(analyses.map((analysis) => analysis.score));
    const avgWords = average(analyses.map((analysis) => analysis.wordCount));
    const fillers = analyses.reduce((total, analysis) => total + analysis.fillerCount, 0);
    const starRate = average(analyses.map((analysis) => analysis.starHits / 4));
    const ownershipRate = average(analyses.map((analysis) => analysis.ownership ? 1 : 0));
    const specificityRate = average(analyses.map((analysis) => analysis.specificity ? 1 : 0));
    const impactRate = average(analyses.map((analysis) => analysis.starParts.result || analysis.metric ? 1 : 0));
    const planned = opts.plannedQuestions || entries.length;
    const strengthKeys = [];
    const weaknessKeys = [];
    if (avgWords >= 30) strengthKeys.push("detail");
    if (fillers === 0 && answered) strengthKeys.push("clean");
    if (starRate >= .5) strengthKeys.push("star");
    if (avgScore >= 75) strengthKeys.push("consistent");
    if (!strengthKeys.length) strengthKeys.push("completed");
    if (fillers >= 5) weaknessKeys.push("fillers");
    if (avgWords < 15) weaknessKeys.push("short");
    if (starRate < .3) weaknessKeys.push("starPractice");
    if (impactRate < .45) weaknessKeys.push("numbers");
    if (!weaknessKeys.length) weaknessKeys.push("numbers");
    const translations = {};
    Object.keys(COPY).forEach((locale) => {
      const copy = COPY[locale];
      translations[locale] = {
        summary: replace(copy.summary, { answered, planned }),
        strengths: strengthKeys.map((key) => copy[key]),
        weaknesses: weaknessKeys.map((key) => copy[key]),
        englishFeedback: `${fillers ? copy.fillers : copy.clean} ${avgWords < 20 ? copy.short : copy.numbers}`,
        nextSteps: [copy.stepStar, copy.stepRecord].concat(avgWords < 20 ? [copy.stepStories] : []),
      };
    });
    const metricsInput = { avgWords, fillers, starRate };
    const metrics = [
      metric("clarity", "clarity", avgWords >= 60 ? 100 : avgWords / 60 * 100, metricsInput),
      metric("structure", "structure", starRate * 100, metricsInput),
      metric("ownership", "ownership", ownershipRate * 100, metricsInput),
      metric("impact", "impact", impactRate * 100, metricsInput),
      metric("delivery", "delivery", answered ? clamp(100 - fillers * 8, 0, 100) : 0, metricsInput),
      metric("role-evidence", "roleEvidence", specificityRate * 100, metricsInput),
    ];
    return {
      overallScore: Math.round(avgScore), completedAnswers: answered, plannedQuestions: planned, isPartial: Boolean(opts.isPartial),
      strongestSkill: translations.en.strengths[0], biggestImprovement: translations.en.weaknesses[0], summary: translations.en.summary,
      strengths: translations.en.strengths, weaknesses: translations.en.weaknesses, englishFeedback: translations.en.englishFeedback, nextSteps: translations.en.nextSteps, translations, metrics,
      perQuestion: entries.map((entry, index) => {
        const analysis = entry.analysis || analyzeAnswer(entry.answer);
        const skipped = Boolean(entry.skipped);
        const tipKey = skipped ? "noAnswer" : analysis.quickTipKey;
        return {
          questionId: entry.questionId || `answer-${index + 1}`, question: entry.question, questionText: entry.questionText || null, skipped,
          tip: COPY.en[tipKey], improvedExample: skipped ? "Prepare a short, honest response for this topic before your next practice session." : buildImprovedExample("en"),
          translation: Object.fromEntries(Object.keys(COPY).map((locale) => [locale, { tip: COPY[locale][tipKey], improvedExample: skipped ? COPY[locale].stepStories : buildImprovedExample(locale) }])),
          observations: { wordCount: analysis.wordCount, fillerCount: analysis.fillerCount, starHits: analysis.starHits, ownership: analysis.ownership, specificity: analysis.specificity },
        };
      }),
    };
  }

  function mergeAIReport(localReport, aiReport) {
    if (!aiReport) return localReport;
    const result = { ...localReport };
    ["summary", "strengths", "weaknesses", "englishFeedback", "nextSteps"].forEach((key) => { if (aiReport[key] && (Array.isArray(aiReport[key]) ? aiReport[key].length : true)) result[key] = aiReport[key]; });
    const byId = new Map((aiReport.perQuestion || []).map((item) => [item.questionId, item]));
    result.perQuestion = result.perQuestion.map((item) => ({ ...item, ...(byId.get(item.questionId) || {}) }));
    Object.keys(aiReport.translations || {}).forEach((locale) => { if (result.translations[locale]) result.translations[locale] = { ...result.translations[locale], ...aiReport.translations[locale] }; });
    return result;
  }

  IQ.feedback = { analyzeAnswer, buildImmediateFeedback, buildImprovedExample, buildReport, mergeAIReport, COPY };
})();

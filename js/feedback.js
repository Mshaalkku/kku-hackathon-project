/* ===========================================================
   Interview Quest — local feedback and report fallback
   Scoring is deterministic and English-focused. It works offline and
   preserves every original candidate answer exactly as submitted.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const FILLER_WORDS = ["um", "uh", "erm", "like", "you know", "sort of", "kind of", "basically", "actually", "i mean", "literally"];
  const STAR_PATTERNS = {
    situation: /\b(when i|there was a time|in my (previous|last|current)|at my (previous|last|current)?\s*(job|role|company)|one time|back when)\b/i,
    task: /\b(i (needed|had) to|my (task|job|responsibility) was|i was responsible for|the goal was)\b/i,
    action: /\b(i (decided|implemented|created|organized|built|led|managed|contacted|developed|designed|solved|resolved|proposed|handled))\b/i,
    result: /\b(as a result|the result was|we (achieved|increased|reduced|improved)|i (learned|ended up)|%|percent|\d+)\b/i,
  };

  const COPY = {
    en: {
      detail: "You gave detailed, substantive answers.", clean: "Your delivery was clean, with no filler words detected.", star: "You used a clear Situation–Task–Action–Result structure.", consistent: "Your answers were consistently strong.", completed: "You completed the practice interview — that is valuable progress.",
      fillers: "Reduce filler words such as ‘um’ and ‘like’; a short pause can sound more confident.", short: "Several answers were brief. Add a specific example and a little more detail.", starPractice: "Practice the STAR structure: Situation, Task, Action, Result.", fuller: "Focus on fuller, more specific answers overall.", numbers: "Keep practicing by adding numbers or concrete outcomes when you can.",
      noAnswer: "No answer was given. Even a few sentences create useful practice.", fillerTip: "Try replacing filler words with a short silent pause.", detailTip: "Add a short, specific example to make this answer stronger.", resultTip: "Add a concrete result or outcome at the end.", actionTip: "Make your personal action explicit, not only the situation.", strongTip: "Solid, well-structured answer with useful detail.",
      summary: "You completed {answered} of {planned} planned questions. Your next gains will come from clearer examples and concrete outcomes.",
      stepStar: "Practice the STAR structure out loud with three go-to stories.", stepRecord: "Record one answer and count filler words; aim to replace them with pauses.", stepStories: "Prepare two or three specific stories so you can answer with confidence.",
      stronger: "Situation: Briefly set the scene.\nTask: Explain your responsibility.\nAction: Say exactly what you did.\nResult: End with a clear outcome or number.\n\nAim for about 45–90 seconds when speaking.",
    },
    ar: {
      detail: "قدمت إجابات مفصلة وذات مضمون.", clean: "كان أسلوبك واضحاً ولم تُكتشف كلمات حشو.", star: "استخدمت بنية واضحة: الموقف والمهمة والإجراء والنتيجة.", consistent: "كانت إجاباتك قوية باستمرار.", completed: "أكملت مقابلة التدريب — وهذا تقدم مهم.",
      fillers: "خفف كلمات الحشو مثل «um» و«like»؛ فالوقفة القصيرة قد تبدو أكثر ثقة.", short: "كانت عدة إجابات قصيرة. أضف مثالاً محدداً ومزيداً من التفاصيل.", starPractice: "تدرّب على بنية STAR: الموقف والمهمة والإجراء والنتيجة.", fuller: "ركز على إجابات أكثر اكتمالاً وتحديداً.", numbers: "استمر في التدريب بإضافة أرقام أو نتائج ملموسة عندما تستطيع.",
      noAnswer: "لم تُقدَّم إجابة. حتى بضع جمل تمنحك تدريباً مفيداً.", fillerTip: "حاول استبدال كلمات الحشو بوقفة صامتة قصيرة.", detailTip: "أضف مثالاً قصيراً ومحدداً لتقوية إجابتك.", resultTip: "أضف نتيجة أو أثراً ملموساً في النهاية.", actionTip: "وضح الإجراء الذي اتخذته أنت شخصياً، وليس الموقف فقط.", strongTip: "إجابة قوية ومنظمة تتضمن تفاصيل مفيدة.",
      summary: "أكملت {answered} من أصل {planned} أسئلة مخططة. ستأتي مكاسبك التالية من أمثلة أوضح ونتائج ملموسة.",
      stepStar: "تدرّب بصوت عالٍ على بنية STAR مع ثلاث قصص جاهزة.", stepRecord: "سجل إجابة واحدة وعدّ كلمات الحشو؛ استبدلها بوقفات.", stepStories: "حضّر قصتين أو ثلاث قصص محددة لتجيب بثقة.",
      stronger: "الموقف: اشرح السياق بإيجاز.\nالمهمة: وضح مسؤوليتك.\nالإجراء: قل بالضبط ما فعلته.\nالنتيجة: اختم بأثر واضح أو رقم.\n\nاستهدف نحو 45–90 ثانية عند التحدث.",
    },
    es: {
      detail: "Diste respuestas detalladas y sustanciales.", clean: "Tu expresión fue limpia, sin palabras de relleno detectadas.", star: "Usaste una estructura clara de Situación–Tarea–Acción–Resultado.", consistent: "Tus respuestas fueron consistentemente sólidas.", completed: "Completaste la entrevista de práctica; es un avance valioso.",
      fillers: "Reduce muletillas como ‘um’ y ‘like’; una pausa breve puede sonar más segura.", short: "Varias respuestas fueron breves. Añade un ejemplo específico y más detalle.", starPractice: "Practica la estructura STAR: Situación, Tarea, Acción y Resultado.", fuller: "Céntrate en respuestas más completas y específicas.", numbers: "Sigue practicando al añadir números o resultados concretos cuando puedas.",
      noAnswer: "No se dio una respuesta. Incluso unas frases sirven para practicar.", fillerTip: "Sustituye las muletillas por una breve pausa silenciosa.", detailTip: "Añade un ejemplo breve y específico para reforzar la respuesta.", resultTip: "Añade un resultado concreto al final.", actionTip: "Explica tu acción personal, no solo la situación.", strongTip: "Respuesta sólida y bien estructurada con detalles útiles.",
      summary: "Completaste {answered} de {planned} preguntas previstas. Tus próximas mejoras vendrán de ejemplos más claros y resultados concretos.",
      stepStar: "Practica en voz alta la estructura STAR con tres historias preparadas.", stepRecord: "Graba una respuesta y cuenta las muletillas; sustitúyelas por pausas.", stepStories: "Prepara dos o tres historias específicas para responder con seguridad.",
      stronger: "Situación: Explica brevemente el contexto.\nTarea: Explica tu responsabilidad.\nAcción: Di exactamente lo que hiciste.\nResultado: Termina con un resultado claro o un número.\n\nIntenta hablar entre 45 y 90 segundos.",
    },
    fr: {
      detail: "Vous avez donné des réponses détaillées et substantielles.", clean: "Votre expression était claire, sans mots de remplissage détectés.", star: "Vous avez utilisé une structure Situation–Tâche–Action–Résultat claire.", consistent: "Vos réponses ont été régulièrement solides.", completed: "Vous avez terminé l'entretien d'entraînement : c'est un progrès précieux.",
      fillers: "Réduisez les mots de remplissage comme « um » et « like » ; une courte pause peut paraître plus assurée.", short: "Plusieurs réponses étaient brèves. Ajoutez un exemple précis et davantage de détails.", starPractice: "Entraînez-vous à la structure STAR : Situation, Tâche, Action, Résultat.", fuller: "Concentrez-vous sur des réponses plus complètes et précises.", numbers: "Continuez à ajouter des chiffres ou des résultats concrets quand c'est possible.",
      noAnswer: "Aucune réponse n'a été donnée. Quelques phrases suffisent pour pratiquer utilement.", fillerTip: "Remplacez les mots de remplissage par une courte pause silencieuse.", detailTip: "Ajoutez un exemple bref et précis pour renforcer la réponse.", resultTip: "Ajoutez un résultat concret à la fin.", actionTip: "Précisez votre action personnelle, pas seulement la situation.", strongTip: "Réponse solide et bien structurée avec des détails utiles.",
      summary: "Vous avez répondu à {answered} questions sur {planned}. Vos prochains progrès viendront d'exemples plus clairs et de résultats concrets.",
      stepStar: "Entraînez-vous à voix haute avec trois histoires STAR prêtes.", stepRecord: "Enregistrez une réponse et comptez les mots de remplissage ; remplacez-les par des pauses.", stepStories: "Préparez deux ou trois histoires précises pour répondre avec assurance.",
      stronger: "Situation : présentez brièvement le contexte.\nTâche : expliquez votre responsabilité.\nAction : dites exactement ce que vous avez fait.\nRésultat : terminez par un effet clair ou un chiffre.\n\nVisez environ 45 à 90 secondes à l'oral.",
    },
    de: {
      detail: "Du hast ausführliche, gehaltvolle Antworten gegeben.", clean: "Dein Ausdruck war klar; es wurden keine Füllwörter erkannt.", star: "Du hast eine klare Situation–Aufgabe–Handlung–Ergebnis-Struktur verwendet.", consistent: "Deine Antworten waren durchgehend stark.", completed: "Du hast das Übungsinterview abgeschlossen – das ist wertvoller Fortschritt.",
      fillers: "Reduziere Füllwörter wie „um“ und „like“; eine kurze Pause kann selbstsicherer wirken.", short: "Mehrere Antworten waren kurz. Ergänze ein konkretes Beispiel und etwas mehr Detail.", starPractice: "Übe die STAR-Struktur: Situation, Aufgabe, Handlung, Ergebnis.", fuller: "Konzentriere dich auf vollständigere und konkretere Antworten.", numbers: "Übe weiter, indem du wenn möglich Zahlen oder konkrete Ergebnisse nennst.",
      noAnswer: "Es wurde keine Antwort gegeben. Schon ein paar Sätze bieten nützliche Übung.", fillerTip: "Ersetze Füllwörter durch eine kurze stille Pause.", detailTip: "Ergänze ein kurzes, konkretes Beispiel, um die Antwort zu stärken.", resultTip: "Füge am Ende ein konkretes Ergebnis hinzu.", actionTip: "Mache deine persönliche Handlung deutlich, nicht nur die Situation.", strongTip: "Solide, gut strukturierte Antwort mit hilfreichen Details.",
      summary: "Du hast {answered} von {planned} geplanten Fragen beantwortet. Deine nächsten Fortschritte kommen durch klarere Beispiele und konkrete Ergebnisse.",
      stepStar: "Übe die STAR-Struktur laut mit drei vorbereiteten Geschichten.", stepRecord: "Nimm eine Antwort auf und zähle Füllwörter; ersetze sie durch Pausen.", stepStories: "Bereite zwei oder drei konkrete Geschichten vor, damit du selbstsicher antwortest.",
      stronger: "Situation: Beschreibe kurz den Kontext.\nAufgabe: Erkläre deine Verantwortung.\nHandlung: Sage genau, was du getan hast.\nErgebnis: Schliesse mit einem klaren Ergebnis oder einer Zahl.\n\nStrebe beim Sprechen etwa 45–90 Sekunden an.",
    },
    hi: {
      detail: "आपने विस्तृत और सार्थक उत्तर दिए।", clean: "आपकी प्रस्तुति साफ़ थी; कोई भराव शब्द नहीं मिला।", star: "आपने स्पष्ट स्थिति–कार्य–कार्रवाई–परिणाम संरचना का उपयोग किया।", consistent: "आपके उत्तर लगातार मजबूत रहे।", completed: "आपने अभ्यास साक्षात्कार पूरा किया — यह मूल्यवान प्रगति है।",
      fillers: "‘um’ और ‘like’ जैसे भराव शब्द कम करें; छोटा विराम अधिक आत्मविश्वासी लग सकता है।", short: "कई उत्तर छोटे थे। एक विशिष्ट उदाहरण और थोड़ा अधिक विवरण जोड़ें।", starPractice: "STAR संरचना का अभ्यास करें: स्थिति, कार्य, कार्रवाई, परिणाम।", fuller: "अधिक पूर्ण और विशिष्ट उत्तरों पर ध्यान दें।", numbers: "जब संभव हो तो संख्याएँ या ठोस परिणाम जोड़कर अभ्यास जारी रखें।",
      noAnswer: "कोई उत्तर नहीं दिया गया। कुछ वाक्य भी उपयोगी अभ्यास देते हैं।", fillerTip: "भराव शब्दों को छोटे मौन विराम से बदलने का प्रयास करें।", detailTip: "उत्तर को मजबूत बनाने के लिए छोटा, विशिष्ट उदाहरण जोड़ें।", resultTip: "अंत में ठोस परिणाम जोड़ें।", actionTip: "केवल स्थिति नहीं, अपनी व्यक्तिगत कार्रवाई स्पष्ट करें।", strongTip: "उपयोगी विवरण के साथ ठोस, सुव्यवस्थित उत्तर।",
      summary: "आपने {planned} में से {answered} नियोजित प्रश्न पूरे किए। आपकी अगली प्रगति स्पष्ट उदाहरणों और ठोस परिणामों से आएगी।",
      stepStar: "तीन तैयार कहानियों के साथ STAR संरचना का ज़ोर से अभ्यास करें।", stepRecord: "एक उत्तर रिकॉर्ड करें और भराव शब्द गिनें; उन्हें विराम से बदलें।", stepStories: "आत्मविश्वास से उत्तर देने के लिए दो या तीन विशिष्ट कहानियाँ तैयार करें।",
      stronger: "स्थिति: संदर्भ संक्षेप में बताइए।\nकार्य: अपनी जिम्मेदारी समझाइए।\nकार्रवाई: ठीक-ठीक बताइए कि आपने क्या किया।\nपरिणाम: स्पष्ट प्रभाव या संख्या के साथ समाप्त करें।\n\nबोलते समय लगभग 45–90 सेकंड का लक्ष्य रखें।",
    },
  };

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

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
  function replace(template, values) { return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ""); }

  function analyzeAnswer(text) {
    const trimmed = String(text || "").trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const fillers = countFillers(trimmed);
    const star = detectStarParts(trimmed);
    const score = clamp(30 + clamp(Math.round((wordCount / 60) * 25), 0, 25) + star.hits * 8 - clamp(fillers.count * 4, 0, 20), 0, 100);
    let quickTipKey = "strongTip";
    if (!wordCount) quickTipKey = "noAnswer";
    else if (fillers.count >= 3) quickTipKey = "fillerTip";
    else if (wordCount < 15) quickTipKey = "detailTip";
    else if (!star.parts.result) quickTipKey = "resultTip";
    else if (!star.parts.action) quickTipKey = "actionTip";
    return { wordCount, fillerCount: fillers.count, fillersFound: fillers.found, starParts: star.parts, starHits: star.hits, score, quickTip: COPY.en[quickTipKey], quickTipKey };
  }

  function translationsFor(key, values) {
    return Object.fromEntries(Object.keys(COPY).map((locale) => [locale, replace(COPY[locale][key] || COPY.en[key], values || {})]));
  }

  function buildImprovedExample(locale) { return (COPY[locale] || COPY.en).stronger; }

  function buildReport(transcript, options) {
    const opts = options || {};
    const entries = transcript || [];
    const analyses = entries.map((entry) => entry.analysis || analyzeAnswer(entry.answer));
    const answered = entries.filter((entry) => !entry.skipped && String(entry.answer || "").trim()).length;
    const avgScore = average(analyses.map((analysis) => analysis.score));
    const avgWords = average(analyses.map((analysis) => analysis.wordCount));
    const fillers = analyses.reduce((total, analysis) => total + analysis.fillerCount, 0);
    const starRate = average(analyses.map((analysis) => analysis.starHits / 4));
    const strengthKeys = [];
    const weaknessKeys = [];
    if (avgWords >= 30) strengthKeys.push("detail");
    if (fillers === 0) strengthKeys.push("clean");
    if (starRate >= 0.5) strengthKeys.push("star");
    if (avgScore >= 75) strengthKeys.push("consistent");
    if (!strengthKeys.length) strengthKeys.push("completed");
    if (fillers >= 5) weaknessKeys.push("fillers");
    if (avgWords < 15) weaknessKeys.push("short");
    if (starRate < 0.3) weaknessKeys.push("starPractice");
    if (avgScore < 50) weaknessKeys.push("fuller");
    if (!weaknessKeys.length) weaknessKeys.push("numbers");
    const planned = opts.plannedQuestions || entries.length;
    const translations = {};
    Object.keys(COPY).forEach((locale) => {
      const copy = COPY[locale];
      translations[locale] = {
        summary: replace(copy.summary, { answered, planned }),
        strengths: strengthKeys.map((key) => copy[key]),
        weaknesses: weaknessKeys.map((key) => copy[key]),
        englishFeedback: locale === "en"
          ? (fillers ? `We detected about ${fillers} filler word${fillers === 1 ? "" : "s"}. Your average answer was ${Math.round(avgWords)} words; ${avgWords < 20 ? "add a specific example next time." : "that gives you a useful amount of detail."}` : `Clean delivery with no filler words detected. Your average answer was ${Math.round(avgWords)} words; ${avgWords < 20 ? "add a specific example next time." : "that gives you a useful amount of detail."}`)
          : `${fillers ? copy.fillers : copy.clean} ${avgWords < 20 ? copy.short : copy.numbers}`,
        nextSteps: [copy.stepStar, copy.stepRecord].concat(avgWords < 20 ? [copy.stepStories] : []),
      };
    });
    return {
      overallScore: Math.round(avgScore),
      completedAnswers: answered,
      plannedQuestions: planned,
      isPartial: Boolean(opts.isPartial),
      strongestSkill: translations.en.strengths[0],
      biggestImprovement: translations.en.weaknesses[0],
      summary: translations.en.summary,
      strengths: translations.en.strengths,
      weaknesses: translations.en.weaknesses,
      englishFeedback: translations.en.englishFeedback,
      nextSteps: translations.en.nextSteps,
      translations,
      perQuestion: entries.map((entry, index) => {
        const analysis = analyses[index];
        return {
          questionId: entry.questionId || `answer-${index + 1}`,
          question: entry.question,
          questionText: entry.questionText || null,
          tip: analysis.quickTip,
          improvedExample: buildImprovedExample("en"),
          translation: Object.fromEntries(Object.keys(COPY).map((locale) => [locale, { tip: COPY[locale][analysis.quickTipKey], improvedExample: buildImprovedExample(locale) }])),
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
    const locale = Object.keys(aiReport.translations || {})[0];
    if (locale && result.translations[locale]) result.translations[locale] = { ...result.translations[locale], ...aiReport.translations[locale] };
    return result;
  }

  IQ.feedback = { analyzeAnswer, buildImprovedExample, buildReport, mergeAIReport };
})();

/* ===========================================================
   Ready2Interview — local feedback and report fallback
   Deterministic English-focused coaching; original answers stay intact.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const FILLER_WORDS = ["um", "uh", "erm", "like", "you know", "sort of", "kind of", "basically", "actually", "i mean", "literally"];
  const STAR_PATTERNS = {
    situation: /\b(when i|there was a time|in my (previous|last|current)|at my (previous|last|current)?\s*(job|role|company)|one time|back when)\b/i,
    task: /\b(i (needed|had) to|my (task|job|responsibility) was|i was responsible for|the goal was)\b/i,
    action: /\b(i (decided|implemented|created|organized|built|led|managed|contacted|developed|designed|solved|resolved|proposed|handled|tested|analyzed|improved|prioritized|communicated|coordinated|supported|recommended))\b/i,
    result: /\b(as a result|the result was|we (achieved|increased|reduced|improved)|i (learned|ended up)|%|percent|increased|reduced|improved)\b/i,
  };
  const OWNERSHIP = /\b(i (led|built|created|designed|implemented|decided|organized|analyzed|resolved|tested|improved|communicated|coordinated|supported|recommended|prioritized)|my (responsibility|contribution|role))\b/i;
  const SPECIFICITY = /\b(project|team|user|customer|client|stakeholder|dashboard|prototype|system|application|campaign|report|process|feature|model|incident|ticket|workshop)\b/i;
  const TECHNOLOGY = /\b(javascript|python|java|sql|excel|figma|tableau|power bi|aws|azure|react|html|css|api|database|machine learning|analytics|prototype)\b/ig;
  const ROLE_CUES = {
    general: /\b(skill|experience|strength|work|study|team|project|customer|result)\b/i,
    "software-engineering": /\b(code|software|design|test(?:ing)?|debug|deploy(?:ment)?|reliability|system|api|database|feature)\b/i,
    "information-systems": /\b(system|data|quality|process|stakeholder|information|workflow)\b/i,
    cybersecurity: /\b(security|risk|threat|incident|vulnerability|secure|privacy|access)\b/i,
    "ai-machine-learning": /\b(model|data|evaluation|accuracy|bias|machine learning|training|prediction)\b/i,
    "data-analysis": /\b(data|analysis|dashboard|metric|insight|report|visuali[sz]|decision)\b/i,
    "it-support": /\b(support|troubleshoot|issue|user|ticket|diagnos|uptime|technical)\b/i,
    "product-management": /\b(product|customer|user|priority|roadmap|feature|discovery|outcome)\b/i,
    "project-management": /\b(project|plan|stakeholder|risk|timeline|deadline|scope|delivery)\b/i,
    marketing: /\b(campaign|audience|message|brand|content|conversion|marketing|channel)\b/i,
    "finance-accounting": /\b(finance|account|budget|reporting|reconcil|accuracy|control|forecast)\b/i,
    "human-resources": /\b(employee|hiring|recruit|people|candidate|confidential|policy|onboarding)\b/i,
    sales: /\b(customer|client|sales|prospect|pitch|revenue|relationship|objection)\b/i,
    "ux-ui-design": /\b(user|research|design|prototype|usability|accessib|interface|figma)\b/i,
    "business-analysis": /\b(requirement|process|stakeholder|business|workflow|analysis|decision)\b/i,
    "customer-service": /\b(customer|service|case|resolution|empathy|complaint|support|trust)\b/i,
    "healthcare-nursing": /\b(patient|care|safety|clinical|health|handover|family|treatment)\b/i,
    "education-teaching": /\b(student|learner|lesson|class|teaching|assessment|learning|education)\b/i,
    engineering: /\b(engineering|design|test(?:ing)?|safety|technical|prototype|quality|reliability)\b/i,
    "administrative-office": /\b(office|schedule|record|administrative|coordination|accuracy|document|confidential)\b/i,
    "operations-supply-chain": /\b(operation|inventory|logistics|supply|workflow|supplier|efficiency|delivery)\b/i,
    "legal-law": /\b(legal|law|contract|case|document|confidential|research|compliance)\b/i,
    "graphic-design-creative": /\b(design|visual|brand|creative|campaign|brief|audience|accessib)\b/i,
    "hospitality-tourism": /\b(guest|hospitality|service|visitor|event|travel|booking|satisfaction)\b/i,
  };
  const STAGE_EXPECTATIONS = {
    introduction: { relevance: /\b(interested|interest|motivated|motivation|strength|experience|background|because|career|role)\b/i, label: "why this role interests you and one relevant strength or experience" },
    background: { relevance: /\b(experience|project|work|study|role|responsib|contribut|team|task)\b/i, label: "a relevant experience and your personal contribution" },
    role: { relevance: /\b(skill|experience|project|developed|used|built|improved|worked)\b/i, label: "a role-relevant skill demonstrated in a real situation" },
    behavioral: { relevance: /\b(team|colleague|stakeholder|communicat|listen|conflict|collaborat|feedback)\b/i, label: "a collaboration situation and how you worked with others" },
    challenge: { relevance: /\b(problem|challenge|issue|difficult|priority|prioritiz|decision|solution|trade-?off)\b/i, label: "a difficult problem, your priority, and the action you took" },
    impact: { relevance: /\b(result|impact|improv|benefit|customer|user|team|outcome|measure|metric|percent|reduc|increas)\b/i, label: "a specific outcome, who benefited, and how you knew it helped" },
    growth: { relevance: /\b(learn|develop|improve|skill|course|practice|feedback|goal|growth)\b/i, label: "one skill to develop and a practical learning step" },
    closing: { relevance: /\b(question|team|role|expectation|success|culture|opportunity|measure)\b/i, label: "a genuine question about the role, team, expectations, or success" },
    fallback: { relevance: /\b(i|my|project|experience|work|result|skill)\b/i, label: "the specific detail the question asks for" },
  };
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

  function normalizeContext(context) {
    const input = context || {};
    return {
      question: String(input.question || ""),
      stage: STAGE_EXPECTATIONS[input.stage] ? input.stage : "fallback",
      roleId: ROLE_CUES[input.roleId] ? input.roleId : "general",
      roleFocus: input.roleFocus && input.roleFocus.en ? input.roleFocus : { en: "relevant skills" },
      difficulty: ["easy", "medium", "hard"].includes(input.difficulty) ? input.difficulty : "medium",
    };
  }

  function detectContextEvidence(text, context) {
    const normalized = normalizeContext(context);
    const expectation = STAGE_EXPECTATIONS[normalized.stage];
    const roleEvidence = ROLE_CUES[normalized.roleId].test(text);
    const relevant = expectation.relevance.test(text);
    const priority = /\b(priorit(?:y|ized|ise|ised)|first|trade-?off|weigh(?:ed|ing)?|decided|decision)\b/i.test(text);
    const beneficiary = /\b(user|customer|client|patient|student|team|stakeholder|guest|family)\b/i.test(text);
    const learningPlan = /\b(course|practice|feedback|mentor|training|learn(?:ing)? plan|weekly|monthly|next step)\b/i.test(text);
    const genuineQuestion = /\?$/.test(String(text || "").trim()) || /\b(what|how|which|who|when|could you tell me|would you)\b/i.test(text);
    return { relevant, roleEvidence, priority, beneficiary, learningPlan, genuineQuestion, expectation, context: normalized };
  }

  function analyzeAnswer(text, context) {
    const trimmed = String(text || "").trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const fillers = countFillers(trimmed);
    const star = detectStarParts(trimmed);
    const ownership = OWNERSHIP.test(trimmed) || star.parts.action;
    const specificity = SPECIFICITY.test(trimmed);
    const metric = /\b\d+(?:\.\d+)?\s*(%|percent|users?|customers?|hours?|days?|weeks?|tickets?|projects?)?\b/i.test(trimmed);
    const technologies = Array.from(new Set((trimmed.match(TECHNOLOGY) || []).map((value) => value.toLowerCase()))).slice(0, 4);
    const evidence = detectContextEvidence(trimmed, context);
    if (!wordCount) {
      return { wordCount, fillerCount: 0, fillersFound: [], starParts: star.parts, starHits: 0, ownership: false, specificity: false, metric: false, technologies, relevance: false, roleEvidence: false, contextEvidence: evidence, score: 0, quickTip: COPY.en.noAnswer, quickTipKey: "noAnswer" };
    }
    const baseScore = 12 + clamp(Math.round((wordCount / 60) * 25), 0, 25) + star.hits * 7 + (ownership ? 7 : 0) + (specificity ? 5 : 0) + (metric ? 4 : 0);
    const contextScore = (evidence.relevant ? 10 : 0) + (evidence.roleEvidence ? 8 : 0) + (evidence.context.stage === "challenge" && evidence.priority ? 4 : 0) + (evidence.context.stage === "impact" && evidence.beneficiary ? 4 : 0) + (evidence.context.stage === "growth" && evidence.learningPlan ? 4 : 0) + (evidence.context.stage === "closing" && evidence.genuineQuestion ? 8 : 0);
    const score = clamp(baseScore + contextScore - clamp(fillers.count * 4, 0, 20), 0, 100);
    let quickTipKey = "strongTip";
    if (!evidence.relevant) quickTipKey = "detailTip";
    else if (fillers.count >= 3) quickTipKey = "fillerTip";
    else if (!specificity || wordCount < 15) quickTipKey = "detailTip";
    else if (!ownership) quickTipKey = "actionTip";
    else if (!star.parts.result && evidence.context.stage !== "closing") quickTipKey = "resultTip";
    return { wordCount, fillerCount: fillers.count, fillersFound: fillers.found, starParts: star.parts, starHits: star.hits, ownership, specificity, metric, technologies, relevance: evidence.relevant, roleEvidence: evidence.roleEvidence, contextEvidence: evidence, score, quickTip: COPY.en[quickTipKey], quickTipKey };
  }

  function depthExpectation(context) {
    const difficulty = normalizeContext(context).difficulty;
    if (difficulty === "easy") return "Name one clear, relevant example and what you personally did.";
    if (difficulty === "hard") return "Explain your decision or trade-off and support the outcome with concrete evidence or a measure where appropriate.";
    return "Include the context, your responsibility, the action you took, and the outcome.";
  }

  function stageImprovement(analysis, context) {
    const evidence = analysis.contextEvidence || detectContextEvidence("", context);
    const stage = evidence.context.stage;
    if (!analysis.relevance) return `This answer does not yet address ${evidence.expectation.label}.`;
    if (stage === "challenge" && !evidence.priority) return "State what you prioritized first and why, then explain the action you took.";
    if (stage === "impact" && (!analysis.metric || !evidence.beneficiary)) return "Name who benefited and add a concrete outcome or measure that shows the impact.";
    if (stage === "growth" && !evidence.learningPlan) return "Name one practical learning step, such as guided practice, feedback, or a course.";
    if (stage === "closing" && !evidence.genuineQuestion) return "Ask one genuine question about the role, team, expectations, or how success is measured.";
    if (!analysis.roleEvidence && stage === "role") return `Connect your example more directly to ${evidence.context.roleFocus.en}.`;
    if (!analysis.ownership) return "Make your personal responsibility and action explicit rather than describing only the situation.";
    if (!analysis.starParts.result && stage !== "closing") return "Finish with the result or what changed because of your action.";
    if (!analysis.specificity || analysis.wordCount < 15) return "Add one concrete detail from the situation so the interviewer can understand your evidence.";
    return depthExpectation(evidence.context);
  }

  function actualStrength(analysis, context) {
    const evidence = analysis.contextEvidence || detectContextEvidence("", context);
    const strengths = [];
    if (analysis.roleEvidence) strengths.push(`You connected the answer to ${evidence.context.roleFocus.en}.`);
    if (analysis.ownership) strengths.push("You made your personal action or responsibility clear.");
    if (analysis.starHits >= 3) strengths.push("You used a clear Situation–Task–Action–Result structure.");
    if (analysis.starParts.result || analysis.metric) strengths.push("You included evidence of an outcome.");
    if (analysis.relevance) strengths.push(`You addressed ${evidence.expectation.label}.`);
    if (analysis.fillerCount === 0 && analysis.wordCount >= 12) strengths.push("Your delivery was concise and free of detected filler words.");
    return strengths[0] || "You submitted an answer that can now be strengthened with direct evidence.";
  }

  function buildImprovedExample(context, analysis, locale) {
    const normalized = normalizeContext(context);
    const focus = normalized.roleFocus.en || "relevant skills";
    const technology = analysis && analysis.technologies && analysis.technologies[0] ? ` If ${analysis.technologies[0]} is relevant to your real example, explain how you used it.` : "";
    const stageTemplates = {
      introduction: `For this introduction, briefly connect your motivation and one real strength or experience to ${focus}.`,
      background: `For this experience question, briefly set the context, state your personal contribution, explain the action you took, and end with the real result.`,
      role: `For this role-skills question, choose one real situation that demonstrates ${focus}; explain what you personally did and what it achieved.`,
      behavioral: `For this collaboration question, describe the differing viewpoint, how you listened and communicated, your action, and the outcome.`,
      challenge: `For this challenge, name the problem, explain what you prioritized and why, describe your action, and finish with what happened next.`,
      impact: `For this impact question, identify who benefited, explain your personal action, and state the real outcome and how you measured or observed it.`,
      growth: `For this growth question, name one role-relevant skill you want to strengthen, why it matters, and one practical learning step you will take.`,
      closing: `Ask one genuine question about the role, team, expectations, or how success will be measured so you can evaluate the opportunity well.`,
      fallback: `Answer the specific question with a real context, your personal action, and the outcome.`,
    };
    const template = stageTemplates[normalized.stage] || stageTemplates.fallback;
    const depth = normalized.difficulty === "easy" ? "Keep it to one clear real example." : normalized.difficulty === "hard" ? "Also explain the decision or trade-off you considered and use a real measure where available." : "Make the responsibility, action, and outcome easy to follow.";
    if (locale && locale !== "en") return template;
    return `${template} ${depth}${technology}`;
  }

  function buildImmediateFeedback(analysis, context) {
    const normalized = normalizeContext(context);
    const improvement = stageImprovement(analysis, normalized);
    const strength = actualStrength(analysis, normalized);
    const indicators = [
      { id: "detail", label: localized("clarity"), value: String(analysis.wordCount), state: analysis.specificity && analysis.wordCount >= 15 ? "good" : "watch" },
      { id: "star", label: { en: "STAR", ar: "STAR", es: "STAR", fr: "STAR", de: "STAR", hi: "STAR" }, value: `${analysis.starHits}/4`, state: analysis.starHits >= 3 ? "good" : "watch" },
      { id: "fillers", label: localized("fillers"), value: String(analysis.fillerCount), state: analysis.fillerCount === 0 ? "good" : "watch" },
      { id: "focus", label: localized("roleEvidence"), value: normalized.roleFocus, state: analysis.roleEvidence ? "good" : "watch" },
    ];
    const translations = Object.fromEntries(Object.keys(COPY).map((locale) => [locale, strength]));
    const improvements = Object.fromEntries(Object.keys(COPY).map((locale) => [locale, improvement]));
    return {
      score: analysis.score,
      strength: translations,
      improvement: improvements,
      tip: improvements,
      strongerExample: Object.fromEntries(Object.keys(COPY).map((locale) => [locale, buildImprovedExample(normalized, analysis, locale)])),
      indicators,
    };
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
    const reportContext = normalizeContext({ roleId: opts.roleId, roleFocus: opts.roleFocus, difficulty: opts.difficulty });
    const answeredEntries = entries.filter((entry) => !entry.skipped && String(entry.answer || "").trim());
    const analyses = answeredEntries.map((entry) => entry.analysis || analyzeAnswer(entry.answer, { ...reportContext, question: entry.question, stage: entry.stage }));
    const answered = answeredEntries.length;
    const avgScore = average(analyses.map((analysis) => analysis.score));
    const avgWords = average(analyses.map((analysis) => analysis.wordCount));
    const fillers = analyses.reduce((total, analysis) => total + analysis.fillerCount, 0);
    const starRate = average(analyses.map((analysis) => analysis.starHits / 4));
    const ownershipRate = average(analyses.map((analysis) => analysis.ownership ? 1 : 0));
    const specificityRate = average(analyses.map((analysis) => analysis.specificity ? 1 : 0));
    const roleEvidenceRate = average(analyses.map((analysis) => analysis.roleEvidence ? 1 : 0));
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
    if (roleEvidenceRate < .45) weaknessKeys.push("detailTip");
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
      metric("role-evidence", "roleEvidence", roleEvidenceRate * 100, metricsInput),
    ];
    return {
      overallScore: Math.round(avgScore), completedAnswers: answered, plannedQuestions: planned, isPartial: Boolean(opts.isPartial),
      strongestSkill: translations.en.strengths[0], biggestImprovement: translations.en.weaknesses[0], summary: translations.en.summary,
      strengths: translations.en.strengths, weaknesses: translations.en.weaknesses, englishFeedback: translations.en.englishFeedback, nextSteps: translations.en.nextSteps, translations, metrics,
      perQuestion: entries.map((entry, index) => {
        const context = { ...reportContext, question: entry.question, stage: entry.stage };
        const analysis = entry.analysis || analyzeAnswer(entry.answer, context);
        const skipped = Boolean(entry.skipped);
        const improvement = skipped ? `Prepare ${normalizeContext(context).stage === "closing" ? "one genuine question for the interviewer" : STAGE_EXPECTATIONS[normalizeContext(context).stage].label} before your next practice session.` : stageImprovement(analysis, context);
        return {
          questionId: entry.questionId || `answer-${index + 1}`, question: entry.question, questionText: entry.questionText || null, skipped,
          tip: improvement, improvedExample: buildImprovedExample(context, analysis, "en"),
          translation: Object.fromEntries(Object.keys(COPY).map((locale) => [locale, { tip: improvement, improvedExample: buildImprovedExample(context, analysis, locale) }])),
          observations: { wordCount: analysis.wordCount, fillerCount: analysis.fillerCount, starHits: analysis.starHits, ownership: analysis.ownership, specificity: analysis.specificity, relevance: analysis.relevance, roleEvidence: analysis.roleEvidence },
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

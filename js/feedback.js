/* ===========================================================
   Ready2Interview — local feedback and report fallback
   Deterministic English-focused scoring; original answers stay intact.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const LOCALES = ["en", "ar", "es", "fr", "de", "hi"];
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

  const PROFILE_ORDER = [
    ["followUpAction", /\b(specific responsibility|personally do|personally did)\b/i],
    ["followUpResult", /\b(what changed|outcome (was|did)|result)\b/i],
    ["followUpMetric", /\b(how did you measure|measure the impact|measurement)\b/i],
    ["followUpSpecificity", /\b(more specific|concrete example)\b/i],
    ["introduction", /\b(introduce yourself|interests you)\b/i],
    ["background", /\b(walk me through|your contribution)\b/i],
    ["roleSkill", /\b(how have you developed|ground your answer|one example)\b/i],
    ["behavioral", /\b(different viewpoint|move the work forward)\b/i],
    ["challenge", /\b(decide what to do first|what to do first)\b/i],
    ["impact", /\b(created impact|impact did|specific example.*impact)\b/i],
    ["growth", /\b(learn|become stronger|develop next)\b/i],
    ["closing", /\b(questions do you have|would you like to ask)\b/i],
  ];
  const STAGE_PROFILE = { introduction: "introduction", background: "background", role: "roleSkill", behavioral: "behavioral", challenge: "challenge", impact: "impact", growth: "growth", closing: "closing", fallback: "generic" };

  const TARGETS = {
    introduction: { en: "why this role interests you and one relevant strength or experience", ar: "سبب اهتمامك بهذا الدور ونقطة قوة أو خبرة ذات صلة", es: "por qué te interesa este puesto y una fortaleza o experiencia relevante", fr: "pourquoi ce poste vous intéresse et un atout ou une expérience pertinente", de: "warum dich diese Rolle interessiert und eine relevante Stärke oder Erfahrung", hi: "आपकी इस भूमिका में रुचि और एक प्रासंगिक ताकत या अनुभव" },
    background: { en: "a real experience and your personal contribution", ar: "خبرة حقيقية ومساهمتك الشخصية", es: "una experiencia real y tu contribución personal", fr: "une expérience réelle et votre contribution personnelle", de: "eine echte Erfahrung und deinen persönlichen Beitrag", hi: "एक वास्तविक अनुभव और आपका व्यक्तिगत योगदान" },
    roleSkill: { en: "one example that demonstrates the role-relevant skill", ar: "مثال واحد يثبت المهارة المرتبطة بالدور", es: "un ejemplo que demuestre la habilidad relevante para el puesto", fr: "un exemple qui démontre la compétence pertinente pour le poste", de: "ein Beispiel, das die rollenrelevante Fähigkeit zeigt", hi: "भूमिका-संबंधित कौशल दिखाने वाला एक उदाहरण" },
    behavioral: { en: "how you handled a different viewpoint and moved the work forward", ar: "كيف تعاملت مع وجهة نظر مختلفة ودفعت العمل إلى الأمام", es: "cómo manejaste un punto de vista diferente e impulsaste el trabajo", fr: "comment vous avez géré un point de vue différent et fait avancer le travail", de: "wie du mit einer anderen Sichtweise umgegangen bist und die Arbeit vorangebracht hast", hi: "आपने अलग दृष्टिकोण को कैसे संभाला और काम को आगे बढ़ाया" },
    challenge: { en: "the problem, what you prioritized first, and why", ar: "المشكلة وما الذي أعطيته الأولوية أولاً ولماذا", es: "el problema, qué priorizaste primero y por qué", fr: "le problème, ce que vous avez priorisé en premier et pourquoi", de: "das Problem, was du zuerst priorisiert hast und warum", hi: "समस्या, आपने पहले किसे प्राथमिकता दी और क्यों" },
    impact: { en: "who benefited and the outcome or evidence of impact", ar: "من الذي استفاد والنتيجة أو دليل الأثر", es: "quién se benefició y el resultado o la evidencia del impacto", fr: "qui en a bénéficié et le résultat ou la preuve de l’impact", de: "wer profitiert hat und das Ergebnis oder ein Wirkungsbeleg", hi: "किसे लाभ हुआ और परिणाम या प्रभाव का प्रमाण" },
    growth: { en: "one skill to develop, why it matters, and a practical learning step", ar: "مهارة واحدة لتطويرها ولماذا تهم وخطوة تعلم عملية", es: "una habilidad que desarrollar, por qué importa y un paso práctico de aprendizaje", fr: "une compétence à développer, son importance et une étape d’apprentissage concrète", de: "eine auszubauende Fähigkeit, warum sie wichtig ist, und einen praktischen Lernschritt", hi: "विकसित करने योग्य कौशल, उसका महत्व और एक व्यावहारिक सीखने का कदम" },
    closing: { en: "a genuine question about the role, team, expectations, or success", ar: "سؤالاً حقيقياً عن الدور أو الفريق أو التوقعات أو النجاح", es: "una pregunta genuina sobre el puesto, el equipo, las expectativas o el éxito", fr: "une question sincère sur le poste, l’équipe, les attentes ou la réussite", de: "eine echte Frage zu Rolle, Team, Erwartungen oder Erfolg", hi: "भूमिका, टीम, अपेक्षाओं या सफलता के बारे में एक वास्तविक प्रश्न" },
    followUpAction: { en: "your specific responsibility and personal action", ar: "مسؤوليتك المحددة وإجراءك الشخصي", es: "tu responsabilidad específica y tu acción personal", fr: "votre responsabilité précise et votre action personnelle", de: "deine konkrete Verantwortung und persönliche Handlung", hi: "आपकी विशिष्ट जिम्मेदारी और व्यक्तिगत कार्रवाई" },
    followUpResult: { en: "what changed and the evidence of the outcome", ar: "ما الذي تغير ودليل النتيجة", es: "qué cambió y la evidencia del resultado", fr: "ce qui a changé et la preuve du résultat", de: "was sich verändert hat und der Ergebnisbeleg", hi: "क्या बदला और परिणाम का प्रमाण" },
    followUpMetric: { en: "how you measured or observed the impact", ar: "كيف قست الأثر أو لاحظته", es: "cómo mediste u observaste el impacto", fr: "comment vous avez mesuré ou observé l’impact", de: "wie du die Wirkung gemessen oder beobachtet hast", hi: "आपने प्रभाव को कैसे मापा या देखा" },
    followUpSpecificity: { en: "one concrete example or detail", ar: "مثالاً أو تفصيلاً ملموساً واحداً", es: "un ejemplo o detalle concreto", fr: "un exemple ou détail concret", de: "ein konkretes Beispiel oder Detail", hi: "एक ठोस उदाहरण या विवरण" },
    generic: { en: "the specific detail requested by the question", ar: "التفصيل المحدد الذي يطلبه السؤال", es: "el detalle específico que pide la pregunta", fr: "le détail précis demandé par la question", de: "das konkrete Detail, nach dem die Frage fragt", hi: "प्रश्न द्वारा मांगा गया विशिष्ट विवरण" },
  };

  const COPY = {
    en: { detail: "You gave a useful amount of detail.", clean: "Your delivery was clean, with no filler words detected.", star: "You used a clear Situation–Task–Action–Result structure.", consistent: "Your answers were consistently strong.", completed: "You completed a valuable practice session.", fillers: "Reduce filler words such as ‘um’ and ‘like’; a short pause can sound more confident.", short: "Add one specific example and a little more detail.", starPractice: "Use STAR: Situation, Task, Action, Result.", fuller: "Make the answer more complete and specific.", numbers: "Add a concrete outcome or measure when you can.", noAnswer: "No answer was given. Even a few sentences create useful practice.", fillerTip: "Replace filler words with a short silent pause.", detailTip: "Add a short, specific example to make this answer stronger.", resultTip: "Add a concrete result or outcome at the end.", actionTip: "Make your personal action explicit, not only the situation.", strongTip: "Solid, well-structured answer with useful detail.", summary: "You completed {answered} of {planned} planned questions. Your next gains will come from clearer examples and concrete outcomes.", stepStar: "Practice the STAR structure out loud with three go-to stories.", stepRecord: "Record one answer and replace filler words with pauses.", stepStories: "Prepare two or three specific stories so you can answer with confidence.", clarity: "Clear detail", structure: "Answer structure", ownership: "Personal ownership", impact: "Impact & outcomes", delivery: "Communication delivery", roleEvidence: "Role evidence", good: "Strong evidence in your responses.", developing: "A useful area to develop in your next answer." },
    ar: { detail: "قدمت قدراً مفيداً من التفاصيل.", clean: "كان أسلوبك واضحاً ولم تُكتشف كلمات حشو.", star: "استخدمت بنية واضحة: الموقف والمهمة والإجراء والنتيجة.", consistent: "كانت إجاباتك قوية باستمرار.", completed: "أكملت جلسة تدريب قيمة.", fillers: "خفف كلمات الحشو مثل «um» و«like»؛ فالوقفة القصيرة قد تبدو أكثر ثقة.", short: "أضف مثالاً محدداً ومزيداً قليلاً من التفاصيل.", starPractice: "استخدم STAR: الموقف، المهمة، الإجراء، النتيجة.", fuller: "اجعل الإجابة أكثر اكتمالاً وتحديداً.", numbers: "أضف نتيجة أو قياساً ملموساً عندما تستطيع.", noAnswer: "لم تُقدَّم إجابة. حتى بضع جمل تمنحك تدريباً مفيداً.", fillerTip: "استبدل كلمات الحشو بوقفة صامتة قصيرة.", detailTip: "أضف مثالاً قصيراً ومحدداً لتقوية إجابتك.", resultTip: "أضف نتيجة أو أثراً ملموساً في النهاية.", actionTip: "وضح الإجراء الذي اتخذته أنت شخصياً، وليس الموقف فقط.", strongTip: "إجابة قوية ومنظمة تتضمن تفاصيل مفيدة.", summary: "أكملت {answered} من أصل {planned} أسئلة مخططة. ستأتي مكاسبك التالية من أمثلة أوضح ونتائج ملموسة.", stepStar: "تدرّب بصوت عالٍ على بنية STAR مع ثلاث قصص جاهزة.", stepRecord: "سجل إجابة واحدة واستبدل كلمات الحشو بوقفات.", stepStories: "حضّر قصتين أو ثلاث قصص محددة لتجيب بثقة.", clarity: "تفاصيل واضحة", structure: "بنية الإجابة", ownership: "المسؤولية الشخصية", impact: "الأثر والنتائج", delivery: "أسلوب التواصل", roleEvidence: "دليل المهارة الوظيفية", good: "دليل قوي في إجاباتك.", developing: "مجال مفيد لتطويره في إجابتك التالية." },
    es: { detail: "Diste una cantidad útil de detalle.", clean: "Tu expresión fue limpia, sin palabras de relleno detectadas.", star: "Usaste una estructura clara de Situación–Tarea–Acción–Resultado.", consistent: "Tus respuestas fueron consistentemente sólidas.", completed: "Completaste una sesión de práctica valiosa.", fillers: "Reduce muletillas como ‘um’ y ‘like’; una pausa breve puede sonar más segura.", short: "Añade un ejemplo específico y algo más de detalle.", starPractice: "Usa STAR: Situación, Tarea, Acción, Resultado.", fuller: "Haz la respuesta más completa y específica.", numbers: "Añade un resultado o medida concreta cuando puedas.", noAnswer: "No se dio una respuesta. Incluso unas frases sirven para practicar.", fillerTip: "Sustituye las muletillas por una breve pausa silenciosa.", detailTip: "Añade un ejemplo breve y específico para reforzar la respuesta.", resultTip: "Añade un resultado concreto al final.", actionTip: "Explica tu acción personal, no solo la situación.", strongTip: "Respuesta sólida y bien estructurada con detalles útiles.", summary: "Completaste {answered} de {planned} preguntas previstas. Tus próximas mejoras vendrán de ejemplos más claros y resultados concretos.", stepStar: "Practica en voz alta la estructura STAR con tres historias preparadas.", stepRecord: "Graba una respuesta y sustituye las muletillas por pausas.", stepStories: "Prepara dos o tres historias específicas para responder con seguridad.", clarity: "Detalle claro", structure: "Estructura de respuesta", ownership: "Responsabilidad personal", impact: "Impacto y resultados", delivery: "Comunicación", roleEvidence: "Evidencia del puesto", good: "Evidencia sólida en tus respuestas.", developing: "Un área útil para desarrollar en tu próxima respuesta." },
    fr: { detail: "Vous avez donné un niveau de détail utile.", clean: "Votre expression était claire, sans mots de remplissage détectés.", star: "Vous avez utilisé une structure Situation–Tâche–Action–Résultat claire.", consistent: "Vos réponses ont été régulièrement solides.", completed: "Vous avez terminé une séance d'entraînement utile.", fillers: "Réduisez les mots de remplissage comme « um » et « like » ; une courte pause peut paraître plus assurée.", short: "Ajoutez un exemple précis et un peu plus de détails.", starPractice: "Utilisez STAR : Situation, Tâche, Action, Résultat.", fuller: "Rendez la réponse plus complète et précise.", numbers: "Ajoutez un résultat ou une mesure concrète quand c'est possible.", noAnswer: "Aucune réponse n'a été donnée. Quelques phrases suffisent pour pratiquer utilement.", fillerTip: "Remplacez les mots de remplissage par une courte pause silencieuse.", detailTip: "Ajoutez un exemple bref et précis pour renforcer la réponse.", resultTip: "Ajoutez un résultat concret à la fin.", actionTip: "Précisez votre action personnelle, pas seulement la situation.", strongTip: "Réponse solide et bien structurée avec des détails utiles.", summary: "Vous avez répondu à {answered} questions sur {planned}. Vos prochains progrès viendront d'exemples plus clairs et de résultats concrets.", stepStar: "Entraînez-vous à voix haute avec trois histoires STAR prêtes.", stepRecord: "Enregistrez une réponse et remplacez les mots de remplissage par des pauses.", stepStories: "Préparez deux ou trois histoires précises pour répondre avec assurance.", clarity: "Détail clair", structure: "Structure de réponse", ownership: "Responsabilité personnelle", impact: "Impact et résultats", delivery: "Communication", roleEvidence: "Preuve liée au poste", good: "Éléments solides dans vos réponses.", developing: "Un point utile à développer dans votre prochaine réponse." },
    de: { detail: "Du hast eine hilfreiche Menge an Details genannt.", clean: "Dein Ausdruck war klar; es wurden keine Füllwörter erkannt.", star: "Du hast eine klare Situation–Aufgabe–Handlung–Ergebnis-Struktur verwendet.", consistent: "Deine Antworten waren durchgehend stark.", completed: "Du hast eine wertvolle Übungseinheit abgeschlossen.", fillers: "Reduziere Füllwörter wie „um“ und „like“; eine kurze Pause kann selbstsicherer wirken.", short: "Ergänze ein konkretes Beispiel und etwas mehr Detail.", starPractice: "Nutze STAR: Situation, Aufgabe, Handlung, Ergebnis.", fuller: "Mach die Antwort vollständiger und konkreter.", numbers: "Füge wenn möglich ein konkretes Ergebnis oder Maß hinzu.", noAnswer: "Es wurde keine Antwort gegeben. Schon ein paar Sätze bieten nützliche Übung.", fillerTip: "Ersetze Füllwörter durch eine kurze stille Pause.", detailTip: "Ergänze ein kurzes, konkretes Beispiel, um die Antwort zu stärken.", resultTip: "Füge am Ende ein konkretes Ergebnis hinzu.", actionTip: "Mache deine persönliche Handlung deutlich, nicht nur die Situation.", strongTip: "Solide, gut strukturierte Antwort mit hilfreichen Details.", summary: "Du hast {answered} von {planned} geplanten Fragen beantwortet. Deine nächsten Fortschritte kommen durch klarere Beispiele und konkrete Ergebnisse.", stepStar: "Übe die STAR-Struktur laut mit drei vorbereiteten Geschichten.", stepRecord: "Nimm eine Antwort auf und ersetze Füllwörter durch Pausen.", stepStories: "Bereite zwei oder drei konkrete Geschichten vor, damit du selbstsicher antwortest.", clarity: "Klare Details", structure: "Antwortstruktur", ownership: "Persönliche Verantwortung", impact: "Wirkung und Ergebnisse", delivery: "Kommunikation", roleEvidence: "Rollenbeleg", good: "Starke Belege in deinen Antworten.", developing: "Ein hilfreicher Bereich für deine nächste Antwort." },
    hi: { detail: "आपने उपयोगी मात्रा में विवरण दिया।", clean: "आपकी प्रस्तुति साफ़ थी; कोई भराव शब्द नहीं मिला।", star: "आपने स्पष्ट स्थिति–कार्य–कार्रवाई–परिणाम संरचना का उपयोग किया।", consistent: "आपके उत्तर लगातार मजबूत रहे।", completed: "आपने एक मूल्यवान अभ्यास सत्र पूरा किया।", fillers: "‘um’ और ‘like’ जैसे भराव शब्द कम करें; छोटा विराम अधिक आत्मविश्वासी लग सकता है।", short: "एक विशिष्ट उदाहरण और थोड़ा अधिक विवरण जोड़ें।", starPractice: "STAR उपयोग करें: स्थिति, कार्य, कार्रवाई, परिणाम।", fuller: "उत्तर को अधिक पूर्ण और विशिष्ट बनाएँ।", numbers: "जहाँ संभव हो ठोस परिणाम या माप जोड़ें।", noAnswer: "कोई उत्तर नहीं दिया गया। कुछ वाक्य भी उपयोगी अभ्यास देते हैं।", fillerTip: "भराव शब्दों को छोटे मौन विराम से बदलें।", detailTip: "उत्तर को मजबूत बनाने के लिए छोटा, विशिष्ट उदाहरण जोड़ें।", resultTip: "अंत में ठोस परिणाम जोड़ें।", actionTip: "केवल स्थिति नहीं, अपनी व्यक्तिगत कार्रवाई स्पष्ट करें।", strongTip: "उपयोगी विवरण के साथ ठोस, सुव्यवस्थित उत्तर।", summary: "आपने {planned} में से {answered} नियोजित प्रश्न पूरे किए। आपकी अगली प्रगति स्पष्ट उदाहरणों और ठोस परिणामों से आएगी।", stepStar: "तीन तैयार कहानियों के साथ STAR संरचना का ज़ोर से अभ्यास करें।", stepRecord: "एक उत्तर रिकॉर्ड करें और भराव शब्दों को विराम से बदलें।", stepStories: "आत्मविश्वास से उत्तर देने के लिए दो या तीन विशिष्ट कहानियाँ तैयार करें।", clarity: "स्पष्ट विवरण", structure: "उत्तर संरचना", ownership: "व्यक्तिगत जिम्मेदारी", impact: "प्रभाव और परिणाम", delivery: "संचार प्रस्तुति", roleEvidence: "भूमिका प्रमाण", good: "आपके उत्तरों में मजबूत प्रमाण।", developing: "आपके अगले उत्तर में विकसित करने योग्य क्षेत्र।" },
  };

  const COACH = {
    en: { strengthAction: "You made your personal action clear: “{anchor}”.", strengthRole: "You connected your example to {focus}.", strengthResult: "You stated an outcome or measure: “{anchor}”.", strengthTarget: "You addressed {target}.", noStrength: "The response is a starting point, but it does not yet show evidence for {target}.", missing: "Missing: {target}.", deepen: "To make this stronger, add one more specific detail that connects your answer to {focus}.", why: "This matters because this question asks for {target}; it helps the interviewer understand your fit for {focus}.", whyDeepen: "This answer already covers the main question. One more role-specific detail would make the evidence easier to trust.", how: "On your next try, add one direct sentence about {target} before you finish.", howDeepen: "Name the exact skill, decision, or outcome that shows {focus}.", exampleLead: "Build on your real answer like this:", keepAnchor: "Keep your real detail: “{anchor}”.", situation: "In [your real situation],", responsibility: "I was responsible for [your responsibility].", action: "I [the action I personally took].", result: "This helped [who benefited], and the result was [your real outcome or measure].", closing: "What would strong performance in the first 90 days look like for this role, and how does the team support someone learning the workflow?", score: "This practice score reflects detected answer signals and question focus, not hiring suitability.", skipped: "Prepare {target} before your next practice session." },
    ar: { strengthAction: "أوضحت إجراءك الشخصي: «{anchor}». ", strengthRole: "ربطت مثالك بـ {focus}.", strengthResult: "ذكرت نتيجة أو قياساً: «{anchor}». ", strengthTarget: "تناولت {target}.", noStrength: "تُعد الإجابة نقطة بداية، لكنها لا تعرض بعد دليلاً على {target}.", missing: "العنصر الناقص: {target}.", deepen: "لتقوية الإجابة أكثر، أضف تفصيلاً محدداً آخر يربط إجابتك بـ {focus}.", why: "هذا مهم لأن السؤال يطلب {target}؛ فهو يساعد المحاور على فهم ملاءمتك لـ {focus}.", whyDeepen: "تغطي هذه الإجابة السؤال الأساسي بالفعل. سيجعل تفصيل إضافي مرتبط بالدور الدليل أكثر إقناعاً.", how: "في محاولتك التالية، أضف جملة مباشرة عن {target} قبل أن تنهي الإجابة.", howDeepen: "اذكر المهارة أو القرار أو النتيجة المحددة التي تثبت {focus}.", exampleLead: "ابنِ على إجابتك الحقيقية بهذه الصيغة:", keepAnchor: "احتفظ بتفصيلك الحقيقي: «{anchor}». ", situation: "في [موقفك الحقيقي]،", responsibility: "كنت مسؤولاً عن [مسؤوليتك].", action: "أنا [الإجراء الذي اتخذته شخصياً].", result: "ساعد ذلك [المستفيد]، وكانت النتيجة [نتيجتك الحقيقية أو قياسك].", closing: "ما الذي تبدو عليه المساهمة القوية خلال أول 90 يوماً في هذا الدور، وكيف يدعم الفريق من يتعلم سير العمل؟", score: "تعكس درجة التدريب هذه إشارات الإجابة وتركيزها على السؤال، وليست حكماً على ملاءمتك للتوظيف.", skipped: "حضّر {target} قبل جلسة التدريب التالية." },
    es: { strengthAction: "Dejaste clara tu acción personal: «{anchor}».", strengthRole: "Conectaste tu ejemplo con {focus}.", strengthResult: "Mencionaste un resultado o una medida: «{anchor}».", strengthTarget: "Abordaste {target}.", noStrength: "La respuesta es un punto de partida, pero aún no muestra evidencia de {target}.", missing: "Falta: {target}.", deepen: "Para reforzarla, añade un detalle más que conecte tu respuesta con {focus}.", why: "Esto importa porque la pregunta pide {target}; ayuda a la persona entrevistadora a entender tu encaje con {focus}.", whyDeepen: "Esta respuesta ya cubre la pregunta principal. Un detalle más relacionado con el puesto hará que la evidencia sea más convincente.", how: "En tu próximo intento, añade una frase directa sobre {target} antes de terminar.", howDeepen: "Nombra la habilidad, decisión o resultado exacto que muestra {focus}.", exampleLead: "Construye sobre tu respuesta real así:", keepAnchor: "Conserva tu detalle real: «{anchor}».", situation: "En [tu situación real],", responsibility: "yo era responsable de [tu responsabilidad].", action: "yo [la acción que realicé personalmente].", result: "Esto ayudó a [quién se benefició] y el resultado fue [tu resultado o medida real].", closing: "¿Cómo sería un buen desempeño durante los primeros 90 días en este puesto y cómo apoya el equipo a alguien que aprende el flujo de trabajo?", score: "Esta puntuación de práctica refleja señales detectadas y el enfoque en la pregunta, no tu idoneidad para la contratación.", skipped: "Prepara {target} antes de tu próxima sesión de práctica." },
    fr: { strengthAction: "Vous avez clairement indiqué votre action personnelle : « {anchor} ».", strengthRole: "Vous avez relié votre exemple à {focus}.", strengthResult: "Vous avez indiqué un résultat ou une mesure : « {anchor} ».", strengthTarget: "Vous avez abordé {target}.", noStrength: "La réponse est un point de départ, mais elle ne montre pas encore d’élément sur {target}.", missing: "Élément manquant : {target}.", deepen: "Pour renforcer la réponse, ajoutez un détail précis qui la relie à {focus}.", why: "C’est important, car la question demande {target} ; cela aide la personne qui recrute à comprendre votre adéquation avec {focus}.", whyDeepen: "Cette réponse couvre déjà la question principale. Un détail supplémentaire lié au poste rendra l’élément plus convaincant.", how: "Lors de votre prochain essai, ajoutez une phrase directe sur {target} avant de terminer.", howDeepen: "Nommez la compétence, la décision ou le résultat précis qui démontre {focus}.", exampleLead: "Appuyez-vous sur votre réponse réelle ainsi :", keepAnchor: "Conservez votre détail réel : « {anchor} ».", situation: "Dans [votre situation réelle],", responsibility: "j’étais responsable de [votre responsabilité].", action: "j’ai [l’action que j’ai personnellement menée].", result: "Cela a aidé [la personne ou le groupe bénéficiaire], et le résultat a été [votre résultat ou mesure réelle].", closing: "À quoi ressemblerait une bonne performance pendant les 90 premiers jours dans ce poste, et comment l’équipe accompagne-t-elle une personne qui apprend le fonctionnement ?", score: "Ce score d’entraînement reflète les signaux détectés et le ciblage de la question, pas votre aptitude à être recruté·e.", skipped: "Préparez {target} avant votre prochaine séance d’entraînement." },
    de: { strengthAction: "Du hast deine persönliche Handlung klar gemacht: „{anchor}“.", strengthRole: "Du hast dein Beispiel mit {focus} verbunden.", strengthResult: "Du hast ein Ergebnis oder Maß genannt: „{anchor}“.", strengthTarget: "Du hast {target} angesprochen.", noStrength: "Die Antwort ist ein Anfang, zeigt aber noch keinen Beleg für {target}.", missing: "Es fehlt: {target}.", deepen: "Um die Antwort zu stärken, ergänze ein weiteres konkretes Detail, das sie mit {focus} verbindet.", why: "Das ist wichtig, weil die Frage nach {target} fragt; so kann die interviewende Person deine Passung zu {focus} besser verstehen.", whyDeepen: "Diese Antwort behandelt die Hauptfrage bereits. Ein weiteres rollenbezogenes Detail macht den Beleg überzeugender.", how: "Ergänze beim nächsten Versuch vor dem Schluss einen direkten Satz über {target}.", howDeepen: "Nenne die genaue Fähigkeit, Entscheidung oder das Ergebnis, die {focus} zeigt.", exampleLead: "Baue so auf deiner echten Antwort auf:", keepAnchor: "Behalte dein echtes Detail bei: „{anchor}“.", situation: "In [deiner echten Situation]", responsibility: "war ich verantwortlich für [deine Verantwortung].", action: "Ich [die Handlung, die ich selbst ausgeführt habe].", result: "Das half [wem es zugutekam], und das Ergebnis war [dein echtes Ergebnis oder Maß].", closing: "Wie sieht starke Leistung in den ersten 90 Tagen in dieser Rolle aus, und wie unterstützt das Team jemanden beim Lernen des Arbeitsablaufs?", score: "Dieser Übungsscore basiert auf erkannten Antwortsignalen und dem Fragebezug, nicht auf deiner Eignung für eine Einstellung.", skipped: "Bereite {target} vor deiner nächsten Übungseinheit vor." },
    hi: { strengthAction: "आपने अपनी व्यक्तिगत कार्रवाई स्पष्ट की: “{anchor}”।", strengthRole: "आपने अपने उदाहरण को {focus} से जोड़ा।", strengthResult: "आपने परिणाम या माप बताया: “{anchor}”।", strengthTarget: "आपने {target} को संबोधित किया।", noStrength: "उत्तर एक शुरुआती बिंदु है, लेकिन अभी {target} का प्रमाण नहीं दिखाता।", missing: "यह हिस्सा गायब है: {target}।", deepen: "उत्तर को और मजबूत बनाने के लिए एक और विशिष्ट विवरण जोड़ें जो इसे {focus} से जोड़े।", why: "यह महत्वपूर्ण है क्योंकि प्रश्न {target} पूछता है; इससे साक्षात्कारकर्ता को {focus} के लिए आपकी उपयुक्तता समझने में मदद मिलती है।", whyDeepen: "यह उत्तर मुख्य प्रश्न को पहले ही कवर करता है। भूमिका से जुड़ा एक और विवरण प्रमाण को अधिक भरोसेमंद बनाएगा।", how: "अगली कोशिश में समाप्त करने से पहले {target} के बारे में एक सीधा वाक्य जोड़ें।", howDeepen: "सटीक कौशल, निर्णय या परिणाम बताएं जो {focus} दिखाता है।", exampleLead: "अपने वास्तविक उत्तर पर इस तरह आधारित करें:", keepAnchor: "अपना वास्तविक विवरण रखें: “{anchor}”।", situation: "[अपनी वास्तविक स्थिति] में,", responsibility: "मैं [अपनी जिम्मेदारी] के लिए उत्तरदायी था/थी।", action: "मैंने [अपनी व्यक्तिगत कार्रवाई] की।", result: "इससे [जिसे लाभ हुआ] को मदद मिली और परिणाम [आपका वास्तविक परिणाम या माप] था।", closing: "इस भूमिका में पहले 90 दिनों में मजबूत प्रदर्शन कैसा दिखेगा, और कार्यप्रवाह सीखने वाले व्यक्ति को टीम कैसे सहयोग देती है?", score: "यह अभ्यास स्कोर पहचाने गए उत्तर संकेतों और प्रश्न के फोकस को दर्शाता है, नियुक्ति की उपयुक्तता को नहीं।", skipped: "अगले अभ्यास सत्र से पहले {target} तैयार करें।" },
  };

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
  function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
  function replace(template, values) { return String(template || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? ""); }
  function localized(key, values) { return Object.fromEntries(LOCALES.map((locale) => [locale, replace((COPY[locale] || COPY.en)[key] || COPY.en[key], values)])); }
  function localizedCoaching(key, values) { return Object.fromEntries(LOCALES.map((locale) => [locale, replace((COACH[locale] || COACH.en)[key] || COACH.en[key], valuesForLocale(values, locale))])); }
  function valuesForLocale(values, locale) {
    return Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [key, value && typeof value === "object" ? (value[locale] || value.en || "") : value]));
  }

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
      stage: STAGE_PROFILE[input.stage] ? input.stage : "fallback",
      roleId: ROLE_CUES[input.roleId] ? input.roleId : "general",
      roleFocus: input.roleFocus && input.roleFocus.en ? input.roleFocus : { en: "relevant skills", ar: "المهارات ذات الصلة", es: "habilidades relevantes", fr: "compétences pertinentes", de: "relevante Fähigkeiten", hi: "प्रासंगिक कौशल" },
      difficulty: ["easy", "medium", "hard"].includes(input.difficulty) ? input.difficulty : "medium",
    };
  }

  function detectProfile(context) {
    const normalized = normalizeContext(context);
    const question = normalized.question;
    const matched = PROFILE_ORDER.find(([, pattern]) => pattern.test(question));
    return matched ? matched[0] : (STAGE_PROFILE[normalized.stage] || "generic");
  }

  function hasProfileSignal(profile, text, signals) {
    const lower = String(text || "");
    const tests = {
      introduction: /\b(interested|interest|motivated|motivation|because|career|excited|drawn to)\b/i.test(lower) && /\b(strength|experience|background|skill|study|project|work)\b/i.test(lower),
      background: signals.ownership || /\b(contribution|responsib|my role|i helped)\b/i.test(lower),
      roleSkill: signals.roleEvidence && (signals.ownership || signals.specificity),
      behavioral: /\b(team|colleague|stakeholder|communicat|listen|conflict|collaborat|feedback)\b/i.test(lower) && signals.ownership,
      challenge: /\b(problem|challenge|issue|difficult|priority|prioritiz|first|decision|trade-?off)\b/i.test(lower) && signals.priority,
      impact: signals.beneficiary && (signals.result || signals.metric),
      growth: /\b(learn|develop|improve|skill|course|practice|feedback|goal|growth)\b/i.test(lower) && signals.learningPlan,
      closing: signals.genuineQuestion && /\b(role|team|expectation|success|culture|workflow|opportunity)\b/i.test(lower),
      followUpAction: signals.ownership,
      followUpResult: signals.result || signals.metric,
      followUpMetric: signals.metric || /\b(measure|tracked|observed|survey|feedback|data|monitor)\b/i.test(lower),
      followUpSpecificity: signals.specificity || signals.ownership,
      generic: signals.specificity || signals.ownership,
    };
    return Boolean(tests[profile]);
  }

  function findAnchor(text, pattern) {
    const sentence = String(text || "").split(/(?<=[.!?])\s+/).find((part) => pattern.test(part));
    return sentence ? sentence.trim().slice(0, 150) : "";
  }

  function detectContextEvidence(text, context) {
    const normalized = normalizeContext(context);
    const roleEvidence = ROLE_CUES[normalized.roleId].test(text);
    const priority = /\b(priorit(?:y|ized|ise|ised)|first|trade-?off|weigh(?:ed|ing)?|decided|decision)\b/i.test(text);
    const beneficiary = /\b(user|customer|client|patient|student|team|stakeholder|guest|family)\b/i.test(text);
    const learningPlan = /\b(course|practice|feedback|mentor|training|learn(?:ing)? plan|weekly|monthly|next step)\b/i.test(text);
    const genuineQuestion = /\?$/.test(String(text || "").trim()) || /\b(what|how|which|who|when|could you tell me|would you)\b/i.test(text);
    const result = STAR_PATTERNS.result.test(text);
    const metric = /\b\d+(?:\.\d+)?\s*(%|percent|users?|customers?|hours?|days?|weeks?|tickets?|projects?)?\b/i.test(text);
    const ownership = OWNERSHIP.test(text) || STAR_PATTERNS.action.test(text);
    const specificity = SPECIFICITY.test(text);
    const profile = detectProfile(normalized);
    const signals = { roleEvidence, priority, beneficiary, learningPlan, genuineQuestion, result, metric, ownership, specificity };
    const questionAligned = hasProfileSignal(profile, text, signals);
    const profileRequirementsMet = {
      introduction: questionAligned,
      background: questionAligned,
      roleSkill: questionAligned,
      behavioral: questionAligned,
      challenge: questionAligned,
      impact: questionAligned,
      growth: questionAligned,
      closing: questionAligned,
      followUpAction: questionAligned,
      followUpResult: questionAligned,
      followUpMetric: questionAligned,
      followUpSpecificity: questionAligned,
      generic: questionAligned,
    };
    return {
      ...signals,
      questionAligned,
      profileRequirementsMet,
      profile,
      target: TARGETS[profile] || TARGETS.generic,
      actionAnchor: findAnchor(text, OWNERSHIP),
      resultAnchor: findAnchor(text, STAR_PATTERNS.result),
      context: normalized,
    };
  }

  function analyzeAnswer(text, context) {
    const trimmed = String(text || "").trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    const fillers = countFillers(trimmed);
    const star = detectStarParts(trimmed);
    const technologies = Array.from(new Set((trimmed.match(TECHNOLOGY) || []).map((value) => value.toLowerCase()))).slice(0, 4);
    const evidence = detectContextEvidence(trimmed, context);
    const profile = evidence.profile;
    if (!wordCount) {
      return { wordCount, fillerCount: 0, fillersFound: [], starParts: star.parts, starHits: 0, ownership: false, specificity: false, metric: false, technologies, relevance: false, roleEvidence: false, contextEvidence: evidence, score: 0, scoreBreakdown: { detail: 0, evidence: 0, structure: 0, question: 0, delivery: 0 }, quickTip: COPY.en.noAnswer, quickTipKey: "noAnswer" };
    }
    const detail = clamp(Math.round(wordCount / (profile === "closing" ? 18 : 45) * 15), 0, 15);
    const evidencePoints = clamp((evidence.specificity ? 8 : 0) + (evidence.metric ? 8 : 0) + (technologies.length ? 4 : 0) + (evidence.beneficiary ? 5 : 0), 0, 25);
    const structureRelevant = profile === "closing" ? evidence.genuineQuestion : (evidence.ownership ? 12 : 0) + (evidence.result || evidence.metric ? 8 : 0) + (star.hits >= 3 ? 5 : 0);
    const structure = clamp(structureRelevant, 0, 25);
    const question = evidence.questionAligned ? 35 : 0;
    const delivery = clamp(15 - fillers.count * 3, 0, 15);
    let score = detail + evidencePoints + structure + question + delivery;
    if (!evidence.questionAligned) score = Math.min(score, 34);
    if (profile === "roleSkill" && !evidence.roleEvidence) score = Math.min(score, 54);
    score = clamp(Math.round(score), 0, 100);
    let quickTipKey = "strongTip";
    if (!evidence.questionAligned) quickTipKey = "detailTip";
    else if (fillers.count >= 3) quickTipKey = "fillerTip";
    else if (!evidence.ownership && profile !== "closing") quickTipKey = "actionTip";
    else if (!evidence.result && !["closing", "growth", "introduction"].includes(profile)) quickTipKey = "resultTip";
    return {
      wordCount, fillerCount: fillers.count, fillersFound: fillers.found, starParts: star.parts, starHits: star.hits,
      ownership: evidence.ownership, specificity: evidence.specificity, metric: evidence.metric, technologies,
      relevance: evidence.questionAligned, roleEvidence: evidence.questionAligned && evidence.roleEvidence,
      contextEvidence: evidence, score, scoreBreakdown: { detail, evidence: evidencePoints, structure, question, delivery },
      quickTip: COPY.en[quickTipKey], quickTipKey,
    };
  }

  function highestMissing(analysis, context) {
    const evidence = analysis.contextEvidence || detectContextEvidence("", context);
    const profile = evidence.profile;
    if (!analysis.wordCount) return { key: "target", target: evidence.target };
    if (profile === "introduction" && !evidence.questionAligned) return { key: "motivation", target: evidence.target };
    if (["challenge", "impact", "growth", "closing"].includes(profile) && !evidence.questionAligned) return { key: "target", target: evidence.target };
    if (profile === "roleSkill" && !analysis.roleEvidence) return { key: "role", target: evidence.context.roleFocus };
    if (["challenge"].includes(profile) && !evidence.priority) return { key: "priority", target: evidence.target };
    if (["impact"].includes(profile) && (!evidence.beneficiary || !(evidence.result || analysis.metric))) return { key: "impact", target: evidence.target };
    if (profile === "growth" && !evidence.learningPlan) return { key: "learning", target: evidence.target };
    if (profile === "closing" && !evidence.genuineQuestion) return { key: "question", target: evidence.target };
    if (["followUpAction", "background", "behavioral"].includes(profile) && !analysis.ownership) return { key: "action", target: evidence.target };
    if (["followUpResult", "followUpMetric"].includes(profile) && !(evidence.result || analysis.metric)) return { key: "result", target: evidence.target };
    if (!analysis.specificity || analysis.wordCount < 12) return { key: "detail", target: evidence.target };
    if (!evidence.result && !["introduction", "growth", "closing"].includes(profile)) return { key: "result", target: evidence.target };
    return { key: "depth", target: evidence.target };
  }

  function buildStrengths(analysis, context, locale) {
    const evidence = analysis.contextEvidence || detectContextEvidence("", context);
    const c = COACH[locale] || COACH.en;
    const values = valuesForLocale({ focus: evidence.context.roleFocus, target: evidence.target, anchor: evidence.actionAnchor || evidence.resultAnchor }, locale);
    const strengths = [];
    if (analysis.relevance) strengths.push(replace(c.strengthTarget, values));
    if (analysis.relevance && analysis.roleEvidence) strengths.push(replace(c.strengthRole, values));
    if (analysis.ownership && evidence.actionAnchor) strengths.push(replace(c.strengthAction, { ...values, anchor: evidence.actionAnchor }));
    if ((evidence.result || analysis.metric) && evidence.resultAnchor) strengths.push(replace(c.strengthResult, { ...values, anchor: evidence.resultAnchor }));
    if (!strengths.length) strengths.push(replace(c.noStrength, values));
    return strengths.slice(0, 2);
  }

  function buildExample(analysis, context, locale) {
    const evidence = analysis.contextEvidence || detectContextEvidence("", context);
    const c = COACH[locale] || COACH.en;
    if (evidence.profile === "closing") return c.closing;
    const lines = [c.exampleLead];
    if (evidence.actionAnchor || evidence.resultAnchor) lines.push(replace(c.keepAnchor, { anchor: evidence.actionAnchor || evidence.resultAnchor }));
    if (analysis.technologies && analysis.technologies[0]) lines.push(`${c.situation} [keep your ${analysis.technologies[0]} detail where it is true]`);
    else lines.push(c.situation);
    lines.push(c.responsibility, c.action);
    if (!["introduction", "growth"].includes(evidence.profile)) lines.push(c.result);
    return lines.join(" ");
  }

  function buildCoaching(analysis, context) {
    const normalized = normalizeContext(context);
    const evidence = analysis.contextEvidence || detectContextEvidence("", normalized);
    const missing = highestMissing(analysis, normalized);
    const strength = {};
    const improvement = {};
    const why = {};
    const howTo = {};
    const strongerExample = {};
    const scoreExplanation = {};
    LOCALES.forEach((locale) => {
      const c = COACH[locale] || COACH.en;
      const target = missing.target && typeof missing.target === "object" ? (missing.target[locale] || missing.target.en) : (evidence.target[locale] || evidence.target.en);
      const focus = evidence.context.roleFocus[locale] || evidence.context.roleFocus.en;
      strength[locale] = buildStrengths(analysis, normalized, locale);
      const complete = missing.key === "depth";
      const detailGap = missing.key === "detail";
      const resultGap = missing.key === "result";
      improvement[locale] = complete
        ? replace(c.deepen, { focus })
        : detailGap
          ? COPY[locale].detailTip
          : resultGap
            ? COPY[locale].resultTip
            : replace(c.missing, { target });
      why[locale] = complete ? c.whyDeepen : replace(c.why, { target, focus });
      howTo[locale] = complete ? replace(c.howDeepen, { focus }) : replace(c.how, { target });
      strongerExample[locale] = buildExample(analysis, normalized, locale);
      scoreExplanation[locale] = c.score;
    });
    return { strength, improvement, why, howTo, strongerExample, scoreExplanation, evidence, missing };
  }

  function buildImmediateFeedback(analysis, context) {
    const normalized = normalizeContext(context);
    const coaching = buildCoaching(analysis, normalized);
    const indicators = [
      { id: "detail", label: localized("clarity"), value: String(analysis.wordCount), state: analysis.specificity && analysis.wordCount >= 12 ? "good" : "watch" },
      { id: "star", label: { en: "STAR", ar: "STAR", es: "STAR", fr: "STAR", de: "STAR", hi: "STAR" }, value: `${analysis.starHits}/4`, state: analysis.starHits >= 3 ? "good" : "watch" },
      { id: "fillers", label: localized("fillers"), value: String(analysis.fillerCount), state: analysis.fillerCount === 0 ? "good" : "watch" },
      { id: "focus", label: localized("roleEvidence"), value: normalized.roleFocus, state: analysis.roleEvidence ? "good" : "watch" },
    ];
    return {
      score: analysis.score,
      scoreBreakdown: analysis.scoreBreakdown,
      strength: Object.fromEntries(LOCALES.map((locale) => [locale, coaching.strength[locale].join(" ")])),
      strengths: coaching.strength,
      improvement: coaching.improvement,
      why: coaching.why,
      howTo: coaching.howTo,
      tip: coaching.howTo,
      strongerExample: coaching.strongerExample,
      scoreExplanation: coaching.scoreExplanation,
      indicators,
    };
  }

  function metric(id, key, score, analysis) {
    return { id, label: localized(key), score: Math.round(clamp(score, 0, 100)), description: localized(score >= 65 ? "good" : "developing"), evidence: { averageWords: Math.round(analysis.avgWords || 0), fillers: analysis.fillers || 0, starRate: analysis.starRate || 0 } };
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
    LOCALES.forEach((locale) => {
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
    const perQuestion = entries.map((entry, index) => {
      const context = { ...reportContext, question: entry.question, stage: entry.stage };
      const analysis = entry.analysis || analyzeAnswer(entry.answer, context);
      const skipped = Boolean(entry.skipped);
      const feedback = buildImmediateFeedback(analysis, context);
      const skippedTip = localizedCoaching("skipped", { target: (analysis.contextEvidence.target || TARGETS.generic) });
      const translation = Object.fromEntries(LOCALES.map((locale) => [locale, skipped ? {
        strengths: [], improvement: skippedTip[locale], why: skippedTip[locale], howTo: skippedTip[locale], tip: skippedTip[locale], improvedExample: feedback.strongerExample[locale], scoreExplanation: feedback.scoreExplanation[locale],
      } : {
        strengths: feedback.strengths[locale], improvement: feedback.improvement[locale], why: feedback.why[locale], howTo: feedback.howTo[locale], tip: feedback.howTo[locale], improvedExample: feedback.strongerExample[locale], scoreExplanation: feedback.scoreExplanation[locale],
      }]));
      return {
        questionId: entry.questionId || `answer-${index + 1}`, question: entry.question, questionText: entry.questionText || null, skipped,
        score: skipped ? 0 : analysis.score, strengths: skipped ? [] : feedback.strengths.en, improvement: skipped ? skippedTip.en : feedback.improvement.en,
        why: skipped ? skippedTip.en : feedback.why.en, howTo: skipped ? skippedTip.en : feedback.howTo.en,
        tip: skipped ? skippedTip.en : feedback.howTo.en, improvedExample: feedback.strongerExample.en,
        scoreExplanation: feedback.scoreExplanation.en, translation,
        observations: { wordCount: analysis.wordCount, fillerCount: analysis.fillerCount, starHits: analysis.starHits, ownership: analysis.ownership, specificity: analysis.specificity, relevance: analysis.relevance, roleEvidence: analysis.roleEvidence },
      };
    });
    return {
      overallScore: Math.round(avgScore), completedAnswers: answered, plannedQuestions: planned, isPartial: Boolean(opts.isPartial),
      strongestSkill: translations.en.strengths[0], biggestImprovement: translations.en.weaknesses[0], summary: translations.en.summary,
      strengths: translations.en.strengths, weaknesses: translations.en.weaknesses, englishFeedback: translations.en.englishFeedback, nextSteps: translations.en.nextSteps, translations, metrics, perQuestion,
    };
  }

  function isCompleteAITranslation(value) {
    return value && typeof value === "object" && LOCALES.every((locale) => value[locale] && typeof value[locale] === "object");
  }

  function mergeAIReport(localReport, aiReport) {
    if (!aiReport) return localReport;
    const result = { ...localReport };
    if (isCompleteAITranslation(aiReport.translations)) {
      ["summary", "strengths", "weaknesses", "englishFeedback", "nextSteps"].forEach((key) => {
        if (aiReport[key] && (Array.isArray(aiReport[key]) ? aiReport[key].length : true)) result[key] = aiReport[key];
      });
      LOCALES.forEach((locale) => { result.translations[locale] = { ...result.translations[locale], ...aiReport.translations[locale] }; });
    }
    const byId = new Map((aiReport.perQuestion || []).filter((item) => item && isCompleteAITranslation(item.translation)).map((item) => [item.questionId, item]));
    result.perQuestion = result.perQuestion.map((item) => {
      const aiItem = byId.get(item.questionId);
      return aiItem ? { ...item, ...aiItem, translation: { ...item.translation, ...aiItem.translation } } : item;
    });
    return result;
  }

  IQ.feedback = { analyzeAnswer, buildImmediateFeedback, buildImprovedExample: (context, analysis, locale) => buildExample(analysis || analyzeAnswer("", context), context, locale || "en"), buildReport, mergeAIReport, COPY };
})();

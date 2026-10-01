/* ===========================================================
   Interview Quest — local interface and translation utilities
   All language preferences stay in this browser's localStorage.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const STORAGE_KEY = "interviewQuestLanguagePreferences";
  const LANGUAGE_ORDER = ["en", "ar", "es", "fr", "de", "hi"];
  const LANGUAGES = Object.freeze({
    en: { id: "en", label: "English", nativeLabel: "English", bcp47: "en-US", dir: "ltr", interviewSupported: true },
    ar: { id: "ar", label: "Arabic", nativeLabel: "العربية", bcp47: "ar-SA", dir: "rtl", interviewSupported: false },
    es: { id: "es", label: "Spanish", nativeLabel: "Español", bcp47: "es-ES", dir: "ltr", interviewSupported: false },
    fr: { id: "fr", label: "French", nativeLabel: "Français", bcp47: "fr-FR", dir: "ltr", interviewSupported: false },
    de: { id: "de", label: "German", nativeLabel: "Deutsch", bcp47: "de-DE", dir: "ltr", interviewSupported: false },
    hi: { id: "hi", label: "Hindi", nativeLabel: "हिन्दी", bcp47: "hi-IN", dir: "ltr", interviewSupported: false },
  });

  const DEFAULT_PREFERENCES = Object.freeze({ interfaceLanguage: "en", translationLanguage: "ar", interviewLanguage: "en" });

  const CATALOG = {
    en: {
      appTagline: "Practice a real job interview, out loud.", jobField: "Job field", difficulty: "Difficulty", interviewer: "Interviewer",
      interviewStyle: "Interviewer style", mode: "Mode", interfaceLanguage: "Interface language", translationLanguage: "Translation language",
      interviewLanguage: "Interview language", English: "English", startInterview: "Start Interview", loadExample: "Preview an example report",
      subtitles: "Translated subtitles", showTranslation: "Show translation", hideTranslation: "Hide translation", yourTurn: "Your turn",
      speaking: "Speaking", listening: "Listening", thinking: "Thinking", processing: "Processing", startAnswer: "Start Answer",
      stopAnswer: "Stop Answer", finishAnswer: "Finish Answer", skipQuestion: "Skip Question", repeatQuestion: "Repeat Question", endInterview: "End Interview",
      EnglishOnly: "English is the reliable practice and scoring language in this version.", original: "Original", translation: "Translation",
      learningOnly: "For learning only — not a real hiring assessment.", trainingReport: "Training Report", partialReport: "Partial practice report",
      strengths: "Strengths", areasToPractice: "Areas to practice", questionByQuestion: "Question by question", nextSteps: "Suggested next steps",
      answerOriginal: "Your original response", translationUnavailable: "A translation is not available for this item yet.", interviewProgress: "Interview progress",
      practiceMode: "Practice Mode", realMode: "Real Interview Mode", demoSpeed: "Demo speed", roleQuestion: "Candidate questions & closing",
      setupDescription: "Speak your answers, hear Sarah or David respond, and get coached on English and answer structure.", modeExplanation: "Practice gives concise feedback between answers. Real Interview Mode keeps coaching for the final report.", demoSpeedDetail: " — fewer questions and short timers", practiceFeedback: "Practice feedback", applyBeforeNext: "Apply this before the next question", whatWentWell: "What went well", improveNext: "Improve next", practicalTip: "Practical tip", continueInterview: "Continue Interview", retryAnswer: "Improve / Retry Answer", hearFeedback: "Hear feedback", quickTip: "Quick tip", interviewSignals: "Interview practice signals", signalsNote: "These transparent learning indicators reflect the structure of your responses, not hiring suitability.", communicationFeedback: "Communication & language feedback", practiceAgain: "Practice again", backToMenu: "Back to menu", completed: "Completed", coachTip: "Coach tip", strongerExample: "Example of a stronger answer", skipped: "Skipped", followUp: "Follow-up", words: "words", questions: "questions", fillers: "fillers", roleFocus: "Role focus", preparingReport: "Preparing your training report…", voiceUnavailable: "The question is visible on screen, so you can continue without audio.", typingAvailable: "Your answer stays editable. Start recording or type when ready.", speakFallback: "Speech recognition is unavailable in this browser. Type your English answer instead.",
    },
    ar: {
      appTagline: "تدرّب على مقابلة عمل حقيقية بصوتك.", jobField: "المجال الوظيفي", difficulty: "المستوى", interviewer: "المحاور",
      interviewStyle: "أسلوب المحاور", mode: "الوضع", interfaceLanguage: "لغة الواجهة", translationLanguage: "لغة الترجمة",
      interviewLanguage: "لغة المقابلة", English: "الإنجليزية", startInterview: "ابدأ المقابلة", loadExample: "عرض تقرير نموذجي",
      subtitles: "ترجمة فرعية", showTranslation: "إظهار الترجمة", hideTranslation: "إخفاء الترجمة", yourTurn: "دورك",
      speaking: "يتحدث", listening: "يستمع", thinking: "يفكر", processing: "يعالج", startAnswer: "ابدأ الإجابة",
      stopAnswer: "أوقف الإجابة", finishAnswer: "أنهِ الإجابة", skipQuestion: "تخطي السؤال", repeatQuestion: "أعد السؤال", endInterview: "إنهاء المقابلة",
      EnglishOnly: "الإنجليزية هي لغة التدريب والتقييم الموثوقة في هذه النسخة.", original: "النص الأصلي", translation: "الترجمة",
      learningOnly: "للتعلم فقط — ليس تقييماً حقيقياً للتوظيف.", trainingReport: "تقرير التدريب", partialReport: "تقرير ممارسة جزئي",
      strengths: "نقاط القوة", areasToPractice: "مجالات للتدرب", questionByQuestion: "سؤال بسؤال", nextSteps: "الخطوات المقترحة التالية",
      answerOriginal: "إجابتك الأصلية", translationUnavailable: "لا تتوفر ترجمة لهذا العنصر بعد.", interviewProgress: "تقدم المقابلة",
      practiceMode: "وضع التدريب", realMode: "وضع المقابلة الحقيقية", demoSpeed: "سرعة العرض", roleQuestion: "أسئلة المرشح والختام",
      setupDescription: "تحدث بإجاباتك، واستمع إلى سارة أو ديفيد، واحصل على تدريب في الإنجليزية وبنية الإجابة.", modeExplanation: "يقدم وضع التدريب ملاحظات موجزة بين الإجابات. أما وضع المقابلة الحقيقية فيحتفظ بالتدريب للتقرير النهائي.", demoSpeedDetail: " — أسئلة أقل ومؤقتات قصيرة", practiceFeedback: "ملاحظات التدريب", applyBeforeNext: "طبّق ذلك قبل السؤال التالي", whatWentWell: "ما الذي سار جيداً", improveNext: "ما الذي يمكن تحسينه", practicalTip: "نصيحة عملية", continueInterview: "متابعة المقابلة", retryAnswer: "حسّن / أعد المحاولة", hearFeedback: "استمع إلى الملاحظات", quickTip: "نصيحة سريعة", interviewSignals: "مؤشرات ممارسة المقابلة", signalsNote: "تعكس مؤشرات التعلم الواضحة هذه بنية إجاباتك، وليست ملاءمتك للتوظيف.", communicationFeedback: "ملاحظات التواصل واللغة", practiceAgain: "تدرّب مرة أخرى", backToMenu: "العودة إلى القائمة", completed: "مكتمل", coachTip: "نصيحة المدرب", strongerExample: "مثال على إجابة أقوى", skipped: "تم التخطي", followUp: "سؤال متابعة", words: "كلمات", questions: "أسئلة", fillers: "كلمات حشو", roleFocus: "تركيز الوظيفة", preparingReport: "جارٍ إعداد تقرير التدريب…", voiceUnavailable: "السؤال ظاهر على الشاشة، ويمكنك المتابعة من دون صوت.", typingAvailable: "تبقى إجابتك قابلة للتحرير. ابدأ التسجيل أو اكتب عندما تكون جاهزاً.", speakFallback: "التعرف على الكلام غير متاح في هذا المتصفح. اكتب إجابتك الإنجليزية بدلاً من ذلك.",
    },
    es: {
      appTagline: "Practica una entrevista de trabajo real en voz alta.", jobField: "Área laboral", difficulty: "Dificultad", interviewer: "Entrevistador",
      interviewStyle: "Estilo del entrevistador", mode: "Modo", interfaceLanguage: "Idioma de la interfaz", translationLanguage: "Idioma de traducción",
      interviewLanguage: "Idioma de la entrevista", English: "Inglés", startInterview: "Iniciar entrevista", loadExample: "Ver informe de ejemplo",
      subtitles: "Subtítulos traducidos", showTranslation: "Mostrar traducción", hideTranslation: "Ocultar traducción", yourTurn: "Tu turno",
      speaking: "Hablando", listening: "Escuchando", thinking: "Pensando", processing: "Procesando", startAnswer: "Empezar respuesta",
      stopAnswer: "Detener respuesta", finishAnswer: "Terminar respuesta", skipQuestion: "Saltar pregunta", repeatQuestion: "Repetir pregunta", endInterview: "Terminar entrevista",
      EnglishOnly: "El inglés es el idioma fiable de práctica y evaluación en esta versión.", original: "Original", translation: "Traducción",
      learningOnly: "Solo para aprender; no es una evaluación real de contratación.", trainingReport: "Informe de entrenamiento", partialReport: "Informe parcial de práctica",
      strengths: "Fortalezas", areasToPractice: "Áreas para practicar", questionByQuestion: "Pregunta por pregunta", nextSteps: "Próximos pasos sugeridos",
      answerOriginal: "Tu respuesta original", translationUnavailable: "La traducción aún no está disponible para este elemento.", interviewProgress: "Progreso de la entrevista",
      practiceMode: "Modo práctica", realMode: "Modo entrevista real", demoSpeed: "Velocidad de demostración", roleQuestion: "Preguntas del candidato y cierre",
      setupDescription: "Di tus respuestas, escucha a Sarah o David y recibe orientación sobre inglés y estructura de respuesta.", modeExplanation: "La práctica ofrece comentarios breves entre respuestas. El modo entrevista real reserva la orientación para el informe final.", demoSpeedDetail: " — menos preguntas y temporizadores breves", practiceFeedback: "Comentarios de práctica", applyBeforeNext: "Aplícalo antes de la siguiente pregunta", whatWentWell: "Lo que salió bien", improveNext: "Mejora después", practicalTip: "Consejo práctico", continueInterview: "Continuar entrevista", retryAnswer: "Mejorar / Reintentar respuesta", hearFeedback: "Escuchar comentarios", quickTip: "Consejo rápido", interviewSignals: "Indicadores de práctica", signalsNote: "Estos indicadores transparentes reflejan la estructura de tus respuestas, no la idoneidad para contratación.", communicationFeedback: "Comentarios de comunicación e idioma", practiceAgain: "Practicar de nuevo", backToMenu: "Volver al menú", completed: "Completado", coachTip: "Consejo del coach", strongerExample: "Ejemplo de una respuesta más sólida", skipped: "Omitida", followUp: "Seguimiento", words: "palabras", questions: "preguntas", fillers: "muletillas", roleFocus: "Enfoque del puesto", preparingReport: "Preparando tu informe de entrenamiento…", voiceUnavailable: "La pregunta está visible en pantalla; puedes continuar sin audio.", typingAvailable: "Tu respuesta sigue siendo editable. Graba o escribe cuando estés listo.", speakFallback: "El reconocimiento de voz no está disponible en este navegador. Escribe tu respuesta en inglés.",
    },
    fr: {
      appTagline: "Entraînez-vous à un vrai entretien d'embauche à voix haute.", jobField: "Domaine professionnel", difficulty: "Difficulté", interviewer: "Recruteur",
      interviewStyle: "Style du recruteur", mode: "Mode", interfaceLanguage: "Langue de l'interface", translationLanguage: "Langue de traduction",
      interviewLanguage: "Langue de l'entretien", English: "Anglais", startInterview: "Commencer l'entretien", loadExample: "Voir un rapport exemple",
      subtitles: "Sous-titres traduits", showTranslation: "Afficher la traduction", hideTranslation: "Masquer la traduction", yourTurn: "À vous",
      speaking: "Parle", listening: "Écoute", thinking: "Réfléchit", processing: "Traitement", startAnswer: "Commencer la réponse",
      stopAnswer: "Arrêter la réponse", finishAnswer: "Terminer la réponse", skipQuestion: "Passer la question", repeatQuestion: "Répéter la question", endInterview: "Terminer l'entretien",
      EnglishOnly: "L'anglais est la langue fiable de pratique et d'évaluation dans cette version.", original: "Original", translation: "Traduction",
      learningOnly: "Outil d'apprentissage uniquement — pas une évaluation réelle de recrutement.", trainingReport: "Rapport d'entraînement", partialReport: "Rapport de pratique partiel",
      strengths: "Points forts", areasToPractice: "Points à travailler", questionByQuestion: "Question par question", nextSteps: "Prochaines étapes suggérées",
      answerOriginal: "Votre réponse originale", translationUnavailable: "La traduction n'est pas encore disponible pour cet élément.", interviewProgress: "Progression de l'entretien",
      practiceMode: "Mode entraînement", realMode: "Mode entretien réel", demoSpeed: "Vitesse de démonstration", roleQuestion: "Questions du candidat et conclusion",
      setupDescription: "Répondez à voix haute, écoutez Sarah ou David et recevez un accompagnement sur l'anglais et la structure de réponse.", modeExplanation: "L'entraînement donne un retour concis entre les réponses. Le mode entretien réel réserve le coaching au rapport final.", demoSpeedDetail: " — moins de questions et minuteries courtes", practiceFeedback: "Retour d'entraînement", applyBeforeNext: "Appliquez ceci avant la prochaine question", whatWentWell: "Ce qui a bien fonctionné", improveNext: "À améliorer ensuite", practicalTip: "Conseil pratique", continueInterview: "Continuer l'entretien", retryAnswer: "Améliorer / Réessayer", hearFeedback: "Écouter le retour", quickTip: "Conseil rapide", interviewSignals: "Indicateurs d'entraînement", signalsNote: "Ces indicateurs transparents reflètent la structure de vos réponses, pas une aptitude à l'embauche.", communicationFeedback: "Retour sur la communication et la langue", practiceAgain: "S'entraîner à nouveau", backToMenu: "Retour au menu", completed: "Terminé", coachTip: "Conseil du coach", strongerExample: "Exemple de réponse plus solide", skipped: "Passée", followUp: "Suivi", words: "mots", questions: "questions", fillers: "mots de remplissage", roleFocus: "Focus du poste", preparingReport: "Préparation de votre rapport d'entraînement…", voiceUnavailable: "La question est visible à l'écran : vous pouvez continuer sans audio.", typingAvailable: "Votre réponse reste modifiable. Enregistrez ou écrivez quand vous êtes prêt.", speakFallback: "La reconnaissance vocale n'est pas disponible dans ce navigateur. Écrivez votre réponse en anglais.",
    },
    de: {
      appTagline: "Übe ein echtes Vorstellungsgespräch laut.", jobField: "Berufsfeld", difficulty: "Schwierigkeit", interviewer: "Interviewer",
      interviewStyle: "Interviewstil", mode: "Modus", interfaceLanguage: "Sprache der Oberfläche", translationLanguage: "Übersetzungssprache",
      interviewLanguage: "Sprache des Interviews", English: "Englisch", startInterview: "Interview starten", loadExample: "Beispielbericht ansehen",
      subtitles: "Übersetzte Untertitel", showTranslation: "Übersetzung anzeigen", hideTranslation: "Übersetzung ausblenden", yourTurn: "Du bist dran",
      speaking: "Spricht", listening: "Hört zu", thinking: "Denkt nach", processing: "Verarbeitet", startAnswer: "Antwort beginnen",
      stopAnswer: "Antwort stoppen", finishAnswer: "Antwort abschließen", skipQuestion: "Frage überspringen", repeatQuestion: "Frage wiederholen", endInterview: "Interview beenden",
      EnglishOnly: "Englisch ist in dieser Version die zuverlässige Übungs- und Bewertungssprache.", original: "Original", translation: "Übersetzung",
      learningOnly: "Nur zum Lernen — keine echte Einstellungsbewertung.", trainingReport: "Trainingsbericht", partialReport: "Teilweiser Übungsbericht",
      strengths: "Stärken", areasToPractice: "Übungsbereiche", questionByQuestion: "Frage für Frage", nextSteps: "Empfohlene nächste Schritte",
      answerOriginal: "Deine ursprüngliche Antwort", translationUnavailable: "Für diesen Eintrag ist noch keine Übersetzung verfügbar.", interviewProgress: "Interviewfortschritt",
      practiceMode: "Übungsmodus", realMode: "Echter Interviewmodus", demoSpeed: "Demo-Geschwindigkeit", roleQuestion: "Fragen des Bewerbers und Abschluss",
      setupDescription: "Sprich deine Antworten, höre Sarah oder David zu und erhalte Coaching zu Englisch und Antwortstruktur.", modeExplanation: "Im Übungsmodus erhältst du kurze Rückmeldungen zwischen Antworten. Im echten Interviewmodus gibt es Coaching erst im Abschlussbericht.", demoSpeedDetail: " — weniger Fragen und kurze Timer", practiceFeedback: "Übungsfeedback", applyBeforeNext: "Wende dies vor der nächsten Frage an", whatWentWell: "Das lief gut", improveNext: "Als Nächstes verbessern", practicalTip: "Praktischer Tipp", continueInterview: "Interview fortsetzen", retryAnswer: "Verbessern / erneut versuchen", hearFeedback: "Feedback anhören", quickTip: "Kurzer Tipp", interviewSignals: "Übungsindikatoren", signalsNote: "Diese transparenten Lernindikatoren spiegeln die Struktur deiner Antworten wider, nicht deine Eignung für eine Einstellung.", communicationFeedback: "Kommunikations- und Sprachfeedback", practiceAgain: "Erneut üben", backToMenu: "Zurück zum Menü", completed: "Abgeschlossen", coachTip: "Coaching-Tipp", strongerExample: "Beispiel für eine stärkere Antwort", skipped: "Übersprungen", followUp: "Rückfrage", words: "Wörter", questions: "Fragen", fillers: "Füllwörter", roleFocus: "Rollenfokus", preparingReport: "Dein Trainingsbericht wird vorbereitet…", voiceUnavailable: "Die Frage ist auf dem Bildschirm sichtbar; du kannst ohne Audio fortfahren.", typingAvailable: "Deine Antwort bleibt bearbeitbar. Starte die Aufnahme oder tippe, wenn du bereit bist.", speakFallback: "Spracherkennung ist in diesem Browser nicht verfügbar. Tippe stattdessen deine englische Antwort.",
    },
    hi: {
      appTagline: "एक वास्तविक नौकरी साक्षात्कार का ज़ोर से अभ्यास करें।", jobField: "कार्य क्षेत्र", difficulty: "कठिनाई", interviewer: "साक्षात्कारकर्ता",
      interviewStyle: "साक्षात्कार शैली", mode: "मोड", interfaceLanguage: "इंटरफ़ेस भाषा", translationLanguage: "अनुवाद भाषा",
      interviewLanguage: "साक्षात्कार भाषा", English: "अंग्रेज़ी", startInterview: "साक्षात्कार शुरू करें", loadExample: "उदाहरण रिपोर्ट देखें",
      subtitles: "अनुवादित उपशीर्षक", showTranslation: "अनुवाद दिखाएँ", hideTranslation: "अनुवाद छिपाएँ", yourTurn: "अब आपकी बारी",
      speaking: "बोल रहा है", listening: "सुन रहा है", thinking: "सोच रहा है", processing: "प्रक्रिया जारी है", startAnswer: "उत्तर शुरू करें",
      stopAnswer: "उत्तर रोकें", finishAnswer: "उत्तर पूरा करें", skipQuestion: "प्रश्न छोड़ें", repeatQuestion: "प्रश्न दोहराएँ", endInterview: "साक्षात्कार समाप्त करें",
      EnglishOnly: "इस संस्करण में अंग्रेज़ी विश्वसनीय अभ्यास और मूल्यांकन भाषा है।", original: "मूल", translation: "अनुवाद",
      learningOnly: "केवल सीखने के लिए — यह वास्तविक भर्ती मूल्यांकन नहीं है।", trainingReport: "प्रशिक्षण रिपोर्ट", partialReport: "आंशिक अभ्यास रिपोर्ट",
      strengths: "ताकतें", areasToPractice: "अभ्यास के क्षेत्र", questionByQuestion: "प्रश्न दर प्रश्न", nextSteps: "सुझाए गए अगले कदम",
      answerOriginal: "आपका मूल उत्तर", translationUnavailable: "इस सामग्री के लिए अनुवाद अभी उपलब्ध नहीं है।", interviewProgress: "साक्षात्कार की प्रगति",
      practiceMode: "अभ्यास मोड", realMode: "वास्तविक साक्षात्कार मोड", demoSpeed: "डेमो गति", roleQuestion: "उम्मीदवार के प्रश्न और समापन",
      setupDescription: "अपने उत्तर बोलें, सारा या डेविड को सुनें और अंग्रेज़ी व उत्तर संरचना पर कोचिंग पाएँ।", modeExplanation: "अभ्यास मोड उत्तरों के बीच संक्षिप्त प्रतिक्रिया देता है। वास्तविक साक्षात्कार मोड कोचिंग को अंतिम रिपोर्ट के लिए रखता है।", demoSpeedDetail: " — कम प्रश्न और छोटे टाइमर", practiceFeedback: "अभ्यास प्रतिक्रिया", applyBeforeNext: "अगले प्रश्न से पहले इसे लागू करें", whatWentWell: "क्या अच्छा हुआ", improveNext: "अगली बार सुधारें", practicalTip: "व्यावहारिक सुझाव", continueInterview: "साक्षात्कार जारी रखें", retryAnswer: "सुधारें / फिर प्रयास करें", hearFeedback: "प्रतिक्रिया सुनें", quickTip: "त्वरित सुझाव", interviewSignals: "साक्षात्कार अभ्यास संकेत", signalsNote: "ये पारदर्शी सीखने के संकेत आपके उत्तरों की संरचना दर्शाते हैं, नियुक्ति की उपयुक्तता नहीं।", communicationFeedback: "संचार और भाषा प्रतिक्रिया", practiceAgain: "फिर अभ्यास करें", backToMenu: "मेनू पर वापस जाएँ", completed: "पूर्ण", coachTip: "कोच सुझाव", strongerExample: "मजबूत उत्तर का उदाहरण", skipped: "छोड़ा गया", followUp: "अनुवर्ती प्रश्न", words: "शब्द", questions: "प्रश्न", fillers: "भराव शब्द", roleFocus: "भूमिका फोकस", preparingReport: "आपकी प्रशिक्षण रिपोर्ट तैयार की जा रही है…", voiceUnavailable: "प्रश्न स्क्रीन पर दिखाई दे रहा है; आप ऑडियो के बिना आगे बढ़ सकते हैं।", typingAvailable: "आपका उत्तर संपादन योग्य है। तैयार होने पर रिकॉर्ड करें या टाइप करें।", speakFallback: "इस ब्राउज़र में स्पीच रिकग्निशन उपलब्ध नहीं है। इसके बजाय अपना अंग्रेज़ी उत्तर टाइप करें।"
    },
  };

  function safeLanguage(value, fallback) {
    return LANGUAGES[value] ? value : fallback;
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        interfaceLanguage: safeLanguage(saved.interfaceLanguage, DEFAULT_PREFERENCES.interfaceLanguage),
        translationLanguage: safeLanguage(saved.translationLanguage, DEFAULT_PREFERENCES.translationLanguage),
        interviewLanguage: LANGUAGES[saved.interviewLanguage] && LANGUAGES[saved.interviewLanguage].interviewSupported ? saved.interviewLanguage : "en",
      };
    } catch (error) {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  let preferences = loadPreferences();

  function savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      /* The app remains usable if browser storage is unavailable. */
    }
  }

  function applyDocumentLanguage() {
    const language = LANGUAGES[preferences.interfaceLanguage];
    document.documentElement.lang = language.id;
    document.documentElement.dir = language.dir;
  }

  function setPreference(key, value) {
    if (key === "interviewLanguage" && (!LANGUAGES[value] || !LANGUAGES[value].interviewSupported)) return false;
    if (key !== "interviewLanguage" && !LANGUAGES[value]) return false;
    preferences = { ...preferences, [key]: value };
    savePreferences();
    if (key === "interfaceLanguage") applyDocumentLanguage();
    return true;
  }

  function t(key, variables, locale) {
    const language = safeLanguage(locale || preferences.interfaceLanguage, "en");
    let value = (CATALOG[language] && CATALOG[language][key]) || CATALOG.en[key] || key;
    Object.keys(variables || {}).forEach((name) => {
      value = value.replace(new RegExp("\\{" + name + "\\}", "g"), String(variables[name]));
    });
    return value;
  }

  function getText(value, locale) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "";
    const language = safeLanguage(locale || preferences.translationLanguage, "en");
    return value[language] || value.en || "";
  }

  function hasTranslation(value, locale) {
    const language = safeLanguage(locale || preferences.translationLanguage, "en");
    return Boolean(value && typeof value === "object" && value[language] && language !== "en");
  }

  applyDocumentLanguage();

  IQ.i18n = {
    LANGUAGES,
    LANGUAGE_ORDER,
    CATALOG,
    get preferences() { return { ...preferences }; },
    getLanguage: (id) => LANGUAGES[safeLanguage(id, "en")],
    t,
    getText,
    hasTranslation,
    setInterfaceLanguage: (value) => setPreference("interfaceLanguage", value),
    setTranslationLanguage: (value) => setPreference("translationLanguage", value),
    setInterviewLanguage: (value) => setPreference("interviewLanguage", value),
    applyDocumentLanguage,
  };
})();

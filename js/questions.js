/* ===========================================================
   Interview Quest — staged, multilingual interview plans
   Main questions are deterministic. AI may add one bounded follow-up
   but never controls the next main interview stage.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const LOCALES = ["en", "ar", "es", "fr", "de", "hi"];
  const STAGES = ["introduction", "background", "role", "behavioral", "challenge", "impact", "growth", "closing"];
  const STAGE_LABELS = {
    introduction: { en: "Introduction", ar: "المقدمة", es: "Presentación", fr: "Présentation", de: "Einführung", hi: "परिचय" },
    background: { en: "Background", ar: "الخلفية", es: "Experiencia", fr: "Parcours", de: "Werdegang", hi: "पृष्ठभूमि" },
    role: { en: "Role skills", ar: "مهارات الوظيفة", es: "Habilidades del puesto", fr: "Compétences du poste", de: "Fachkenntnisse", hi: "भूमिका कौशल" },
    behavioral: { en: "Collaboration", ar: "التعاون", es: "Colaboración", fr: "Collaboration", de: "Zusammenarbeit", hi: "सहयोग" },
    challenge: { en: "Problem solving", ar: "حل المشكلات", es: "Resolución de problemas", fr: "Résolution de problèmes", de: "Problemlösung", hi: "समस्या समाधान" },
    impact: { en: "Impact", ar: "الأثر", es: "Impacto", fr: "Impact", de: "Wirkung", hi: "प्रभाव" },
    growth: { en: "Growth", ar: "التطور", es: "Crecimiento", fr: "Évolution", de: "Weiterentwicklung", hi: "विकास" },
    closing: { en: "Closing", ar: "الختام", es: "Cierre", fr: "Conclusion", de: "Abschluss", hi: "समापन" },
  };

  const DIFFICULTIES = [
    { id: "easy", label: "Easy", questionCount: 4, followUpBudget: 1 },
    { id: "medium", label: "Medium", questionCount: 6, followUpBudget: 2 },
    { id: "hard", label: "Hard", questionCount: 8, followUpBudget: 3 },
  ];

  function local(en, ar, es, fr, de, hi) {
    return { en, ar, es, fr, de, hi };
  }

  const CAREER_SEEDS = [
    ["general", local("General / Any Job", "عام / أي وظيفة", "General / Cualquier empleo", "Général / Tout emploi", "Allgemein / Jeder Beruf", "सामान्य / कोई भी नौकरी"),
      local("a work or study experience that prepared you for this opportunity", "تجربة عمل أو دراسة أعدتك لهذه الفرصة", "una experiencia de trabajo o estudio que te preparó para esta oportunidad", "une expérience professionnelle ou d'études qui vous a préparé à cette occasion", "eine Arbeits- oder Studienerfahrung, die dich auf diese Gelegenheit vorbereitet hat", "काम या पढ़ाई का ऐसा अनुभव जिसने आपको इस अवसर के लिए तैयार किया"),
      local("a difficult work problem", "مشكلة عمل صعبة", "un problema laboral difícil", "un problème de travail difficile", "ein schwieriges Arbeitsproblem", "काम की एक कठिन समस्या"),
      local("the value you created for a team, customer, or project", "القيمة التي قدمتها لفريق أو عميل أو مشروع", "el valor que aportaste a un equipo, cliente o proyecto", "la valeur que vous avez apportée à une équipe, un client ou un projet", "den Wert, den du für ein Team, einen Kunden oder ein Projekt geschaffen hast", "वह मूल्य जो आपने टीम, ग्राहक या प्रोजेक्ट के लिए बनाया")],
    ["software-engineering", local("Software Engineering", "هندسة البرمجيات", "Ingeniería de software", "Ingénierie logicielle", "Softwareentwicklung", "सॉफ्टवेयर इंजीनियरिंग"),
      local("a software project you built or improved", "مشروع برمجي أنشأته أو حسّنته", "un proyecto de software que desarrollaste o mejoraste", "un projet logiciel que vous avez créé ou amélioré", "ein Softwareprojekt, das du entwickelt oder verbessert hast", "एक सॉफ्टवेयर प्रोजेक्ट जिसे आपने बनाया या बेहतर किया"),
      local("a difficult bug or technical trade-off", "خطأ برمجي صعب أو مفاضلة تقنية", "un error difícil o una decisión técnica", "un bug difficile ou un compromis technique", "einen schwierigen Fehler oder technischen Zielkonflikt", "एक कठिन बग या तकनीकी समझौता"),
      local("the reliability, usability, or delivery impact of your work", "أثر عملك على الموثوقية أو سهولة الاستخدام أو التسليم", "el impacto de tu trabajo en fiabilidad, usabilidad o entrega", "l'impact de votre travail sur la fiabilité, l'ergonomie ou la livraison", "die Auswirkung deiner Arbeit auf Zuverlässigkeit, Nutzbarkeit oder Lieferung", "आपके काम का विश्वसनीयता, उपयोगिता या डिलीवरी पर प्रभाव")],
    ["information-systems", local("Information Systems", "نظم المعلومات", "Sistemas de información", "Systèmes d'information", "Informationssysteme", "सूचना प्रणाली"),
      local("an information system or process you supported or improved", "نظام معلومات أو عملية دعمتها أو حسّنتها", "un sistema de información o proceso que apoyaste o mejoraste", "un système d'information ou processus que vous avez soutenu ou amélioré", "ein Informationssystem oder einen Prozess, den du unterstützt oder verbessert hast", "एक सूचना प्रणाली या प्रक्रिया जिसे आपने समर्थित या बेहतर किया"),
      local("a systems, data, or stakeholder challenge", "تحدياً في الأنظمة أو البيانات أو أصحاب المصلحة", "un reto de sistemas, datos o partes interesadas", "un défi lié aux systèmes, aux données ou aux parties prenantes", "eine Herausforderung bei Systemen, Daten oder Stakeholdern", "सिस्टम, डेटा या हितधारकों से जुड़ी चुनौती"),
      local("how your work made information more useful or reliable", "كيف جعل عملك المعلومات أكثر فائدة أو موثوقية", "cómo tu trabajo hizo que la información fuera más útil o fiable", "comment votre travail a rendu l'information plus utile ou fiable", "wie deine Arbeit Informationen nützlicher oder zuverlässiger machte", "आपके काम ने जानकारी को अधिक उपयोगी या विश्वसनीय कैसे बनाया")],
    ["cybersecurity", local("Cybersecurity", "الأمن السيبراني", "Ciberseguridad", "Cybersécurité", "Cybersicherheit", "साइबर सुरक्षा"),
      local("a security, risk, or awareness project you worked on", "مشروع أمن أو مخاطر أو توعية عملت عليه", "un proyecto de seguridad, riesgos o concienciación en el que trabajaste", "un projet de sécurité, de risque ou de sensibilisation auquel vous avez participé", "ein Sicherheits-, Risiko- oder Awareness-Projekt, an dem du gearbeitet hast", "एक सुरक्षा, जोखिम या जागरूकता प्रोजेक्ट जिस पर आपने काम किया"),
      local("a security issue where you had to balance urgency and accuracy", "مشكلة أمنية اضطررت فيها لموازنة السرعة والدقة", "un problema de seguridad en el que equilibraste urgencia y precisión", "un problème de sécurité où vous avez équilibré urgence et précision", "ein Sicherheitsproblem, bei dem du Dringlichkeit und Genauigkeit abwägen musstest", "एक सुरक्षा समस्या जिसमें आपको तात्कालिकता और सटीकता का संतुलन बनाना पड़ा"),
      local("how your actions reduced risk or improved safe behavior", "كيف قللت أفعالك المخاطر أو حسّنت السلوك الآمن", "cómo tus acciones redujeron el riesgo o mejoraron conductas seguras", "comment vos actions ont réduit le risque ou amélioré les pratiques sûres", "wie deine Maßnahmen Risiken verringerten oder sicheres Verhalten verbesserten", "आपके कार्यों ने जोखिम कम किया या सुरक्षित व्यवहार बेहतर बनाया")],
    ["ai-machine-learning", local("Artificial Intelligence / Machine Learning", "الذكاء الاصطناعي / تعلم الآلة", "Inteligencia artificial / aprendizaje automático", "Intelligence artificielle / apprentissage automatique", "Künstliche Intelligenz / Maschinelles Lernen", "कृत्रिम बुद्धिमत्ता / मशीन लर्निंग"),
      local("an AI, machine-learning, or data project you explored", "مشروع ذكاء اصطناعي أو تعلم آلة أو بيانات استكشفته", "un proyecto de IA, aprendizaje automático o datos que exploraste", "un projet d'IA, d'apprentissage automatique ou de données que vous avez exploré", "ein KI-, Machine-Learning- oder Datenprojekt, das du untersucht hast", "एक AI, मशीन लर्निंग या डेटा प्रोजेक्ट जिसे आपने खोजा"),
      local("a model, data-quality, or evaluation challenge", "تحدياً في النموذج أو جودة البيانات أو التقييم", "un reto de modelo, calidad de datos o evaluación", "un défi de modèle, de qualité des données ou d'évaluation", "eine Herausforderung bei Modell, Datenqualität oder Bewertung", "मॉडल, डेटा गुणवत्ता या मूल्यांकन से जुड़ी चुनौती"),
      local("how you measured useful and responsible results", "كيف قست نتائج مفيدة ومسؤولة", "cómo mediste resultados útiles y responsables", "comment vous avez mesuré des résultats utiles et responsables", "wie du nützliche und verantwortungsvolle Ergebnisse gemessen hast", "आपने उपयोगी और जिम्मेदार परिणामों को कैसे मापा")],
    ["data-analysis", local("Data Analysis / Data Science", "تحليل البيانات / علم البيانات", "Análisis de datos / ciencia de datos", "Analyse de données / science des données", "Datenanalyse / Data Science", "डेटा विश्लेषण / डेटा विज्ञान"),
      local("an analysis or dashboard that helped someone make a decision", "تحليلاً أو لوحة معلومات ساعدت شخصاً على اتخاذ قرار", "un análisis o panel que ayudó a alguien a tomar una decisión", "une analyse ou un tableau de bord qui a aidé quelqu'un à prendre une décision", "eine Analyse oder ein Dashboard, das jemandem bei einer Entscheidung half", "एक विश्लेषण या डैशबोर्ड जिसने किसी को निर्णय लेने में मदद की"),
      local("a messy-data or interpretation challenge", "تحدياً في البيانات غير المنظمة أو التفسير", "un reto de datos desordenados o interpretación", "un défi de données désordonnées ou d'interprétation", "eine Herausforderung mit unübersichtlichen Daten oder deren Interpretation", "अव्यवस्थित डेटा या व्याख्या से जुड़ी चुनौती"),
      local("how your insight changed a decision or outcome", "كيف غيّرت رؤيتك قراراً أو نتيجة", "cómo tu hallazgo cambió una decisión o resultado", "comment votre analyse a modifié une décision ou un résultat", "wie deine Erkenntnis eine Entscheidung oder ein Ergebnis verändert hat", "आपकी अंतर्दृष्टि ने निर्णय या परिणाम को कैसे बदला")],
    ["it-support", local("IT Support", "الدعم التقني", "Soporte de TI", "Support informatique", "IT-Support", "आईटी सहायता"),
      local("a time you helped someone solve a technical problem", "وقتاً ساعدت فيه شخصاً على حل مشكلة تقنية", "una ocasión en la que ayudaste a alguien a resolver un problema técnico", "un moment où vous avez aidé quelqu'un à résoudre un problème technique", "eine Situation, in der du jemandem bei einem technischen Problem geholfen hast", "एक समय जब आपने किसी को तकनीकी समस्या हल करने में मदद की"),
      local("a technical issue that required careful troubleshooting", "مشكلة تقنية تطلبت استكشاف أخطاء دقيقاً", "un problema técnico que requirió una investigación cuidadosa", "un problème technique qui a exigé un diagnostic attentif", "ein technisches Problem, das sorgfältige Fehlersuche erforderte", "एक तकनीकी समस्या जिसके लिए सावधानीपूर्वक समाधान खोजने की जरूरत थी"),
      local("how your support improved a user's experience or uptime", "كيف حسّن دعمك تجربة المستخدم أو وقت التشغيل", "cómo tu apoyo mejoró la experiencia del usuario o el tiempo de actividad", "comment votre support a amélioré l'expérience utilisateur ou la disponibilité", "wie dein Support die Nutzererfahrung oder Verfügbarkeit verbesserte", "आपकी सहायता ने उपयोगकर्ता अनुभव या अपटाइम कैसे बेहतर किया")],
    ["product-management", local("Product Management", "إدارة المنتجات", "Gestión de producto", "Gestion de produit", "Produktmanagement", "उत्पाद प्रबंधन"),
      local("a product idea, discovery exercise, or feature you shaped", "فكرة منتج أو بحثاً أو ميزة ساهمت في تشكيلها", "una idea de producto, investigación o función que ayudaste a definir", "une idée produit, une recherche ou une fonctionnalité que vous avez contribué à définir", "eine Produktidee, Recherche oder Funktion, die du mitgestaltet hast", "एक उत्पाद विचार, खोज प्रक्रिया या फीचर जिसे आपने आकार दिया"),
      local("a prioritization or stakeholder-alignment challenge", "تحدياً في تحديد الأولويات أو مواءمة أصحاب المصلحة", "un reto de priorización o alineación de partes interesadas", "un défi de priorisation ou d'alignement des parties prenantes", "eine Herausforderung bei Priorisierung oder Stakeholder-Abstimmung", "प्राथमिकता या हितधारक समन्वय से जुड़ी चुनौती"),
      local("how you connected a customer need to a measurable outcome", "كيف ربطت حاجة العميل بنتيجة قابلة للقياس", "cómo conectaste una necesidad del cliente con un resultado medible", "comment vous avez relié un besoin client à un résultat mesurable", "wie du ein Kundenbedürfnis mit einem messbaren Ergebnis verbunden hast", "आपने ग्राहक की जरूरत को मापने योग्य परिणाम से कैसे जोड़ा")],
    ["project-management", local("Project Management", "إدارة المشاريع", "Gestión de proyectos", "Gestion de projet", "Projektmanagement", "परियोजना प्रबंधन"),
      local("a project you planned, coordinated, or delivered", "مشروعاً خططت له أو نسقته أو سلمته", "un proyecto que planificaste, coordinaste o entregaste", "un projet que vous avez planifié, coordonné ou livré", "ein Projekt, das du geplant, koordiniert oder geliefert hast", "एक प्रोजेक्ट जिसे आपने योजनाबद्ध, समन्वित या पूरा किया"),
      local("a scope, deadline, or communication challenge", "تحدياً في النطاق أو الموعد النهائي أو التواصل", "un reto de alcance, plazo o comunicación", "un défi de périmètre, de délai ou de communication", "eine Herausforderung bei Umfang, Frist oder Kommunikation", "दायरे, समयसीमा या संचार से जुड़ी चुनौती"),
      local("how you kept people aligned and moved work forward", "كيف حافظت على توافق الأشخاص ودفعت العمل إلى الأمام", "cómo mantuviste a las personas alineadas e impulsaste el trabajo", "comment vous avez maintenu l'alignement et fait avancer le travail", "wie du Menschen abgestimmt und die Arbeit vorangebracht hast", "आपने लोगों को कैसे समन्वित रखा और काम आगे बढ़ाया")],
    ["marketing", local("Marketing", "التسويق", "Marketing", "Marketing", "Marketing", "विपणन"),
      local("a campaign, audience insight, or message you developed", "حملة أو رؤية للجمهور أو رسالة طورتها", "una campaña, idea de audiencia o mensaje que desarrollaste", "une campagne, une connaissance de l'audience ou un message que vous avez développé", "eine Kampagne, Zielgruppen-Erkenntnis oder Botschaft, die du entwickelt hast", "एक अभियान, दर्शक अंतर्दृष्टि या संदेश जिसे आपने विकसित किया"),
      local("a campaign result that did not go as expected", "نتيجة حملة لم تسر كما توقعت", "un resultado de campaña que no salió como esperabas", "un résultat de campagne qui ne s'est pas déroulé comme prévu", "ein Kampagnenergebnis, das nicht wie erwartet ausfiel", "एक अभियान परिणाम जो उम्मीद के अनुसार नहीं आया"),
      local("how you used feedback or data to improve results", "كيف استخدمت الملاحظات أو البيانات لتحسين النتائج", "cómo usaste comentarios o datos para mejorar los resultados", "comment vous avez utilisé les retours ou les données pour améliorer les résultats", "wie du Feedback oder Daten genutzt hast, um Ergebnisse zu verbessern", "आपने परिणाम सुधारने के लिए फीडबैक या डेटा का उपयोग कैसे किया")],
    ["finance-accounting", local("Finance / Accounting", "المالية / المحاسبة", "Finanzas / contabilidad", "Finance / comptabilité", "Finanzen / Buchhaltung", "वित्त / लेखांकन"),
      local("a financial, accounting, or reporting task you handled", "مهمة مالية أو محاسبية أو إعداد تقارير توليتها", "una tarea financiera, contable o de informes que gestionaste", "une tâche financière, comptable ou de reporting que vous avez gérée", "eine Finanz-, Buchhaltungs- oder Reporting-Aufgabe, die du bearbeitet hast", "एक वित्तीय, लेखांकन या रिपोर्टिंग कार्य जिसे आपने संभाला"),
      local("an accuracy, deadline, or reconciliation challenge", "تحدياً في الدقة أو الموعد النهائي أو المطابقة", "un reto de exactitud, plazo o conciliación", "un défi d'exactitude, de délai ou de rapprochement", "eine Herausforderung bei Genauigkeit, Frist oder Abstimmung", "सटीकता, समयसीमा या मिलान से जुड़ी चुनौती"),
      local("how your work supported a sound financial decision", "كيف دعم عملك قراراً مالياً سليماً", "cómo tu trabajo respaldó una buena decisión financiera", "comment votre travail a soutenu une décision financière solide", "wie deine Arbeit eine fundierte Finanzentscheidung unterstützte", "आपके काम ने एक ठोस वित्तीय निर्णय का समर्थन कैसे किया")],
    ["human-resources", local("Human Resources", "الموارد البشرية", "Recursos humanos", "Ressources humaines", "Personalwesen", "मानव संसाधन"),
      local("an employee, hiring, or people-support experience you contributed to", "تجربة موظفين أو توظيف أو دعم أشخاص ساهمت فيها", "una experiencia de empleados, contratación o apoyo a personas a la que contribuiste", "une expérience liée aux employés, au recrutement ou au soutien des personnes à laquelle vous avez contribué", "eine Mitarbeiter-, Recruiting- oder Support-Erfahrung, zu der du beigetragen hast", "कर्मचारी, भर्ती या लोगों की सहायता से जुड़ा अनुभव जिसमें आपने योगदान दिया"),
      local("a sensitive people or communication challenge", "تحدياً حساساً متعلقاً بالأشخاص أو التواصل", "un reto delicado de personas o comunicación", "un défi sensible lié aux personnes ou à la communication", "eine sensible Personal- oder Kommunikationsherausforderung", "लोगों या संचार से जुड़ी एक संवेदनशील चुनौती"),
      local("how you helped create a fair and positive experience", "كيف ساعدت في خلق تجربة عادلة وإيجابية", "cómo ayudaste a crear una experiencia justa y positiva", "comment vous avez contribué à créer une expérience juste et positive", "wie du zu einer fairen und positiven Erfahrung beigetragen hast", "आपने निष्पक्ष और सकारात्मक अनुभव बनाने में कैसे मदद की")],
    ["sales", local("Sales", "المبيعات", "Ventas", "Ventes", "Vertrieb", "बिक्री"),
      local("a customer conversation, pitch, or relationship you developed", "محادثة عميل أو عرضاً أو علاقة طورتها", "una conversación con cliente, presentación o relación que desarrollaste", "une conversation client, une présentation ou une relation que vous avez développée", "ein Kundengespräch, einen Pitch oder eine Beziehung, die du aufgebaut hast", "एक ग्राहक बातचीत, प्रस्तुति या संबंध जिसे आपने विकसित किया"),
      local("an objection, rejection, or changing customer need", "اعتراضاً أو رفضاً أو حاجة عميل متغيرة", "una objeción, rechazo o necesidad cambiante del cliente", "une objection, un refus ou un besoin client changeant", "einen Einwand, eine Ablehnung oder ein sich änderndes Kundenbedürfnis", "एक आपत्ति, अस्वीकृति या बदलती ग्राहक आवश्यकता"),
      local("how you built trust and moved toward a result", "كيف بنيت الثقة وتقدمت نحو نتيجة", "cómo generaste confianza y avanzaste hacia un resultado", "comment vous avez instauré la confiance et progressé vers un résultat", "wie du Vertrauen aufgebaut und auf ein Ergebnis hingearbeitet hast", "आपने विश्वास कैसे बनाया और परिणाम की ओर कैसे बढ़े")],
  ];

  const ROLES = CAREER_SEEDS.map(([id, label]) => ({ id, label: label.en, labelText: label }));

  const QUESTION_TEMPLATES = {
    introduction: local(
      "To begin, could you introduce yourself and explain what interests you about {role}?",
      "للبدء، هل يمكنك التعريف بنفسك وشرح ما الذي يثير اهتمامك في مجال {role}؟",
      "Para empezar, ¿podrías presentarte y explicar qué te interesa de {role}?",
      "Pour commencer, pouvez-vous vous présenter et expliquer ce qui vous intéresse dans le domaine {role} ?",
      "Stell dich bitte kurz vor und erkläre, was dich am Bereich {role} interessiert.",
      "शुरुआत में, क्या आप अपना परिचय दे सकते हैं और बता सकते हैं कि {role} में आपकी रुचि क्यों है?"
    ),
    background: local(
      "Walk me through {background}. What was your contribution?",
      "حدثني عن {background}. ما كانت مساهمتك؟",
      "Háblame de {background}. ¿Cuál fue tu contribución?",
      "Parlez-moi de {background}. Quelle a été votre contribution ?",
      "Erzähl mir von {background}. Welchen Beitrag hast du geleistet?",
      "मुझे {background} के बारे में बताइए। आपका योगदान क्या था?"
    ),
    role: local(
      "What skills or habits help you do well in {role}, and how have you developed them?",
      "ما المهارات أو العادات التي تساعدك على النجاح في {role}، وكيف طورتها؟",
      "¿Qué habilidades o hábitos te ayudan a rendir bien en {role} y cómo los has desarrollado?",
      "Quelles compétences ou habitudes vous aident à réussir dans {role}, et comment les avez-vous développées ?",
      "Welche Fähigkeiten oder Gewohnheiten helfen dir in {role}, und wie hast du sie entwickelt?",
      "कौन-से कौशल या आदतें आपको {role} में अच्छा काम करने में मदद करती हैं, और आपने उन्हें कैसे विकसित किया?"
    ),
    behavioral: local(
      "Tell me about a time you worked with someone who had a different viewpoint. How did you move the work forward?",
      "حدثني عن وقت عملت فيه مع شخص لديه وجهة نظر مختلفة. كيف دفعت العمل إلى الأمام؟",
      "Cuéntame de una ocasión en la que trabajaste con alguien con un punto de vista diferente. ¿Cómo impulsaste el trabajo?",
      "Parlez-moi d'une fois où vous avez travaillé avec quelqu'un ayant un point de vue différent. Comment avez-vous fait avancer le travail ?",
      "Erzähl mir von einer Situation, in der du mit jemandem mit einer anderen Sichtweise gearbeitet hast. Wie hast du die Arbeit vorangebracht?",
      "मुझे उस समय के बारे में बताइए जब आपने अलग दृष्टिकोण वाले व्यक्ति के साथ काम किया। आपने काम को आगे कैसे बढ़ाया?"
    ),
    challenge: local(
      "Describe {challenge}. How did you decide what to do first?",
      "صف {challenge}. كيف قررت ما الذي ستفعله أولاً؟",
      "Describe {challenge}. ¿Cómo decidiste qué hacer primero?",
      "Décrivez {challenge}. Comment avez-vous décidé quoi faire en premier ?",
      "Beschreibe {challenge}. Wie hast du entschieden, was du zuerst tun solltest?",
      "{challenge} का वर्णन करें। आपने पहले क्या करना है, यह कैसे तय किया?"
    ),
    impact: local(
      "How have you created impact through {impact}? Please use one specific example.",
      "كيف أحدثت أثراً من خلال {impact}؟ يرجى استخدام مثال محدد.",
      "¿Cómo has generado impacto mediante {impact}? Usa un ejemplo específico.",
      "Comment avez-vous créé de l'impact par {impact} ? Donnez un exemple précis.",
      "Wie hast du durch {impact} Wirkung erzielt? Bitte nenne ein konkretes Beispiel.",
      "आपने {impact} के माध्यम से प्रभाव कैसे बनाया? कृपया एक विशिष्ट उदाहरण दें।"
    ),
    growth: local(
      "What would you like to learn or become stronger at in your next role?",
      "ما الذي تود تعلمه أو أن تصبح أقوى فيه في وظيفتك القادمة؟",
      "¿Qué te gustaría aprender o fortalecer en tu próximo puesto?",
      "Qu'aimeriez-vous apprendre ou renforcer dans votre prochain poste ?",
      "Was möchtest du in deiner nächsten Rolle lernen oder worin möchtest du stärker werden?",
      "आप अपनी अगली भूमिका में क्या सीखना या किसमें बेहतर होना चाहेंगे?"
    ),
    closing: local(
      "What questions do you have for me about the role, team, or success in the first few months?",
      "ما الأسئلة التي لديك لي حول الوظيفة أو الفريق أو النجاح في الأشهر الأولى؟",
      "¿Qué preguntas tienes para mí sobre el puesto, el equipo o el éxito durante los primeros meses?",
      "Quelles questions avez-vous pour moi sur le poste, l'équipe ou la réussite pendant les premiers mois ?",
      "Welche Fragen hast du an mich zur Rolle, zum Team oder zum Erfolg in den ersten Monaten?",
      "भूमिका, टीम या शुरुआती कुछ महीनों में सफलता के बारे में आप मुझसे क्या पूछना चाहेंगे?"
    ),
  };

  const HINTS = {
    introduction: local("Keep it focused: background, a relevant strength, and why this opportunity.", "اجعلها مركزة: الخلفية ونقطة قوة ذات صلة وسبب اهتمامك بالفرصة.", "Sé conciso: trayectoria, una fortaleza relevante y por qué te interesa la oportunidad.", "Restez concis : parcours, force pertinente et intérêt pour l'occasion.", "Bleib fokussiert: Hintergrund, eine relevante Stärke und dein Interesse an der Gelegenheit.", "इसे केंद्रित रखें: पृष्ठभूमि, एक प्रासंगिक ताकत और अवसर में आपकी रुचि।"),
    background: local("Use a short structure: context, your responsibility, the action you took, and the result.", "استخدم بنية قصيرة: السياق ومسؤوليتك والإجراء الذي اتخذته والنتيجة.", "Usa una estructura breve: contexto, tu responsabilidad, tu acción y el resultado.", "Utilisez une structure courte : contexte, responsabilité, action et résultat.", "Nutze eine kurze Struktur: Kontext, Verantwortung, deine Handlung und Ergebnis.", "संक्षिप्त संरचना अपनाएँ: संदर्भ, आपकी जिम्मेदारी, आपका कार्य और परिणाम।"),
    role: local("Name one or two skills, then prove each with a real example.", "اذكر مهارة أو اثنتين ثم أثبت كل واحدة بمثال حقيقي.", "Nombra una o dos habilidades y demuéstralas con un ejemplo real.", "Nommez une ou deux compétences, puis montrez-les par un exemple réel.", "Nenne ein oder zwei Fähigkeiten und belege sie jeweils mit einem echten Beispiel.", "एक या दो कौशल बताइए, फिर वास्तविक उदाहरण से उन्हें साबित करें।"),
    behavioral: local("Show how you listened, communicated clearly, and reached a useful next step.", "أظهر كيف استمعت وتواصلت بوضوح ووصلت إلى خطوة تالية مفيدة.", "Muestra cómo escuchaste, te comunicaste con claridad y lograste un siguiente paso útil.", "Montrez comment vous avez écouté, communiqué clairement et atteint une étape utile.", "Zeige, wie du zugehört, klar kommuniziert und einen hilfreichen nächsten Schritt erreicht hast.", "दिखाएँ कि आपने कैसे सुना, स्पष्ट संवाद किया और उपयोगी अगला कदम पाया।"),
    challenge: local("Explain your thinking, not only the final answer. Mention priorities and trade-offs.", "اشرح تفكيرك وليس الإجابة النهائية فقط. اذكر الأولويات والمفاضلات.", "Explica tu razonamiento, no solo la respuesta final. Menciona prioridades y decisiones.", "Expliquez votre raisonnement, pas seulement la réponse finale. Mentionnez priorités et compromis.", "Erkläre dein Denken, nicht nur das Ergebnis. Nenne Prioritäten und Zielkonflikte.", "केवल अंतिम उत्तर नहीं, अपनी सोच समझाएँ। प्राथमिकताओं और समझौतों का उल्लेख करें।"),
    impact: local("Make the outcome concrete: what changed, for whom, and how you know.", "اجعل النتيجة ملموسة: ما الذي تغير ولمن وكيف تعرف ذلك.", "Haz concreto el resultado: qué cambió, para quién y cómo lo sabes.", "Rendez le résultat concret : ce qui a changé, pour qui et comment vous le savez.", "Mach das Ergebnis konkret: Was hat sich für wen verändert und woher weißt du das?", "परिणाम को ठोस बनाइए: क्या बदला, किसके लिए और आपको कैसे पता है।"),
    growth: local("Be honest and forward-looking. Link your goal to a practical learning plan.", "كن صادقاً ومتطلعاً للمستقبل. اربط هدفك بخطة تعلم عملية.", "Sé sincero y mira al futuro. Vincula tu meta con un plan de aprendizaje práctico.", "Soyez honnête et tourné vers l'avenir. Reliez votre objectif à un plan d'apprentissage concret.", "Sei ehrlich und zukunftsorientiert. Verknüpfe dein Ziel mit einem praktischen Lernplan.", "ईमानदार और भविष्य-केंद्रित रहें। अपने लक्ष्य को व्यावहारिक सीखने की योजना से जोड़ें।"),
    closing: local("Ask a genuine question about expectations, the team, or how success is measured.", "اطرح سؤالاً حقيقياً عن التوقعات أو الفريق أو كيفية قياس النجاح.", "Haz una pregunta genuina sobre expectativas, el equipo o cómo se mide el éxito.", "Posez une vraie question sur les attentes, l'équipe ou la manière de mesurer la réussite.", "Stelle eine echte Frage zu Erwartungen, Team oder Erfolgsmessung.", "अपेक्षाओं, टीम या सफलता मापने के तरीके के बारे में सच्चा प्रश्न पूछें।"),
  };

  const FOLLOW_UP = local(
    "Could you make that more specific? What did you personally do, and what was the result?",
    "هل يمكنك جعل ذلك أكثر تحديداً؟ ماذا فعلت أنت شخصياً وما كانت النتيجة؟",
    "¿Podrías hacerlo más específico? ¿Qué hiciste tú personalmente y cuál fue el resultado?",
    "Pouvez-vous être plus précis ? Qu'avez-vous fait personnellement et quel a été le résultat ?",
    "Kannst du das konkreter machen? Was hast du persönlich getan und was war das Ergebnis?",
    "क्या आप इसे अधिक विशिष्ट बना सकते हैं? आपने व्यक्तिगत रूप से क्या किया और परिणाम क्या रहा?"
  );

  function format(template, values, locale) {
    let text = template[locale] || template.en;
    Object.keys(values).forEach((key) => {
      text = text.replace(new RegExp("\\{" + key + "\\}", "g"), values[key][locale] || values[key].en || "");
    });
    return text;
  }

  function buildQuestion(seed, stage, index) {
    const [roleId, role, background, challenge, impact] = seed;
    const variables = { role, background, challenge, impact };
    const text = {};
    LOCALES.forEach((locale) => { text[locale] = format(QUESTION_TEMPLATES[stage], variables, locale); });
    return {
      id: `${roleId}-${stage}`,
      parentId: null,
      roleId,
      stage,
      text,
      hint: HINTS[stage],
      followUpEligible: stage !== "closing" && stage !== "introduction",
      isClosing: stage === "closing",
      order: index,
    };
  }

  const CAREERS = Object.fromEntries(CAREER_SEEDS.map((seed) => {
    const [id, label] = seed;
    return [id, { id, label, questions: STAGES.map((stage, index) => buildQuestion(seed, stage, index)) }];
  }));

  function getDifficulty(id) {
    return DIFFICULTIES.find((difficulty) => difficulty.id === id) || DIFFICULTIES[1];
  }

  function getCareer(id) {
    return CAREERS[id] || CAREERS.general;
  }

  function getPlan(roleId, difficultyId, demoSpeed) {
    const questions = getCareer(roleId).questions;
    let indexes;
    if (demoSpeed) indexes = [0, 2, 7];
    else if (difficultyId === "easy") indexes = [0, 1, 2, 7];
    else if (difficultyId === "hard") indexes = [0, 1, 2, 3, 4, 5, 6, 7];
    else indexes = [0, 1, 2, 3, 4, 7];
    return indexes.map((index) => ({ ...questions[index], text: { ...questions[index].text }, hint: { ...questions[index].hint } }));
  }

  function getFollowUp(parentQuestion) {
    return {
      id: `${parentQuestion.id}-local-follow-up`,
      parentId: parentQuestion.id,
      roleId: parentQuestion.roleId,
      stage: parentQuestion.stage,
      text: { ...FOLLOW_UP },
      hint: { ...HINTS[parentQuestion.stage] },
      followUpEligible: false,
      isFollowUp: true,
      isClosing: false,
    };
  }

  function getQuestionSet(roleId, difficultyId) {
    return getPlan(roleId, difficultyId, false).map((question) => ({ text: question.text.en, hint: question.hint.en, id: question.id }));
  }

  function getHint(questionText) {
    const question = String(questionText || "").toLowerCase();
    if (question.includes("questions do you have")) return HINTS.closing.en;
    if (question.includes("introduce yourself")) return HINTS.introduction.en;
    return HINTS.background.en;
  }

  IQ.questions = {
    LOCALES,
    STAGES,
    STAGE_LABELS,
    ROLES,
    DIFFICULTIES,
    CAREERS,
    GENERIC_FOLLOW_UP: FOLLOW_UP.en,
    getCareer,
    getDifficulty,
    getPlan,
    getFollowUp,
    getQuestionSet,
    getHint,
  };
})();

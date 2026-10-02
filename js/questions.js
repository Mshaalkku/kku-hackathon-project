/* ===========================================================
   Ready2Interview — staged, multilingual interview plans
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
      local("a customer conversation, pitch, or relationship you developed", "محادثة عميل أو عرضاً أو علاقة طورتها", "una conversación con cliente, presentación o relación que desarrollaste", "une conversation client, une présentation ou une relation que vous avez contribué à développer", "ein Kundengespräch, einen Pitch oder eine Beziehung, die du aufgebaut hast", "एक ग्राहक बातचीत, प्रस्तुति या संबंध जिसे आपने विकसित किया"),
      local("an objection, rejection, or changing customer need", "اعتراضاً أو رفضاً أو حاجة عميل متغيرة", "una objeción, rechazo o necesidad cambiante del cliente", "une objection, un refus ou un besoin client changeant", "einen Einwand, eine Ablehnung oder ein sich änderndes Kundenbedürfnis", "एक आपत्ति, अस्वीकृति या बदलती ग्राहक आवश्यकता"),
      local("how you built trust and moved toward a result", "كيف بنيت الثقة وتقدمت نحو نتيجة", "cómo generaste confianza y avanzaste hacia un resultado", "comment vous avez instauré la confiance et progressé vers un résultat", "wie du Vertrauen aufgebaut und auf ein Ergebnis hingearbeitet hast", "आपने विश्वास कैसे बनाया और परिणाम की ओर कैसे बढ़े")],
    ["ux-ui-design", local("UX/UI Design", "تصميم تجربة وواجهة المستخدم", "Diseño UX/UI", "Conception UX/UI", "UX/UI-Design", "यूएक्स/यूआई डिज़ाइन"),
      local("a user-centered design, prototype, or usability project", "مشروع تصميم يركز على المستخدم أو نموذجاً أولياً أو اختبار قابلية استخدام", "un proyecto de diseño centrado en el usuario, prototipo o usabilidad", "un projet de conception centrée sur l'utilisateur, prototype ou ergonomie", "ein nutzerzentriertes Design-, Prototyp- oder Usability-Projekt", "उपयोगकर्ता-केंद्रित डिज़ाइन, प्रोटोटाइप या उपयोगिता प्रोजेक्ट"),
      local("a research, accessibility, or design trade-off", "تحدياً في البحث أو إمكانية الوصول أو مفاضلة تصميم", "un reto de investigación, accesibilidad o una decisión de diseño", "un défi de recherche, d'accessibilité ou un compromis de conception", "eine Forschungs-, Barrierefreiheits- oder Designabwägung", "अनुसंधान, पहुंच या डिज़ाइन समझौते की चुनौती"),
      local("how your design improved a user's experience", "كيف حسّن تصميمك تجربة المستخدم", "cómo tu diseño mejoró la experiencia de una persona usuaria", "comment votre conception a amélioré l'expérience d'un utilisateur", "wie dein Design die Nutzererfahrung verbessert hat", "आपके डिज़ाइन ने उपयोगकर्ता अनुभव को कैसे बेहतर बनाया")],
    ["business-analysis", local("Business Analysis", "تحليل الأعمال", "Análisis de negocio", "Analyse métier", "Business-Analyse", "व्यवसाय विश्लेषण"),
      local("a requirement, process, or stakeholder problem you clarified", "متطلباً أو عملية أو مشكلة أصحاب مصلحة قمت بتوضيحها", "un requisito, proceso o problema de partes interesadas que aclaraste", "une exigence, un processus ou un problème de parties prenantes que vous avez clarifié", "eine Anforderung, einen Prozess oder ein Stakeholder-Problem, das du geklärt hast", "एक आवश्यकता, प्रक्रिया या हितधारक समस्या जिसे आपने स्पष्ट किया"),
      local("an ambiguous requirement or competing stakeholder need", "متطلباً غامضاً أو احتياجات متنافسة لأصحاب المصلحة", "un requisito ambiguo o necesidades contrapuestas de partes interesadas", "une exigence ambiguë ou des besoins concurrents de parties prenantes", "eine unklare Anforderung oder konkurrierende Stakeholder-Bedürfnisse", "अस्पष्ट आवश्यकता या प्रतिस्पर्धी हितधारक जरूरत"),
      local("how your analysis improved a decision or delivery outcome", "كيف حسّن تحليلك قراراً أو نتيجة تسليم", "cómo tu análisis mejoró una decisión o resultado de entrega", "comment votre analyse a amélioré une décision ou un résultat de livraison", "wie deine Analyse eine Entscheidung oder ein Lieferergebnis verbesserte", "आपके विश्लेषण ने निर्णय या डिलीवरी परिणाम कैसे बेहतर किया")],
    ["customer-service", local("Customer Service", "خدمة العملاء", "Atención al cliente", "Service client", "Kundenservice", "ग्राहक सेवा"),
      local("a customer issue you owned from first contact to resolution", "مشكلة عميل توليتها من أول تواصل حتى الحل", "un caso de cliente del que te hiciste cargo desde el primer contacto hasta la resolución", "un problème client dont vous avez assuré le suivi du premier contact à la résolution", "ein Kundenanliegen, das du vom ersten Kontakt bis zur Lösung betreut hast", "एक ग्राहक समस्या जिसका आपने पहले संपर्क से समाधान तक जिम्मा लिया"),
      local("a difficult or frustrated customer situation", "موقف عميل صعب أو محبط", "una situación con un cliente difícil o frustrado", "une situation avec un client difficile ou frustré", "eine schwierige oder frustrierte Kundensituation", "कठिन या निराश ग्राहक स्थिति"),
      local("how you restored trust or improved the customer's outcome", "كيف استعدت الثقة أو حسّنت نتيجة العميل", "cómo recuperaste la confianza o mejoraste el resultado del cliente", "comment vous avez rétabli la confiance ou amélioré le résultat pour le client", "wie du Vertrauen wiederhergestellt oder das Ergebnis für den Kunden verbessert hast", "आपने भरोसा कैसे बहाल किया या ग्राहक का परिणाम कैसे बेहतर किया")],
    ["healthcare-nursing", local("Healthcare / Nursing", "الرعاية الصحية / التمريض", "Salud / Enfermería", "Santé / Soins infirmiers", "Gesundheitswesen / Pflege", "स्वास्थ्य सेवा / नर्सिंग"),
      local("a patient-care, clinical-support, or health-service experience you contributed to", "تجربة في رعاية المرضى أو الدعم السريري أو الخدمة الصحية ساهمت فيها", "una experiencia de atención al paciente, apoyo clínico o servicio de salud a la que contribuiste", "une expérience de soins aux patients, de soutien clinique ou de service de santé à laquelle vous avez contribué", "eine Erfahrung in der Patientenversorgung, klinischen Unterstützung oder im Gesundheitsdienst, zu der du beigetragen hast", "रोगी देखभाल, नैदानिक सहायता या स्वास्थ्य सेवा का ऐसा अनुभव जिसमें आपने योगदान दिया"),
      local("a patient-safety, sensitive-communication, or changing-priorities challenge", "تحدياً متعلقاً بسلامة المريض أو التواصل الحساس أو الأولويات المتغيرة", "un reto de seguridad del paciente, comunicación delicada o prioridades cambiantes", "un défi lié à la sécurité des patients, à une communication sensible ou à des priorités changeantes", "eine Herausforderung bei Patientensicherheit, sensibler Kommunikation oder wechselnden Prioritäten", "रोगी सुरक्षा, संवेदनशील संचार या बदलती प्राथमिकताओं से जुड़ी चुनौती"),
      local("care, communication, or coordination that improved an outcome for a patient, family, or care team", "رعاية أو تواصل أو تنسيق حسّن نتيجة لمريض أو عائلة أو فريق رعاية", "la atención, comunicación o coordinación que mejoró un resultado para un paciente, familia o equipo de atención", "des soins, une communication ou une coordination qui ont amélioré un résultat pour un patient, une famille ou une équipe soignante", "Versorgung, Kommunikation oder Koordination, die ein Ergebnis für Patienten, Familien oder das Pflegeteam verbessert hat", "ऐसी देखभाल, संचार या समन्वय जिससे रोगी, परिवार या देखभाल टीम का परिणाम बेहतर हुआ")],
    ["education-teaching", local("Education / Teaching", "التعليم / التدريس", "Educación / Docencia", "Éducation / Enseignement", "Bildung / Lehre", "शिक्षा / शिक्षण"),
      local("a lesson, learning activity, classroom, or student-support experience you designed or delivered", "درساً أو نشاطاً تعليمياً أو تجربة صفية أو دعماً للطلاب صممته أو قدمته", "una lección, actividad de aprendizaje, experiencia de aula o apoyo al estudiante que diseñaste o impartiste", "une leçon, activité d'apprentissage, expérience de classe ou soutien aux élèves que vous avez conçu ou animé", "eine Unterrichtsstunde, Lernaktivität, Klassenerfahrung oder Schülerunterstützung, die du gestaltet oder durchgeführt hast", "एक पाठ, सीखने की गतिविधि, कक्षा अनुभव या विद्यार्थी सहायता जिसे आपने तैयार किया या प्रदान किया"),
      local("a learner-engagement, assessment, or varied-needs challenge", "تحدياً يتعلق بتفاعل المتعلمين أو التقييم أو الاحتياجات المتنوعة", "un reto de participación del alumnado, evaluación o necesidades diversas", "un défi lié à l'engagement des apprenants, à l'évaluation ou à la diversité des besoins", "eine Herausforderung bei Lernbeteiligung, Bewertung oder unterschiedlichen Bedürfnissen", "शिक्षार्थी सहभागिता, मूल्यांकन या विविध जरूरतों से जुड़ी चुनौती"),
      local("teaching or support that improved learner understanding, confidence, participation, or progress", "تدريساً أو دعماً حسّن فهم المتعلمين أو ثقتهم أو مشاركتهم أو تقدمهم", "la enseñanza o el apoyo que mejoró la comprensión, confianza, participación o progreso del alumnado", "un enseignement ou un soutien qui a amélioré la compréhension, la confiance, la participation ou les progrès des apprenants", "Unterricht oder Unterstützung, die Verständnis, Selbstvertrauen, Beteiligung oder Fortschritt der Lernenden verbessert hat", "ऐसा शिक्षण या समर्थन जिससे शिक्षार्थियों की समझ, आत्मविश्वास, भागीदारी या प्रगति बेहतर हुई")],
    ["engineering", local("Engineering", "الهندسة", "Ingeniería", "Ingénierie", "Ingenieurwesen", "इंजीनियरिंग"),
      local("an engineering design, prototype, system, or improvement project you supported", "مشروع تصميم هندسي أو نموذج أولي أو نظام أو تحسين دعمته", "un proyecto de diseño de ingeniería, prototipo, sistema o mejora que apoyaste", "un projet de conception technique, de prototype, de système ou d'amélioration que vous avez soutenu", "ein Konstruktions-, Prototyp-, System- oder Verbesserungsprojekt, das du unterstützt hast", "इंजीनियरिंग डिज़ाइन, प्रोटोटाइप, सिस्टम या सुधार प्रोजेक्ट जिसमें आपने सहयोग किया"),
      local("a technical constraint, testing, safety, or reliability challenge", "تحدياً في القيود التقنية أو الاختبار أو السلامة أو الموثوقية", "un reto de restricción técnica, pruebas, seguridad o fiabilidad", "un défi lié à une contrainte technique, aux tests, à la sécurité ou à la fiabilité", "eine Herausforderung bei technischen Einschränkungen, Tests, Sicherheit oder Zuverlässigkeit", "तकनीकी सीमाओं, परीक्षण, सुरक्षा या विश्वसनीयता से जुड़ी चुनौती"),
      local("work that improved performance, safety, quality, or project delivery", "عملاً حسّن الأداء أو السلامة أو الجودة أو تسليم المشروع", "un trabajo que mejoró el rendimiento, la seguridad, la calidad o la entrega del proyecto", "un travail qui a amélioré la performance, la sécurité, la qualité ou la livraison du projet", "Arbeit, die Leistung, Sicherheit, Qualität oder Projektlieferung verbessert hat", "ऐसा कार्य जिससे प्रदर्शन, सुरक्षा, गुणवत्ता या प्रोजेक्ट डिलीवरी बेहतर हुई")],
    ["administrative-office", local("Administrative / Office", "الإدارة / المكتب", "Administración / Oficina", "Administration / Bureau", "Verwaltung / Büro", "प्रशासन / कार्यालय"),
      local("an office process, schedule, record, or coordination task you supported", "عملية مكتبية أو جدولاً أو سجلاً أو مهمة تنسيق دعمتها", "un proceso de oficina, calendario, registro o tarea de coordinación que apoyaste", "un processus de bureau, un planning, un dossier ou une tâche de coordination que vous avez soutenu", "einen Büroprozess, Terminplan, Datensatz oder eine Koordinationsaufgabe, die du unterstützt hast", "कार्यालय प्रक्रिया, कार्यक्रम, रिकॉर्ड या समन्वय कार्य जिसमें आपने सहयोग किया"),
      local("a competing-priorities, confidentiality, or process-accuracy challenge", "تحدياً في الأولويات المتنافسة أو السرية أو دقة الإجراءات", "un reto de prioridades en competencia, confidencialidad o precisión de procesos", "un défi lié à des priorités concurrentes, à la confidentialité ou à l'exactitude d'un processus", "eine Herausforderung bei konkurrierenden Prioritäten, Vertraulichkeit oder Prozessgenauigkeit", "प्रतिस्पर्धी प्राथमिकताओं, गोपनीयता या प्रक्रिया की सटीकता से जुड़ी चुनौती"),
      local("organization, communication, or follow-through that improved accuracy, responsiveness, or team support", "تنظيماً أو تواصلاً أو متابعة حسّنت الدقة أو الاستجابة أو دعم الفريق", "la organización, comunicación o seguimiento que mejoró la precisión, la capacidad de respuesta o el apoyo al equipo", "une organisation, une communication ou un suivi qui a amélioré l'exactitude, la réactivité ou le soutien de l'équipe", "Organisation, Kommunikation oder Nachverfolgung, die Genauigkeit, Reaktionsfähigkeit oder Teamunterstützung verbessert hat", "ऐसा संगठन, संचार या फॉलो-थ्रू जिससे सटीकता, तत्परता या टीम सहायता बेहतर हुई")],
    ["operations-supply-chain", local("Operations / Supply Chain", "العمليات / سلسلة الإمداد", "Operaciones / Cadena de suministro", "Opérations / Chaîne logistique", "Betrieb / Lieferkette", "संचालन / आपूर्ति शृंखला"),
      local("an operations, inventory, logistics, workflow, or supplier-coordination experience you supported", "تجربة في العمليات أو المخزون أو الخدمات اللوجستية أو سير العمل أو تنسيق الموردين دعمتها", "una experiencia de operaciones, inventario, logística, flujo de trabajo o coordinación con proveedores que apoyaste", "une expérience d'opérations, de stock, de logistique, de flux de travail ou de coordination fournisseurs que vous avez soutenue", "eine Erfahrung in Betrieb, Bestand, Logistik, Arbeitsablauf oder Lieferantenkoordination, die du unterstützt hast", "संचालन, इन्वेंटरी, लॉजिस्टिक्स, कार्यप्रवाह या आपूर्तिकर्ता समन्वय का ऐसा अनुभव जिसमें आपने सहयोग किया"),
      local("a disruption, capacity, quality, or delivery challenge", "تحدياً في التعطّل أو السعة أو الجودة أو التسليم", "un reto de interrupción, capacidad, calidad o entrega", "un défi de perturbation, de capacité, de qualité ou de livraison", "eine Herausforderung bei Störungen, Kapazität, Qualität oder Lieferung", "व्यवधान, क्षमता, गुणवत्ता या डिलीवरी से जुड़ी चुनौती"),
      local("planning, coordination, or process improvement that made service, efficiency, cost, reliability, or flow better", "تخطيطاً أو تنسيقاً أو تحسيناً للعملية حسّن الخدمة أو الكفاءة أو التكلفة أو الموثوقية أو التدفق", "la planificación, coordinación o mejora de procesos que hizo mejor el servicio, la eficiencia, el coste, la fiabilidad o el flujo", "une planification, une coordination ou une amélioration de processus qui a amélioré le service, l'efficacité, le coût, la fiabilité ou le flux", "Planung, Koordination oder Prozessverbesserung, die Service, Effizienz, Kosten, Zuverlässigkeit oder Ablauf verbessert hat", "ऐसी योजना, समन्वय या प्रक्रिया सुधार जिससे सेवा, दक्षता, लागत, विश्वसनीयता या प्रवाह बेहतर हुआ")],
    ["legal-law", local("Legal / Law", "القانون / الشؤون القانونية", "Legal / Derecho", "Juridique / Droit", "Recht / Rechtswesen", "कानून / विधिक"),
      local("a legal research, document-review, case-support, or contract-administration experience you handled", "تجربة في البحث القانوني أو مراجعة المستندات أو دعم القضايا أو إدارة العقود توليتها", "una experiencia de investigación jurídica, revisión de documentos, apoyo a casos o administración de contratos que gestionaste", "une expérience de recherche juridique, de révision de documents, de soutien aux dossiers ou d'administration de contrats que vous avez traitée", "eine Erfahrung in Rechtsrecherche, Dokumentenprüfung, Fallunterstützung oder Vertragsverwaltung, die du bearbeitet hast", "कानूनी शोध, दस्तावेज़ समीक्षा, मामले की सहायता या अनुबंध प्रशासन का ऐसा अनुभव जिसे आपने संभाला"),
      local("a confidentiality, deadline, accuracy, or complex-information challenge", "تحدياً في السرية أو الموعد النهائي أو الدقة أو المعلومات المعقدة", "un reto de confidencialidad, plazo, precisión o información compleja", "un défi lié à la confidentialité, aux délais, à l'exactitude ou à des informations complexes", "eine Herausforderung bei Vertraulichkeit, Frist, Genauigkeit oder komplexen Informationen", "गोपनीयता, समयसीमा, सटीकता या जटिल जानकारी से जुड़ी चुनौती"),
      local("work that supported accurate, ethical, timely legal service or documentation", "عملاً دعم خدمة قانونية أو توثيقاً دقيقاً وأخلاقياً وفي الوقت المناسب", "un trabajo que respaldó un servicio o una documentación jurídica precisa, ética y oportuna", "un travail qui a soutenu un service juridique ou une documentation exacte, éthique et en temps utile", "Arbeit, die einen genauen, ethischen und rechtzeitigen Rechtsservice oder eine entsprechende Dokumentation unterstützt hat", "ऐसा कार्य जिसने सटीक, नैतिक और समय पर कानूनी सेवा या दस्तावेज़ीकरण में सहायता की")],
    ["graphic-design-creative", local("Graphic Design / Creative", "التصميم الجرافيكي / الإبداعي", "Diseño gráfico / Creatividad", "Design graphique / Création", "Grafikdesign / Kreativ", "ग्राफिक डिज़ाइन / रचनात्मक"),
      local("a visual-design, brand, campaign, illustration, or creative-brief project you created or improved", "مشروع تصميم بصري أو علامة تجارية أو حملة أو رسم توضيحي أو موجز إبداعي أنشأته أو حسّنته", "un proyecto de diseño visual, marca, campaña, ilustración o encargo creativo que creaste o mejoraste", "un projet de conception visuelle, de marque, de campagne, d'illustration ou de brief créatif que vous avez créé ou amélioré", "ein Projekt für visuelles Design, Marke, Kampagne, Illustration oder Kreativbriefing, das du erstellt oder verbessert hast", "विज़ुअल डिज़ाइन, ब्रांड, अभियान, चित्रण या रचनात्मक ब्रीफ प्रोजेक्ट जिसे आपने बनाया या बेहतर किया"),
      local("a client-feedback, revision, accessibility, or creative-constraint challenge", "تحدياً في ملاحظات العميل أو المراجعات أو إمكانية الوصول أو القيود الإبداعية", "un reto de comentarios del cliente, revisiones, accesibilidad o restricciones creativas", "un défi lié aux retours client, aux révisions, à l'accessibilité ou aux contraintes créatives", "eine Herausforderung bei Kundenfeedback, Überarbeitungen, Barrierefreiheit oder kreativen Einschränkungen", "क्लाइंट फीडबैक, संशोधन, पहुँच या रचनात्मक सीमाओं से जुड़ी चुनौती"),
      local("design work that improved clarity, audience engagement, usability, or a campaign outcome", "عمل تصميم حسّن الوضوح أو تفاعل الجمهور أو سهولة الاستخدام أو نتيجة الحملة", "un trabajo de diseño que mejoró la claridad, la interacción de la audiencia, la usabilidad o el resultado de una campaña", "un travail de conception qui a amélioré la clarté, l'engagement du public, l'utilisabilité ou le résultat d'une campagne", "Designarbeit, die Klarheit, Zielgruppenbindung, Nutzbarkeit oder ein Kampagnenergebnis verbessert hat", "ऐसा डिज़ाइन कार्य जिससे स्पष्टता, दर्शक जुड़ाव, उपयोगिता या अभियान परिणाम बेहतर हुआ")],
    ["hospitality-tourism", local("Hospitality / Tourism", "الضيافة / السياحة", "Hostelería / Turismo", "Hôtellerie / Tourisme", "Gastgewerbe / Tourismus", "आतिथ्य / पर्यटन"),
      local("a guest-service, event, travel, accommodation, or visitor-support experience you managed", "تجربة في خدمة الضيوف أو فعالية أو سفر أو إقامة أو دعم الزوار أدرتها", "una experiencia de servicio al huésped, evento, viaje, alojamiento o apoyo a visitantes que gestionaste", "une expérience de service aux clients, d'événement, de voyage, d'hébergement ou de soutien aux visiteurs que vous avez gérée", "eine Erfahrung im Gästeservice, bei Veranstaltungen, Reisen, Unterkünften oder der Besucherbetreuung, die du betreut hast", "अतिथि सेवा, कार्यक्रम, यात्रा, आवास या आगंतुक सहायता का ऐसा अनुभव जिसे आपने संभाला"),
      local("a difficult guest, service-recovery, cultural-communication, or operational-disruption challenge", "تحدياً يتعلق بضيف صعب أو استعادة الخدمة أو التواصل الثقافي أو تعطل العمليات", "un reto de huésped difícil, recuperación del servicio, comunicación cultural o interrupción operativa", "un défi lié à un client difficile, au rétablissement du service, à la communication interculturelle ou à une perturbation opérationnelle", "eine Herausforderung mit schwierigen Gästen, Servicewiederherstellung, interkultureller Kommunikation oder Betriebsstörungen", "कठिन अतिथि, सेवा पुनर्प्राप्ति, सांस्कृतिक संचार या परिचालन व्यवधान से जुड़ी चुनौती"),
      local("service, communication, or coordination that improved guest satisfaction, safety, or team results", "خدمة أو تواصل أو تنسيق حسّن رضا الضيوف أو السلامة أو نتائج الفريق", "el servicio, la comunicación o la coordinación que mejoró la satisfacción del huésped, la seguridad o los resultados del equipo", "un service, une communication ou une coordination qui a amélioré la satisfaction des clients, la sécurité ou les résultats de l'équipe", "Service, Kommunikation oder Koordination, die Gästezufriedenheit, Sicherheit oder Teamergebnisse verbessert hat", "ऐसी सेवा, संचार या समन्वय जिससे अतिथि संतुष्टि, सुरक्षा या टीम परिणाम बेहतर हुए")],
  ];

  const ROLE_FOCUS = {
    general: local("your most relevant strengths", "نقاط قوتك الأكثر صلة", "tus fortalezas más relevantes", "vos atouts les plus pertinents", "deine wichtigsten relevanten Stärken", "आपकी सबसे प्रासंगिक ताकतें"),
    "software-engineering": local("software design, testing, and delivery", "تصميم البرمجيات والاختبار والتسليم", "diseño, pruebas y entrega de software", "conception, tests et livraison de logiciels", "Softwaredesign, Tests und Lieferung", "सॉफ्टवेयर डिज़ाइन, टेस्टिंग और डिलीवरी"),
    "information-systems": local("systems thinking, data quality, and stakeholder communication", "تفكير الأنظمة وجودة البيانات والتواصل مع أصحاب المصلحة", "pensamiento sistémico, calidad de datos y comunicación", "vision systèmes, qualité des données et communication", "Systemdenken, Datenqualität und Stakeholder-Kommunikation", "सिस्टम सोच, डेटा गुणवत्ता और हितधारक संचार"),
    cybersecurity: local("risk awareness, secure decision-making, and clear communication", "الوعي بالمخاطر والقرارات الآمنة والتواصل الواضح", "conciencia de riesgos, decisiones seguras y comunicación clara", "conscience des risques, décisions sûres et communication claire", "Risikobewusstsein, sichere Entscheidungen und klare Kommunikation", "जोखिम जागरूकता, सुरक्षित निर्णय और स्पष्ट संचार"),
    "ai-machine-learning": local("data quality, evaluation, and responsible AI", "جودة البيانات والتقييم والذكاء الاصطناعي المسؤول", "calidad de datos, evaluación e IA responsable", "qualité des données, évaluation et IA responsable", "Datenqualität, Bewertung und verantwortungsvolle KI", "डेटा गुणवत्ता, मूल्यांकन और जिम्मेदार एआई"),
    "data-analysis": local("analysis, data storytelling, and decision support", "التحليل وسرد البيانات ودعم القرار", "análisis, narrativa de datos y apoyo a decisiones", "analyse, narration des données et aide à la décision", "Analyse, Datenkommunikation und Entscheidungsunterstützung", "विश्लेषण, डेटा स्टोरीटेलिंग और निर्णय सहायता"),
    "it-support": local("diagnosis, communication, and dependable follow-through", "التشخيص والتواصل والمتابعة الموثوقة", "diagnóstico, comunicación y seguimiento fiable", "diagnostic, communication et suivi fiable", "Diagnose, Kommunikation und zuverlässige Nachverfolgung", "निदान, संचार और भरोसेमंद फॉलो-थ्रू"),
    "product-management": local("customer discovery, prioritization, and measurable product outcomes", "فهم العملاء وتحديد الأولويات ونتائج المنتج القابلة للقياس", "descubrimiento de clientes, priorización y resultados medibles", "découverte client, priorisation et résultats produit mesurables", "Kundenverständnis, Priorisierung und messbare Produktergebnisse", "ग्राहक खोज, प्राथमिकता और मापने योग्य उत्पाद परिणाम"),
    "project-management": local("planning, alignment, risk management, and delivery", "التخطيط والمواءمة وإدارة المخاطر والتسليم", "planificación, alineación, gestión de riesgos y entrega", "planification, alignement, gestion des risques et livraison", "Planung, Abstimmung, Risikomanagement und Lieferung", "योजना, समन्वय, जोखिम प्रबंधन और डिलीवरी"),
    marketing: local("audience insight, message testing, and campaign measurement", "فهم الجمهور واختبار الرسائل وقياس الحملات", "conocimiento de audiencia, pruebas de mensajes y medición", "connaissance de l'audience, test des messages et mesure", "Zielgruppenverständnis, Nachrichtentests und Kampagnenmessung", "दर्शक अंतर्दृष्टि, संदेश परीक्षण और अभियान मापन"),
    "finance-accounting": local("accuracy, controls, and clear financial insight", "الدقة والضوابط والرؤية المالية الواضحة", "precisión, controles e información financiera clara", "exactitude, contrôles et analyse financière claire", "Genauigkeit, Kontrollen und klare Finanzinformationen", "सटीकता, नियंत्रण और स्पष्ट वित्तीय अंतर्दृष्टि"),
    "human-resources": local("fairness, confidential communication, and people support", "الإنصاف والتواصل السري ودعم الأشخاص", "equidad, comunicación confidencial y apoyo a personas", "équité, communication confidentielle et soutien aux personnes", "Fairness, vertrauliche Kommunikation und Unterstützung von Menschen", "निष्पक्षता, गोपनीय संचार और लोगों का समर्थन"),
    sales: local("discovery, trust-building, and consultative problem solving", "فهم الاحتياجات وبناء الثقة وحل المشكلات الاستشاري", "descubrimiento, confianza y resolución consultiva", "découverte, confiance et résolution consultative", "Bedarfsermittlung, Vertrauensaufbau und beratende Problemlösung", "खोज, भरोसा निर्माण और परामर्शात्मक समस्या समाधान"),
    "ux-ui-design": local("user research, prototyping, accessibility, and design critique", "بحث المستخدم والنماذج الأولية وإمكانية الوصول ونقد التصميم", "investigación de usuarios, prototipos, accesibilidad y crítica", "recherche utilisateur, prototypage, accessibilité et critique", "Nutzerforschung, Prototyping, Barrierefreiheit und Designkritik", "उपयोगकर्ता अनुसंधान, प्रोटोटाइपिंग, पहुंच और डिज़ाइन आलोचना"),
    "business-analysis": local("requirements discovery, process analysis, and stakeholder alignment", "اكتشاف المتطلبات وتحليل العمليات ومواءمة أصحاب المصلحة", "descubrimiento de requisitos, análisis de procesos y alineación", "découverte des exigences, analyse des processus et alignement", "Anforderungserhebung, Prozessanalyse und Stakeholder-Abstimmung", "आवश्यकता खोज, प्रक्रिया विश्लेषण और हितधारक संरेखण"),
    "customer-service": local("empathy, case ownership, de-escalation, and resolution", "التعاطف وملكية الحالة وتهدئة التصعيد والحل", "empatía, responsabilidad del caso, desescalada y resolución", "empathie, prise en charge, désescalade et résolution", "Empathie, Fallverantwortung, Deeskalation und Lösung", "सहानुभूति, केस ओनरशिप, तनाव कम करना और समाधान"),
    "healthcare-nursing": local("patient-centred care, safety awareness, clinical communication, and teamwork", "الرعاية المتمحورة حول المريض والوعي بالسلامة والتواصل السريري والعمل الجماعي", "atención centrada en el paciente, conciencia de seguridad, comunicación clínica y trabajo en equipo", "soins centrés sur le patient, culture de la sécurité, communication clinique et travail d'équipe", "patientenzentrierte Versorgung, Sicherheitsbewusstsein, klinische Kommunikation und Teamarbeit", "रोगी-केंद्रित देखभाल, सुरक्षा जागरूकता, नैदानिक संचार और टीमवर्क"),
    "education-teaching": local("inclusive instruction, learner engagement, assessment, and communication", "التدريس الشامل وتفاعل المتعلمين والتقييم والتواصل", "enseñanza inclusiva, participación del alumnado, evaluación y comunicación", "enseignement inclusif, engagement des apprenants, évaluation et communication", "inklusiven Unterricht, Lernbeteiligung, Bewertung und Kommunikation", "समावेशी शिक्षण, शिक्षार्थी सहभागिता, मूल्यांकन और संचार"),
    engineering: local("analytical design, testing, technical problem solving, and safe delivery", "التصميم التحليلي والاختبار وحل المشكلات التقنية والتسليم الآمن", "diseño analítico, pruebas, resolución técnica de problemas y entrega segura", "conception analytique, tests, résolution de problèmes techniques et livraison sûre", "analytisches Design, Tests, technische Problemlösung und sichere Lieferung", "विश्लेषणात्मक डिज़ाइन, परीक्षण, तकनीकी समस्या समाधान और सुरक्षित डिलीवरी"),
    "administrative-office": local("organization, professional communication, accuracy, and confidential support", "التنظيم والتواصل المهني والدقة والدعم السري", "organización, comunicación profesional, precisión y apoyo confidencial", "organisation, communication professionnelle, exactitude et soutien confidentiel", "Organisation, professionelle Kommunikation, Genauigkeit und vertrauliche Unterstützung", "संगठन, पेशेवर संचार, सटीकता और गोपनीय सहायता"),
    "operations-supply-chain": local("planning, process improvement, coordination, and data-informed decisions", "التخطيط وتحسين العمليات والتنسيق والقرارات المستندة إلى البيانات", "planificación, mejora de procesos, coordinación y decisiones basadas en datos", "planification, amélioration des processus, coordination et décisions fondées sur les données", "Planung, Prozessverbesserung, Koordination und datengestützte Entscheidungen", "योजना, प्रक्रिया सुधार, समन्वय और डेटा-आधारित निर्णय"),
    "legal-law": local("legal research, accuracy, confidentiality, ethical judgment, and clear communication", "البحث القانوني والدقة والسرية والحكم الأخلاقي والتواصل الواضح", "investigación jurídica, precisión, confidencialidad, criterio ético y comunicación clara", "recherche juridique, exactitude, confidentialité, jugement éthique et communication claire", "Rechtsrecherche, Genauigkeit, Vertraulichkeit, ethisches Urteilsvermögen und klare Kommunikation", "कानूनी शोध, सटीकता, गोपनीयता, नैतिक निर्णय और स्पष्ट संचार"),
    "graphic-design-creative": local("visual communication, creative problem solving, feedback integration, and accessible design", "التواصل البصري وحل المشكلات الإبداعي ودمج الملاحظات والتصميم المتاح", "comunicación visual, resolución creativa de problemas, integración de comentarios y diseño accesible", "communication visuelle, résolution créative de problèmes, intégration des retours et conception accessible", "visuelle Kommunikation, kreative Problemlösung, Feedback-Integration und barrierefreies Design", "दृश्य संचार, रचनात्मक समस्या समाधान, फीडबैक एकीकरण और सुलभ डिज़ाइन"),
    "hospitality-tourism": local("guest experience, service recovery, cultural awareness, and operational teamwork", "تجربة الضيف واستعادة الخدمة والوعي الثقافي والعمل الجماعي التشغيلي", "experiencia del huésped, recuperación del servicio, conciencia cultural y trabajo operativo en equipo", "expérience client, rétablissement du service, conscience culturelle et travail d'équipe opérationnel", "Gästeerlebnis, Servicewiederherstellung, kulturelles Bewusstsein und operative Teamarbeit", "अतिथि अनुभव, सेवा पुनर्प्राप्ति, सांस्कृतिक जागरूकता और परिचालन टीमवर्क"),
  };

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
      "For this role, how have you developed {focus}? Please ground your answer in one example.",
      "لهذا الدور، كيف طورت {focus}؟ يرجى ربط إجابتك بمثال واحد.",
      "Para este puesto, ¿cómo has desarrollado {focus}? Relaciona tu respuesta con un ejemplo.",
      "Pour ce poste, comment avez-vous développé {focus} ? Ancrez votre réponse dans un exemple.",
      "Wie hast du für diese Rolle {focus} entwickelt? Begründe deine Antwort mit einem Beispiel.",
      "इस भूमिका के लिए आपने {focus} कैसे विकसित किया है? अपने उत्तर को एक उदाहरण से जोड़ें।"
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

  const FOLLOW_UPS = {
    specificity: local(
      "Could you make that more specific with one concrete example?",
      "هل يمكنك جعل ذلك أكثر تحديداً بمثال ملموس واحد؟",
      "¿Podrías hacerlo más específico con un ejemplo concreto?",
      "Pouvez-vous être plus précis avec un exemple concret ?",
      "Kannst du das mit einem konkreten Beispiel genauer machen?",
      "क्या आप इसे एक ठोस उदाहरण के साथ अधिक विशिष्ट बना सकते हैं?"
    ),
    action: local(
      "What was your specific responsibility, and what did you personally do next?",
      "ما كانت مسؤوليتك المحددة، وماذا فعلت أنت شخصياً بعد ذلك؟",
      "¿Cuál fue tu responsabilidad específica y qué hiciste después personalmente?",
      "Quelle était votre responsabilité précise et qu'avez-vous fait personnellement ensuite ?",
      "Was war deine konkrete Verantwortung, und was hast du danach persönlich getan?",
      "आपकी विशिष्ट जिम्मेदारी क्या थी और आपने आगे व्यक्तिगत रूप से क्या किया?"
    ),
    result: local(
      "What changed as a result, and how did you know the outcome was useful?",
      "ما الذي تغير نتيجة لذلك، وكيف عرفت أن النتيجة كانت مفيدة؟",
      "¿Qué cambió como resultado y cómo supiste que fue útil?",
      "Qu'est-ce qui a changé ensuite, et comment saviez-vous que le résultat était utile ?",
      "Was hat sich dadurch verändert, und woran hast du erkannt, dass das Ergebnis nützlich war?",
      "नतीजे के तौर पर क्या बदला, और आपको कैसे पता चला कि परिणाम उपयोगी था?"
    ),
    metric: local(
      "How did you measure the impact for the team, user, customer, or project?",
      "كيف قست الأثر على الفريق أو المستخدم أو العميل أو المشروع؟",
      "¿Cómo mediste el impacto para el equipo, usuario, cliente o proyecto?",
      "Comment avez-vous mesuré l'impact pour l'équipe, l'utilisateur, le client ou le projet ?",
      "Wie hast du die Wirkung für Team, Nutzer, Kunde oder Projekt gemessen?",
      "आपने टीम, उपयोगकर्ता, ग्राहक या प्रोजेक्ट के लिए प्रभाव को कैसे मापा?"
    ),
  };

  const REACTIONS = {
    friendly: {
      followUp: local("Thanks for explaining that. I'd like to understand one detail a little better.", "شكراً لشرحك ذلك. أود فهم تفصيل واحد بصورة أفضل.", "Gracias por explicarlo. Me gustaría entender mejor un detalle.", "Merci de l'avoir expliqué. J'aimerais mieux comprendre un détail.", "Danke für die Erklärung. Ich würde gern ein Detail besser verstehen.", "इसे समझाने के लिए धन्यवाद। मैं एक विवरण को थोड़ा बेहतर समझना चाहूँगा।"),
      transition: local("That's helpful. Let's move to another part of your experience.", "هذا مفيد. لننتقل إلى جزء آخر من خبرتك.", "Es útil. Pasemos a otra parte de tu experiencia.", "C'est utile. Passons à une autre partie de votre expérience.", "Das ist hilfreich. Gehen wir zu einem anderen Teil deiner Erfahrung über.", "यह उपयोगी है। आइए आपके अनुभव के दूसरे हिस्से पर चलते हैं।"),
    },
    professional: {
      followUp: local("Thank you. I have one focused follow-up.", "شكراً. لدي سؤال متابعة محدد واحد.", "Gracias. Tengo una pregunta de seguimiento concreta.", "Merci. J'ai une question de suivi ciblée.", "Danke. Ich habe eine gezielte Rückfrage.", "धन्यवाद। मेरे पास एक केंद्रित अनुवर्ती प्रश्न है।"),
      transition: local("Thank you. Let's move to the next topic.", "شكراً. لننتقل إلى الموضوع التالي.", "Gracias. Pasemos al siguiente tema.", "Merci. Passons au sujet suivant.", "Danke. Gehen wir zum nächsten Thema über.", "धन्यवाद। आइए अगले विषय पर चलते हैं।"),
    },
    strict: {
      followUp: local("I need one precise clarification.", "أحتاج إلى توضيح دقيق واحد.", "Necesito una aclaración precisa.", "J'ai besoin d'une précision.", "Ich brauche eine präzise Klarstellung.", "मुझे एक सटीक स्पष्टीकरण चाहिए।"),
      transition: local("Understood. Next topic.", "مفهوم. الموضوع التالي.", "Entendido. Siguiente tema.", "Compris. Sujet suivant.", "Verstanden. Nächstes Thema.", "समझ गया। अगला विषय।"),
    },
  };

  function format(template, values, locale) {
    let text = template[locale] || template.en;
    Object.keys(values).forEach((key) => {
      text = text.replace(new RegExp("\\{" + key + "\\}", "g"), values[key][locale] || values[key].en || "");
    });
    return text;
  }

  function buildQuestion(seed, stage, index) {
    const [roleId, role, background, challenge, impact] = seed;
    const variables = { role, background, challenge, impact, focus: ROLE_FOCUS[roleId] || ROLE_FOCUS.general };
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

  function getFollowUp(parentQuestion, kind) {
    const followUpKind = FOLLOW_UPS[kind] ? kind : "specificity";
    return {
      id: `${parentQuestion.id}-local-${followUpKind}-follow-up`,
      parentId: parentQuestion.id,
      roleId: parentQuestion.roleId,
      stage: parentQuestion.stage,
      text: { ...FOLLOW_UPS[followUpKind] },
      hint: { ...HINTS[parentQuestion.stage] },
      followUpKind,
      followUpEligible: false,
      isFollowUp: true,
      isClosing: false,
    };
  }

  function getReaction(personality, kind) {
    const tone = REACTIONS[personality] || REACTIONS.professional;
    return { ...(tone[kind] || tone.transition) };
  }

  function getRoleFocus(roleId) {
    return { ...(ROLE_FOCUS[roleId] || ROLE_FOCUS.general) };
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
    ROLE_FOCUS,
    getCareer,
    getDifficulty,
    getPlan,
    getFollowUp,
    getReaction,
    getRoleFocus,
    getQuestionSet,
    getHint,
  };
})();

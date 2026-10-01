/* ===========================================================
   Interview Quest — fallback question bank
   Used whenever the AI interviewer is unavailable. Also used
   to decide the pacing (question count) when AI IS available.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const ROLES = [
    { id: "general", label: "General / Any job" },
    { id: "developer", label: "Software developer" },
    { id: "customer-service", label: "Customer service" },
    { id: "marketing", label: "Marketing & sales" },
    { id: "retail", label: "Retail & hospitality" },
  ];

  const DIFFICULTIES = [
    { id: "easy", label: "Easy", questionCount: 4 },
    { id: "medium", label: "Medium", questionCount: 6 },
    { id: "hard", label: "Hard", questionCount: 8 },
  ];

  const BANK = {
    general: [
      "Tell me a little about yourself and why you're interested in this role.",
      "What would you say is your greatest strength, and how have you used it at work or school?",
      "Describe a time you faced a difficult problem. What did you do?",
      "Tell me about a time you disagreed with a teammate. How did you handle it?",
      "Why do you want to work for a company like this one?",
      "Describe a mistake you made at work or school. What did you learn from it?",
      "Where do you see yourself in the next few years?",
      "Do you have any questions for me?",
    ],
    developer: [
      "Tell me about yourself and your experience with software development.",
      "Walk me through a project you're proud of. What was your role?",
      "Describe a bug that was difficult to find. How did you debug it?",
      "How do you decide between two different technical approaches to a problem?",
      "Tell me about a time you had to learn a new technology quickly.",
      "How do you handle code review feedback you disagree with?",
      "Describe a time you had to work under a tight deadline.",
      "Do you have any questions for me?",
    ],
    "customer-service": [
      "Tell me about yourself and your experience helping customers.",
      "Describe a time you dealt with an upset or angry customer.",
      "Tell me about a time you couldn't solve a customer's problem right away. What did you do?",
      "How do you stay patient during a difficult conversation?",
      "Describe a time you went above and beyond for a customer.",
      "How would you handle several customers needing help at the same time?",
      "Tell me about a time you made a mistake with a customer. How did you fix it?",
      "Do you have any questions for me?",
    ],
    marketing: [
      "Tell me about yourself and your experience in marketing or sales.",
      "Describe a campaign or pitch you worked on. What was the result?",
      "Tell me about a time a campaign or idea didn't go as planned.",
      "How do you handle rejection when pitching an idea or closing a sale?",
      "Describe how you'd research a new audience for a product.",
      "Tell me about a time you had to persuade someone who disagreed with you.",
      "How do you measure whether your work is successful?",
      "Do you have any questions for me?",
    ],
    retail: [
      "Tell me about yourself and your experience in retail or hospitality.",
      "Describe a time you handled a very busy shift or a long line of customers.",
      "Tell me about a time a customer was unhappy with a product or service.",
      "How do you stay motivated during repetitive tasks?",
      "Describe a time you worked as a team to get something done quickly.",
      "Tell me about a time you had to follow a rule you didn't fully agree with.",
      "How would you handle a coworker who wasn't pulling their weight?",
      "Do you have any questions for me?",
    ],
  };

  const GENERIC_FOLLOW_UP =
    "Can you walk me through a specific example — what exactly you did, and what the result was?";

  function getHint(questionText) {
    const q = questionText.toLowerCase();
    if (q.startsWith("tell me a little about yourself") || q.startsWith("tell me about yourself")) {
      return "Keep it concise: your background, one or two relevant strengths, and why this role.";
    }
    if (q.includes("questions for me")) {
      return "Ask something genuine about the team, the role, or growth — it shows real interest.";
    }
    return "Try Situation → Task → Action → Result: briefly set the scene, say what you needed to do, what you did, and the outcome.";
  }

  function getQuestionSet(roleId, difficultyId) {
    const difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) || DIFFICULTIES[1];
    const list = BANK[roleId] || BANK.general;
    return list.slice(0, difficulty.questionCount).map((text) => ({
      text,
      hint: getHint(text),
    }));
  }

  IQ.questions = {
    ROLES,
    DIFFICULTIES,
    GENERIC_FOLLOW_UP,
    getQuestionSet,
    getHint,
  };
})();

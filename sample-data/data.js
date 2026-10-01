/* ===========================================================
   Interview Quest — made-up example data
   Loaded via a <script> tag (not fetch) so it works when the
   page is opened straight from disk, per project rules.
   Everything here is invented for demo purposes only.
   =========================================================== */
window.IQ = window.IQ || {};

IQ.sampleData = {
  meta: {
    roleLabel: "Customer service",
    difficulty: "medium",
    mode: "practice",
    usingAI: true,
  },
  transcript: [
    {
      question: "Tell me about yourself and your experience helping customers.",
      answer:
        "Sure — I've spent the last two years working at a small coffee shop where I was often the one handling complaints and training new staff on how to greet customers.",
    },
    {
      question: "That's great. Can you tell me about a time a customer was really upset about something?",
      answer:
        "Yes, once a customer got the wrong order during a rush and was pretty frustrated. I apologized right away, remade the drink myself, and offered a free pastry. She calmed down and actually became a regular after that.",
    },
    {
      question: "Nice — how do you usually stay patient when a conversation gets tense?",
      answer:
        "Um, I think I just try to listen first before replying, and I remind myself the customer isn't upset at me personally.",
    },
  ],
  report: {
    overallScore: 78,
    strengths: [
      "You stay calm and solution-focused under pressure.",
      "Good use of a specific, concrete example with a clear result.",
    ],
    weaknesses: [
      "A couple of answers were short on specific numbers or outcomes.",
      "One answer used a filler word ('um') at the start — a brief pause reads as more confident.",
    ],
    englishFeedback:
      "Your grammar was clear throughout. One filler word was detected. Try starting answers with a short, confident sentence before adding detail — it immediately signals structure to the interviewer.",
    perQuestion: [
      {
        question: "Tell me about yourself and your experience helping customers.",
        tip: "Good opening — you could add how many customers/day or a specific skill you're proud of.",
        improvedExample:
          "Situation: Two years at a busy coffee shop.\nTask: Front-line service plus training new staff.\nAction: Developed a quick-greeting routine I taught to 5 new hires.\nResult: Customer complaints dropped noticeably after the training rollout.",
      },
      {
        question: "That's great. Can you tell me about a time a customer was really upset about something?",
        tip: "Excellent — clear situation, action and a measurable result (she became a regular).",
        improvedExample:
          "Situation: Wrong order during a rush.\nTask: De-escalate and fix it fast.\nAction: Apologized, remade the drink myself, added a free pastry.\nResult: She became a repeat customer — a great outcome to quantify if you can (e.g. visits per month).",
      },
      {
        question: "Nice — how do you usually stay patient when a conversation gets tense?",
        tip: "Good instinct (listen first) — try cutting the 'um' and adding one concrete technique you use.",
        improvedExample:
          "Situation: Any tense customer conversation.\nTask: Keep the interaction calm and productive.\nAction: I listen fully before responding, and mentally separate the complaint from myself personally.\nResult: Conversations de-escalate faster and customers feel heard.",
      },
    ],
    nextSteps: [
      "Practice starting answers with one confident sentence before adding detail.",
      "Add a number or measurable outcome to at least one more story (e.g. repeat visits, time saved).",
      "Record yourself once and count filler words — aim for zero in your next practice run.",
    ],
  },
};

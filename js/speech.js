/* ===========================================================
   Interview Quest — speech layer
   Wraps the browser's Web Speech API:
     - speechSynthesis for the interviewer's voice (TTS)
     - SpeechRecognition for the candidate's microphone (STT)
   Both are optional: if unsupported, app.js falls back to the
   text-only input, which always works.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const hasTTS = "speechSynthesis" in window;
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSTT = !!SpeechRecognitionImpl;

  let voicesCache = [];
  function loadVoices() {
    voicesCache = hasTTS ? window.speechSynthesis.getVoices() : [];
    return voicesCache;
  }
  if (hasTTS) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  const FEMALE_HINTS = ["female", "zira", "aria", "jenny", "samantha", "victoria", "susan", "karen", "moira", "tessa", "joanna", "salli", "kimberly", "ivy", "hazel"];
  const MALE_HINTS = ["male", "david", "guy", "mark", "alex", "daniel", "fred", "tom", "matthew", "justin", "ryan", "eric", "james"];

  function pickVoice(genderPref) {
    const voices = voicesCache.length ? voicesCache : loadVoices();
    const englishVoices = voices.filter((v) => /^en/i.test(v.lang));
    const pool = englishVoices.length ? englishVoices : voices;
    if (!pool.length) return null;

    const hints = genderPref === "female" ? FEMALE_HINTS : MALE_HINTS;
    const match = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
    return match || pool[0] || null;
  }

  const PERSONALITY_TONE = {
    friendly: { rate: 1.0, pitch: 1.08 },
    professional: { rate: 1.0, pitch: 1.0 },
    strict: { rate: 1.05, pitch: 0.92 },
  };

  let currentUtterance = null;

  /**
   * Speak text aloud. Resolves when speech finishes (or immediately if TTS
   * is unsupported, so callers never hang).
   */
  function speak(text, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      if (!hasTTS || !text) {
        resolve(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const tone = PERSONALITY_TONE[opts.personality] || PERSONALITY_TONE.professional;
      utt.rate = tone.rate;
      utt.pitch = tone.pitch;
      const voice = pickVoice(opts.gender);
      if (voice) utt.voice = voice;

      utt.onstart = () => opts.onStart && opts.onStart();
      utt.onend = () => {
        opts.onEnd && opts.onEnd();
        resolve(true);
      };
      utt.onerror = () => {
        opts.onEnd && opts.onEnd();
        resolve(false);
      };
      currentUtterance = utt;
      window.speechSynthesis.speak(utt);
    });
  }

  function stopSpeaking() {
    if (hasTTS) window.speechSynthesis.cancel();
  }

  // ---------------- Speech-to-text ----------------
  let recognition = null;
  let finalBuffer = "";

  function startListening(handlers) {
    handlers = handlers || {};
    if (!hasSTT) {
      handlers.onError && handlers.onError("unsupported");
      return false;
    }
    finalBuffer = "";
    recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalBuffer = (finalBuffer + " " + chunk).trim();
        } else {
          interim += chunk;
        }
      }
      handlers.onFinal && handlers.onFinal(finalBuffer);
      handlers.onInterim && handlers.onInterim(interim);
    };
    recognition.onerror = (event) => {
      handlers.onError && handlers.onError(event.error);
    };
    recognition.onend = () => {
      handlers.onEnd && handlers.onEnd(finalBuffer);
    };

    try {
      recognition.start();
      return true;
    } catch (e) {
      handlers.onError && handlers.onError(String(e));
      return false;
    }
  }

  function stopListening() {
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        /* ignore */
      }
    }
  }

  IQ.speech = {
    hasTTS,
    hasSTT,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
})();

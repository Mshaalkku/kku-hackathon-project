/* ===========================================================
   Interview Quest — resilient browser speech layer
   Browser speech remains optional: typed answers always work.
   =========================================================== */
window.IQ = window.IQ || {};

(function () {
  const hasTTS = "speechSynthesis" in window;
  const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasSTT = Boolean(SpeechRecognitionImpl);
  const FEMALE_HINTS = ["female", "zira", "aria", "jenny", "samantha", "victoria", "susan", "karen", "moira", "tessa", "joanna", "salli", "kimberly", "ivy", "hazel"];
  const MALE_HINTS = ["male", "david", "guy", "mark", "alex", "daniel", "fred", "tom", "matthew", "justin", "ryan", "eric", "james"];
  const PERSONALITY_TONE = { friendly: { rate: 1, pitch: 1.08 }, professional: { rate: 1, pitch: 1 }, strict: { rate: 1.05, pitch: 0.92 } };

  let voicesCache = [];
  let speakOperation = 0;
  let activeRecognition = null;
  let recognitionOperation = 0;

  function loadVoices() {
    voicesCache = hasTTS ? window.speechSynthesis.getVoices() : [];
    return voicesCache;
  }
  if (hasTTS) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(genderPref) {
    const voices = voicesCache.length ? voicesCache : loadVoices();
    const english = voices.filter((voice) => /^en/i.test(voice.lang));
    const pool = english.length ? english : voices;
    if (!pool.length) return null;
    const hints = genderPref === "female" ? FEMALE_HINTS : MALE_HINTS;
    return pool.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) || pool[0];
  }

  function speak(text, options) {
    const opts = options || {};
    const operation = ++speakOperation;
    return new Promise((resolve) => {
      if (!hasTTS || !String(text || "").trim()) {
        resolve({ ok: false, reason: "unsupported" });
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const tone = PERSONALITY_TONE[opts.personality] || PERSONALITY_TONE.professional;
      utterance.rate = tone.rate;
      utterance.pitch = tone.pitch;
      const voice = pickVoice(opts.gender);
      if (voice) utterance.voice = voice;
      let settled = false;
      const watchdogMs = Math.max(9000, Math.min(45000, String(text).split(/\s+/).length * 600 + 4500));
      const settle = (result) => {
        if (settled || operation !== speakOperation) return;
        settled = true;
        clearTimeout(watchdog);
        if (opts.onEnd) opts.onEnd(result);
        resolve(result);
      };
      const watchdog = setTimeout(() => {
        if (operation === speakOperation) {
          try { window.speechSynthesis.cancel(); } catch (error) { /* no-op */ }
          settle({ ok: false, reason: "timeout" });
        }
      }, watchdogMs);
      utterance.onstart = () => { if (operation === speakOperation && opts.onStart) opts.onStart(); };
      utterance.onend = () => settle({ ok: true, reason: "end" });
      utterance.onerror = (event) => settle({ ok: false, reason: event.error || "speech_error" });
      window.speechSynthesis.speak(utterance);
    });
  }

  function stopSpeaking() {
    speakOperation += 1;
    if (hasTTS) {
      try { window.speechSynthesis.cancel(); } catch (error) { /* no-op */ }
    }
  }

  function normalizeRecognitionError(error) {
    const codes = {
      "not-allowed": "not_allowed",
      "service-not-allowed": "not_allowed",
      "no-speech": "no_speech",
      "audio-capture": "audio_capture",
      network: "network",
      aborted: "aborted",
      "language-not-supported": "unsupported",
    };
    return codes[error] || error || "speech_error";
  }

  function startListening(handlers, options) {
    const callbacks = handlers || {};
    const opts = options || {};
    if (!hasSTT) {
      callbacks.onError && callbacks.onError("unsupported");
      return { started: false, operation: null };
    }
    abortListening();
    const operation = ++recognitionOperation;
    const baseText = String(opts.initialText || "").trim();
    let finalBuffer = "";
    let started = false;
    let ended = false;
    const recognition = new SpeechRecognitionImpl();
    activeRecognition = recognition;
    recognition.lang = opts.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const current = () => operation === recognitionOperation && activeRecognition === recognition;
    const combinedFinal = () => [baseText, finalBuffer].filter(Boolean).join(baseText && finalBuffer ? " " : "").trim();
    const finish = (reason) => {
      if (ended || !current()) return;
      ended = true;
      if (activeRecognition === recognition) activeRecognition = null;
      callbacks.onEnd && callbacks.onEnd({ operation, text: combinedFinal(), reason });
    };

    recognition.onstart = () => {
      if (!current()) return;
      started = true;
      callbacks.onStart && callbacks.onStart({ operation });
    };
    recognition.onresult = (event) => {
      if (!current()) return;
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalBuffer = [finalBuffer, transcript].filter(Boolean).join(" ").trim();
        else interim += transcript + " ";
      }
      callbacks.onFinal && callbacks.onFinal({ operation, text: combinedFinal() });
      callbacks.onInterim && callbacks.onInterim({ operation, text: interim.trim(), combined: [combinedFinal(), interim.trim()].filter(Boolean).join(" ") });
    };
    recognition.onerror = (event) => {
      if (!current()) return;
      const reason = normalizeRecognitionError(event.error);
      if (reason !== "aborted") callbacks.onError && callbacks.onError(reason);
    };
    recognition.onend = () => finish(started ? "end" : "failed_to_start");

    try {
      recognition.start();
      return { started: true, operation };
    } catch (error) {
      if (current()) {
        activeRecognition = null;
        callbacks.onError && callbacks.onError("start_failed");
      }
      return { started: false, operation: null };
    }
  }

  function stopListening() {
    const recognition = activeRecognition;
    if (!recognition) return false;
    try {
      recognition.stop();
      return true;
    } catch (error) {
      return false;
    }
  }

  function abortListening() {
    recognitionOperation += 1;
    const recognition = activeRecognition;
    activeRecognition = null;
    if (!recognition) return false;
    try { recognition.abort(); } catch (error) { /* no-op */ }
    return true;
  }

  IQ.speech = { hasTTS, hasSTT, speak, stopSpeaking, startListening, stopListening, abortListening, normalizeRecognitionError };
})();

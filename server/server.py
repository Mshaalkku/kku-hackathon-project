"""Ready2Interview local-only server.

It serves the static app and makes narrowly validated Claude requests. The
browser never receives the Anthropic key, server prompts, provider errors, or
raw API responses. Without a key, the browser's complete local fallback runs.

Run: python server/server.py
Open: http://localhost:5000
"""
import http.server
import json
import os
import socketserver
import urllib.error
import urllib.request

PORT = 5000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MODEL = "claude-opus-5"
MAX_BODY_BYTES = 28000
MAX_ANSWER_CHARS = 5000
MAX_ENTRIES = 10
ALLOWED_LOCALES = {"en", "ar", "es", "fr", "de", "hi"}
ALLOWED_STAGES = {"introduction", "background", "role", "behavioral", "challenge", "impact", "growth", "closing"}
ALLOWED_ROLES = {
    "general", "software-engineering", "information-systems", "cybersecurity",
    "ai-machine-learning", "data-analysis", "it-support", "product-management",
    "project-management", "marketing", "finance-accounting", "human-resources", "sales",
    "ux-ui-design", "business-analysis", "customer-service", "healthcare-nursing",
    "education-teaching", "engineering", "administrative-office", "operations-supply-chain",
    "legal-law", "graphic-design-creative", "hospitality-tourism",
}
PERSONALITY = {
    "friendly": "warm and encouraging",
    "professional": "calm, neutral, and efficient",
    "strict": "formal, concise, and precise",
}


def load_env():
    """Tiny standard-library .env reader; the file stays local and ignored."""
    values = {}
    env_path = os.path.join(ROOT, ".env")
    if not os.path.exists(env_path):
        return values
    with open(env_path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


ENV = load_env()
API_KEY = ENV.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")


def as_text(value, maximum):
    return value.strip() if isinstance(value, str) and len(value.strip()) <= maximum else None


def localized_text(value):
    if not isinstance(value, dict):
        return None
    result = {}
    for locale, text in value.items():
        if locale in ALLOWED_LOCALES and isinstance(text, str) and len(text.strip()) <= 500:
            result[locale] = text.strip()
    return result


def memory_summary(value):
    if not isinstance(value, dict):
        return None
    allowed_keys = {"coveredStages", "technologies", "gaps", "priorFollowUpKinds"}
    if set(value) - allowed_keys:
        return None
    result = {}
    for key in allowed_keys:
        items = value.get(key, [])
        if not isinstance(items, list) or len(items) > 8 or any(not isinstance(item, str) or len(item.strip()) > 60 for item in items):
            return None
        result[key] = [item.strip() for item in items if item.strip()]
    return result


def provider_request(system, user_content, max_tokens, output_schema):
    """Use raw HTTPS deliberately: this project must have no Python packages."""
    if not API_KEY:
        raise RuntimeError("no_key")
    payload = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user_content}],
        "thinking": {"type": "adaptive"},
        "output_config": {
            "effort": "low",
            "format": {"type": "json_schema", "schema": output_schema},
        },
        "fallbacks": "default",
    }
    request = urllib.request.Request(
        ANTHROPIC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
            "anthropic-beta": "server-side-fallback-2026-07-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code == 429:
            raise RuntimeError("rate_limited") from error
        if error.code >= 500:
            raise RuntimeError("provider_unavailable") from error
        raise RuntimeError("provider_error") from error
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        raise RuntimeError("network_error") from error
    if result.get("stop_reason") == "refusal":
        raise RuntimeError("refused")
    pieces = [block.get("text", "") for block in result.get("content", []) if block.get("type") == "text"]
    text = "".join(pieces).strip()
    if not text:
        raise RuntimeError("empty_response")
    return text


def parse_json_response(text):
    """Provider output is treated as untrusted, even after clear prompting."""
    try:
        value = json.loads(text)
    except (TypeError, json.JSONDecodeError) as error:
        raise RuntimeError("invalid_response") from error
    if not isinstance(value, dict):
        raise RuntimeError("invalid_response")
    return value


FOLLOW_UP_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["advance", "follow_up"]},
        "questionEn": {"type": "string"},
        "questionTranslation": {
            "type": "object",
            "additionalProperties": {"type": "string"}
        },
    },
    "required": ["action"],
    "additionalProperties": False,
}

REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "report": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}},
                "englishFeedback": {"type": "string"},
                "nextSteps": {"type": "array", "items": {"type": "string"}},
                "perQuestion": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "questionId": {"type": "string"},
                            "tip": {"type": "string"},
                            "improvedExample": {"type": "string"},
                            "translation": {"type": "object", "additionalProperties": {"type": "object"}},
                        },
                        "required": ["questionId", "tip", "improvedExample", "translation"],
                        "additionalProperties": False,
                    },
                },
            },
            "required": ["summary", "strengths", "weaknesses", "englishFeedback", "nextSteps", "perQuestion"],
            "additionalProperties": False,
        },
        "translations": {"type": "object", "additionalProperties": {"type": "object"}},
    },
    "required": ["report", "translations"],
    "additionalProperties": False,
}


def follow_up_prompt(payload):
    personality = PERSONALITY.get(payload["personality"], PERSONALITY["professional"])
    translation_instruction = (
        "Also return a short translation of questionEn in the requested locale inside questionTranslation. "
        if payload["translationLanguage"] != "en" else ""
    )
    return (
        "You are a professional English mock-interviewer. This is educational practice, not a hiring decision. "
        "Decide whether one brief, content-specific follow-up will add value after the candidate's answer. "
        "Never score or judge the candidate. Do not ask a general filler question or repeat an already-covered topic. "
        f"Your tone is {personality}. The interview stage is {payload['stage']}. "
        f"A bounded session-only evidence summary is available: {json.dumps(payload['candidateMemory'], ensure_ascii=False)}. "
        "Use it only to avoid repetition or clarify a missing action, result, specificity, or role detail. "
        "Return ONLY compact valid JSON in this exact shape: "
        '{"action":"advance"} OR {"action":"follow_up","questionEn":"one spoken English question",'
        '"questionTranslation":{"LOCALE":"translation"}}. '
        "questionEn must be one question, under 48 words, and refer to a concrete detail from the answer. "
        f"{translation_instruction}"
    )


def report_prompt(payload):
    translation_instruction = (
        f"Also add a translations object with the requested locale '{payload['translationLanguage']}'. "
        "It may contain translated summary, strengths, weaknesses, englishFeedback, and nextSteps. "
        if payload["translationLanguage"] != "en" else ""
    )
    return (
        "You are an encouraging English interview coach for a practice app, not a real hiring assessor. "
        "Use the provided interview entries only. Do not invent claims or rewrite the candidate's answer. "
        "Return ONLY valid compact JSON with this exact shape: "
        '{"report":{"summary":"string","strengths":["string"],"weaknesses":["string"],'
        '"englishFeedback":"string","nextSteps":["string"],"perQuestion":[{"questionId":"id","tip":"string",'
        '"improvedExample":"string","translation":{"LOCALE":{"tip":"string","improvedExample":"string"}}}]},'
        '"translations":{"LOCALE":{"summary":"string","strengths":["string"],"weaknesses":["string"],'
        '"englishFeedback":"string","nextSteps":["string"]}}}. '
        "Use 2-4 concise strengths, 2-4 practical weaknesses, and 2-4 next steps. "
        "Include a perQuestion item only for an id supplied in the entries. "
        f"{translation_instruction}"
    )


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return None
        if length <= 0 or length > MAX_BODY_BYTES:
            return None
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None
        return value if isinstance(value, dict) else None

    def do_GET(self):
        if self.path == "/api/status":
            self._send_json(200, {"aiAvailable": bool(API_KEY), "mode": "local-proxy" if API_KEY else "fallback"})
            return
        super().do_GET()

    def do_POST(self):
        routes = {"/api/follow-up": self._handle_follow_up, "/api/report": self._handle_report}
        handler = routes.get(self.path)
        if not handler:
            self._send_json(404, {"ok": False, "error": "not_found"})
            return
        if not API_KEY:
            self._send_json(200, {"ok": False, "error": "no_key"})
            return
        data = self._read_body()
        if data is None:
            self._send_json(400, {"ok": False, "error": "bad_request"})
            return
        handler(data)

    def _handle_follow_up(self, data):
        stage = data.get("stage")
        payload = {
            "roleId": data.get("roleId"),
            "stage": stage,
            "questionId": as_text(data.get("questionId"), 100),
            "questionEn": as_text(data.get("questionEn"), 600),
            "answer": as_text(data.get("answer"), MAX_ANSWER_CHARS),
            "personality": data.get("personality"),
            "translationLanguage": data.get("translationLanguage"),
            "candidateMemory": memory_summary(data.get("candidateMemory")),
        }
        if (
            payload["roleId"] not in ALLOWED_ROLES or stage not in ALLOWED_STAGES or stage == "closing"
            or not payload["questionId"] or not payload["questionEn"] or not payload["answer"] or payload["candidateMemory"] is None
            or payload["personality"] not in PERSONALITY or payload["translationLanguage"] not in ALLOWED_LOCALES
        ):
            self._send_json(400, {"ok": False, "error": "bad_request"})
            return
        try:
            text = provider_request(follow_up_prompt(payload), json.dumps(payload, ensure_ascii=False), 260, FOLLOW_UP_SCHEMA)
            result = parse_json_response(text)
            action = result.get("action")
            if action == "advance":
                self._send_json(200, {"ok": True, "action": "advance"})
                return
            question = as_text(result.get("questionEn"), 360)
            translation = localized_text(result.get("questionTranslation", {})) or {}
            if action != "follow_up" or not question or "?" not in question:
                raise RuntimeError("invalid_response")
            self._send_json(200, {"ok": True, "action": "follow_up", "questionEn": question, "questionTranslation": translation})
        except RuntimeError as error:
            self._send_json(200, {"ok": False, "error": str(error)})

    def _handle_report(self, data):
        entries = data.get("entries")
        translation_language = data.get("translationLanguage")
        if not isinstance(entries, list) or not entries or len(entries) > MAX_ENTRIES or translation_language not in ALLOWED_LOCALES:
            self._send_json(400, {"ok": False, "error": "bad_request"})
            return
        clean_entries = []
        for entry in entries:
            if not isinstance(entry, dict):
                self._send_json(400, {"ok": False, "error": "bad_request"})
                return
            question_id = as_text(entry.get("questionId"), 100)
            question = as_text(entry.get("questionEn"), 600)
            answer = as_text(entry.get("answer"), MAX_ANSWER_CHARS)
            if not question_id or not question or answer is None:
                self._send_json(400, {"ok": False, "error": "bad_request"})
                return
            clean_entries.append({"questionId": question_id, "questionEn": question, "answer": answer, "skipped": bool(entry.get("skipped"))})
        payload = {
            "roleId": data.get("roleId") if data.get("roleId") in ALLOWED_ROLES else "general",
            "difficulty": data.get("difficulty") if data.get("difficulty") in {"easy", "medium", "hard"} else "medium",
            "mode": data.get("mode") if data.get("mode") in {"practice", "real"} else "practice",
            "translationLanguage": translation_language,
            "entries": clean_entries,
        }
        try:
            text = provider_request(report_prompt(payload), json.dumps(payload, ensure_ascii=False), 1600, REPORT_SCHEMA)
            result = parse_json_response(text)
            report = result.get("report")
            if not isinstance(report, dict):
                raise RuntimeError("invalid_response")
            allowed_ids = {entry["questionId"] for entry in clean_entries}
            valid_per_question = []
            for item in report.get("perQuestion", []):
                if not isinstance(item, dict) or item.get("questionId") not in allowed_ids:
                    continue
                valid_per_question.append({
                    "questionId": item["questionId"],
                    "tip": as_text(item.get("tip"), 400) or "",
                    "improvedExample": as_text(item.get("improvedExample"), 700) or "",
                    "translation": item.get("translation") if isinstance(item.get("translation"), dict) else {},
                })
            safe_report = {
                "summary": as_text(report.get("summary"), 500) or "",
                "strengths": [item for item in report.get("strengths", []) if isinstance(item, str)][:4],
                "weaknesses": [item for item in report.get("weaknesses", []) if isinstance(item, str)][:4],
                "englishFeedback": as_text(report.get("englishFeedback"), 700) or "",
                "nextSteps": [item for item in report.get("nextSteps", []) if isinstance(item, str)][:4],
                "perQuestion": valid_per_question,
            }
            self._send_json(200, {"ok": True, "report": safe_report, "translations": result.get("translations") if isinstance(result.get("translations"), dict) else {}})
        except RuntimeError as error:
            self._send_json(200, {"ok": False, "error": str(error)})


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    with ReusableTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        state = "ENABLED" if API_KEY else "DISABLED (no ANTHROPIC_API_KEY; built-in fallback is ready)"
        print(f"Ready2Interview running at http://localhost:{PORT}")
        print("AI interviewer:", state)
        httpd.serve_forever()


if __name__ == "__main__":
    main()

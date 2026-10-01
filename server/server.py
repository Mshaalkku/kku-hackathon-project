"""
Interview Quest - local dev server.

Serves the static frontend (index.html, css/, js/, sample-data/) AND
proxies AI requests to Anthropic's Claude API, so the API key never
reaches the browser. The key is read from a .env file in the project
root and lives only on this machine's filesystem.

If no key is configured, /api/status reports aiAvailable=false and the
frontend automatically falls back to the built-in rule-based interview
-- the app always works end to end, with or without AI.

Run:
    python server/server.py        (Windows)
    python3 server/server.py       (Mac/Linux)

Then open:
    http://localhost:5000
"""
import http.server
import json
import os
import socketserver
import urllib.error
import urllib.request

PORT = 5000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
MODEL = "claude-haiku-4-5-20251001"


def load_env():
    """Tiny .env parser -- standard library only, no third-party packages."""
    env = {}
    env_path = os.path.join(ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip().strip('"').strip("'")
    return env


ENV = load_env()
API_KEY = ENV.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass  # keep the console quiet during a demo

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/status":
            self._send_json(200, {"aiAvailable": bool(API_KEY)})
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            self._handle_chat()
        else:
            self._send_json(404, {"ok": False, "error": "not_found"})

    def _handle_chat(self):
        if not API_KEY:
            self._send_json(200, {"ok": False, "error": "no_key"})
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length)
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json(400, {"ok": False, "error": "bad_request"})
            return

        system = data.get("system", "")
        messages = data.get("messages", [])
        max_tokens = data.get("max_tokens", 500)

        body = json.dumps(
            {"model": MODEL, "max_tokens": max_tokens, "system": system, "messages": messages}
        ).encode("utf-8")

        req = urllib.request.Request(
            ANTHROPIC_URL,
            data=body,
            headers={
                "x-api-key": API_KEY,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                text = ""
                for block in result.get("content", []):
                    if block.get("type") == "text":
                        text += block.get("text", "")
                self._send_json(200, {"ok": True, "text": text})
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")
            self._send_json(200, {"ok": False, "error": "api_error", "detail": detail})
        except Exception as e:
            self._send_json(200, {"ok": False, "error": "network_error", "detail": str(e)})


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main():
    with ReusableTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Interview Quest running at http://localhost:{PORT}")
        print("AI interviewer:", "ENABLED" if API_KEY else "DISABLED (no ANTHROPIC_API_KEY in .env -- using practice question bank instead)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()

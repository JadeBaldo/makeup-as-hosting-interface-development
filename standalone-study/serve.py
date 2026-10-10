"""Serve the preview on this computer and open its start page (Python 3)."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    server = ThreadingHTTPServer(('127.0.0.1', 8765), handler)
except OSError:
    raise SystemExit('Port 8765 is busy. Close the previous preview server and try again.')
print('Altered Images: http://localhost:8765 — press Ctrl+C to stop')
webbrowser.open('http://localhost:8765')
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()

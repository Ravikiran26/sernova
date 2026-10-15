#!/usr/bin/env python3
"""Local dev server with clean-URL support (mirrors Vercel's cleanUrls:true)."""
import http.server
import os
import sys

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Strip query-string / fragment before resolving
        path = self.path.split('?')[0].split('#')[0]
        full = self.translate_path(path)

        # If the path doesn't exist but path.html does, serve the .html file
        if not os.path.exists(full) and os.path.exists(full + '.html'):
            self.path = path + '.html'

        super().do_GET()

    def log_message(self, fmt, *args):
        # Suppress noisy 304 / asset logs; only print errors and page loads
        code = args[1] if len(args) > 1 else ''
        if str(code).startswith('4') or str(code).startswith('5') or self.path.endswith('.html'):
            super().log_message(fmt, *args)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = http.server.HTTPServer(('', port), CleanURLHandler)
    print(f'SRENOVA local server → http://localhost:{port}')
    print('Press Control+C to stop.\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')

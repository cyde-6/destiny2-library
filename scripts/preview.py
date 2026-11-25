"""Serve the built library over loopback for local preview."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parents[1] / 'dist'
    if not (directory / 'index.html').is_file():
        parser.error('dist/index.html is missing. Run python scripts/build_static.py first.')
    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Preview at http://127.0.0.1:{server.server_port}/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Stream Recorder -- CLI entry point.

Usage:
    python main.py <stream_page_url> [options]

Examples:
    # Record a public stream (runs until Ctrl+C)
    python main.py https://chaturbate.com/someuser/

    # Record for 60 seconds
    python main.py https://chaturbate.com/someuser/ --duration 60

    # Record using cookies exported from your browser
    python main.py https://chaturbate.com/someuser/ --cookies cookies.txt

    # Record using cookies pulled directly from Chrome
    python main.py https://chaturbate.com/someuser/ --cookies-from-browser chrome

    # Custom output directory
    python main.py https://chaturbate.com/someuser/ -b edge -o "D:/my_recordings"
"""

import argparse
import sys

from recorder import record_stream


def main():
    parser = argparse.ArgumentParser(
        description="Record a live stream to a local video file.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "url",
        help="URL of the stream page (e.g. https://chaturbate.com/username/)",
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="recordings",
        help="Directory to save recordings (default: ./recordings)",
    )
    parser.add_argument(
        "--duration", "-d",
        type=int,
        default=None,
        metavar="SECONDS",
        help="Stop recording after this many seconds. "
             "Without this, recording runs until Ctrl+C.",
    )

    # -- Authentication options -----------------------------------------
    auth_group = parser.add_mutually_exclusive_group()
    auth_group.add_argument(
        "--cookies", "-c",
        metavar="FILE",
        help="Path to a Netscape/Mozilla cookies.txt file exported from "
             "your browser. Required for private/locked streams.",
    )
    auth_group.add_argument(
        "--cookies-from-browser", "-b",
        metavar="BROWSER",
        choices=["chrome", "firefox", "edge", "opera", "brave", "vivaldi", "safari"],
        help="Extract cookies directly from a browser. "
             "Choices: chrome, firefox, edge, opera, brave, vivaldi, safari.",
    )

    args = parser.parse_args()

    import signal
    
    def signal_handler(sig, frame):
        print("\n\nCancelled by user (Signal).")
        sys.exit(0)
        
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        record_stream(
            url=args.url,
            output_dir=args.output_dir,
            cookies_file=args.cookies,
            cookies_from_browser=args.cookies_from_browser,
            duration=args.duration,
        )
    except SystemExit:
        pass
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        sys.exit(0)


if __name__ == "__main__":
    main()

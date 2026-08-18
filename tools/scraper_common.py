#!/usr/bin/env python3
"""Shared helpers for the Padelle scraper tools.

Every scraper in this workspace writes its output under one shared root
(default ~/Scraper-export) with a single subfolder per tool, using the same
colored logging and the same CSV conventions.

The output root can be overridden with the SCRAPER_EXPORT_DIR environment
variable or with the --output-dir flag each script provides.
"""

import csv
import os
import sys

EXPORT_ENV = "SCRAPER_EXPORT_DIR"
DEFAULT_EXPORT_ROOT = os.path.expanduser("~/Scraper-export")

_ANSI = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "red": "\033[91m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "cyan": "\033[96m",
    "magenta": "\033[95m",
}


class Color:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"


def color(text, code):
    return f"{_ANSI[code]}{text}{_ANSI['reset']}"


def log_info(msg):
    print(f"{color('[INFO]', 'cyan')} {msg}")


def log_success(msg):
    print(f"{color('[SUCCESS]', 'bold')} {color(msg, 'green')}")


def log_warn(msg):
    print(f"{color('[WARN]', 'yellow')} {msg}")


def log_error(msg):
    print(f"{color('[ERROR]', 'bold')} {color(msg, 'red')}", file=sys.stderr)


def output_root():
    return os.environ.get(EXPORT_ENV) or DEFAULT_EXPORT_ROOT


def tool_dir(tool, output_dir=None):
    """Return (creating it if needed) the folder for a tool's output.

    A given --output-dir wins over the shared root.
    """
    base = output_dir or os.path.join(output_root(), tool)
    os.makedirs(base, exist_ok=True)
    return base


def write_csv(path, header, rows):
    """Write rows (lists or dicts) as a utf-8-sig CSV with a BOM header."""
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for row in rows:
            if isinstance(row, dict):
                writer.writerow([row.get(k, "") for k in header])
            else:
                writer.writerow(row)
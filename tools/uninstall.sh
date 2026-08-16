#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/padelleboxd"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"

rm -f "$BIN_DIR/padelle-boxd-export"
rm -f "$BIN_DIR/padelle-boxd-schedule"
rm -rf "$INSTALL_DIR"

echo "Removed $BIN_DIR/padelle-boxd-export"
echo "Removed $BIN_DIR/padelle-boxd-schedule"
echo "Removed $INSTALL_DIR"
echo "Note: your exported CSV/ICS files were not touched."
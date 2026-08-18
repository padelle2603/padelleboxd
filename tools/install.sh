#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/padelleboxd"
VENV_DIR="$INSTALL_DIR/venv"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

EXPORTER="$SRC_DIR/padelle-boxd-exporter.py"
SCHEDULE="$SRC_DIR/padelle-boxd-schedule.py"
COMMON="$SRC_DIR/scraper_common.py"

for f in "$EXPORTER" "$SCHEDULE" "$COMMON"; do
    if [ ! -f "$f" ]; then
        echo "Error: $f not found next to install.sh" >&2
        exit 1
    fi
done

mkdir -p "$INSTALL_DIR" "$BIN_DIR"
cp "$EXPORTER" "$SCHEDULE" "$COMMON" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR"/*.py

if [ ! -x "$VENV_DIR/bin/python" ]; then
    echo "Creating virtual environment in $VENV_DIR"
    python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet requests icalendar

cat > "$BIN_DIR/padelle-boxd-export" <<EOF
#!/usr/bin/env bash
exec "$VENV_DIR/bin/python" "$INSTALL_DIR/padelle-boxd-exporter.py" "\$@"
EOF
chmod +x "$BIN_DIR/padelle-boxd-export"

cat > "$BIN_DIR/padelle-boxd-schedule" <<EOF
#!/usr/bin/env bash
exec "$VENV_DIR/bin/python" "$INSTALL_DIR/padelle-boxd-schedule.py" "\$@"
EOF
chmod +x "$BIN_DIR/padelle-boxd-schedule"

echo "Installed: $BIN_DIR/padelle-boxd-export"
echo "Installed: $BIN_DIR/padelle-boxd-schedule"
echo "Run 'padelle-boxd-export' or 'padelle-boxd-schedule' for usage."
echo "Tip: ensure '$BIN_DIR' is in your PATH."
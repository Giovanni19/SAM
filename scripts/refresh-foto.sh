#!/bin/bash
# Rinnovo mensile delle foto in scadenza. Lanciato da launchd
# (~/Library/LaunchAgents/com.sam.refresh-foto.plist), non a mano.
#
# Perché serve: le foto prese da Google Maps sono URL firmati che scadono dopo
# settimane o mesi. Il piano free di SerpApi si rinnova ogni mese e il refresh
# costa una ricerca a posto, quindi il rinnovo è gratuito — va solo ricordato,
# ed è esattamente il compito che questo script toglie di mezzo.
#
# Per provarlo subito senza aspettare il primo del mese:
#   launchctl start com.sam.refresh-foto && tail -f ~/SAM/sam-web/scripts/refresh-foto.log
#
# Gli argomenti passati a questo script arrivano allo script node: serve per
# provare la catena completa senza bruciare la quota di un mese, per esempio
#   ./scripts/refresh-foto.sh --limit 1
# launchd lo chiama senza argomenti, quindi fa il rinnovo completo.

set -uo pipefail

PROGETTO="/Users/giovanni/SAM/sam-web"
NODE="/opt/homebrew/bin/node"
LOG="$PROGETTO/scripts/refresh-foto.log"

cd "$PROGETTO" || exit 1

{
  echo ""
  echo "═══ $(date '+%Y-%m-%d %H:%M') ═══"

  if [ ! -x "$NODE" ]; then
    echo "ERRORE: node non trovato in $NODE (aggiornato Homebrew?)"
    exit 1
  fi

  echo "→ rinnovo foto scadute"
  "$NODE" scripts/serpapi-photos.mjs --refresh --write "$@" 2>&1 | grep -v "attesa limite"

  # Lo snapshot va rigenerato solo se il rinnovo è andato a buon fine: uno
  # snapshot rigenerato dopo un errore congelerebbe lo stato sbagliato.
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    echo "→ rigenero lo snapshot locale"
    "$NODE" scripts/gen-mock-snapshot.mjs 2>&1 | head -2
  else
    echo "rinnovo fallito: snapshot non rigenerato"
  fi

  echo "═══ fine ═══"
} >> "$LOG" 2>&1

# Il log non deve crescere all'infinito: teniamo le ultime ~500 righe.
if [ "$(wc -l < "$LOG")" -gt 500 ]; then
  tail -n 500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

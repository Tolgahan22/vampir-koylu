#!/bin/bash
# Çift tıkla: Vampir Köylü'yü başlatır
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js yok. https://nodejs.org adresinden kur (ya da: brew install node)"; read -r; exit 1
fi
[ -d node_modules ] || npm install
[ -f .env ] || { cp .env.example .env; echo ".env oluşturuldu, içine Canlı yayın için TikTok kullanıcı adını yazman yeterli."; open -e .env; }
( sleep 2; open -a "Google Chrome" "http://localhost:${PORT:-3000}" 2>/dev/null || open "http://localhost:${PORT:-3000}" ) &
node server.js

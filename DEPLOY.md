# Deployment-Guide (Einsteigerfreundlich, Deutsch)

Dieses Projekt besteht aus:
- Frontend: Vite/React (im Ordner `frontend/`, Port 8080 im Dev), nutzt `VITE_API_URL` für API-Calls.
- Backend: FastAPI + SQLite (Ordner `backend/`, Port 8000), Environment über `backend/.env`.

Nachfolgend drei gängige Wege, wie du deployen kannst:

## 1) Alles als Container auf einem Ubuntu-VPS (empfohlen)
Voraussetzungen: Ubuntu-Server mit Docker und Docker Compose.

```bash
# Pakete aktualisieren
sudo apt update && sudo apt upgrade -y

# Docker & Compose (Plugin) installieren
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker

# Projekt holen (Beispiel via git)
git clone <REPO_URL> event-horizon && cd event-horizon

# .envs prüfen/anpassen
# backend/.env: Datenbank-Pfad, OPENROUTER_API_KEY, LLM_MODEL, CORS_ORIGINS
# frontend/.env: VITE_API_URL=http://<deine-domain-oder-ip>:8000/api

# Container starten (nur Backend in Compose)
docker compose up -d

# Prüfen
docker compose ps
curl http://localhost:8000/api/health
```

Frontend-Build bereitstellen: entweder separat hosten (siehe Variante 2/3) oder einen zusätzlichen Container hinzufügen, der `frontend/` baut und ausliefert (z.B. node:18-alpine mit `npm ci && npm run build` + Static Server).

## 2) Frontend auf Cloudflare Pages, Backend auf VPS
Voraussetzungen: Cloudflare Account, Ubuntu-Server für das Backend (Docker oder uvicorn).

### Backend auf VPS
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv
git clone <REPO_URL> event-horizon && cd event-horizon/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# backend/.env anpassen (API-Key, CORS_ORIGINS auf deine Pages-Domain)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
```
Optional als systemd-Service oder per Docker (siehe Variante 1).

### Frontend auf Cloudflare Pages
1. Neues Pages-Projekt erstellen, Repository verbinden.
2. Build-Befehl: `cd frontend && npm install && npm run build`
3. Build-Output: `frontend/dist`
4. Environment Variable in Pages: `VITE_API_URL` auf deine Backend-URL setzen, z.B. `https://api.deine-domain.tld/api`.
5. Deploy ausführen.

## 3) Frontend + Backend ohne Container auf Ubuntu (klassisch)
Nur empfehlenswert für kleine Setups/Tests.

### Backend
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
```

### Frontend
```bash
cd ../frontend
sudo apt install -y nodejs npm
npm install
VITE_API_URL=http://<server-ip>:8000/api npm run build
npx serve dist --listen 8080  # oder ein anderer Static-Server
```
Reverse-Proxy (Nginx/Caddy) davor schalten und TLS beibringen.

## Wichtige Umgebungsvariablen
- `VITE_API_URL` (Frontend): z.B. `https://api.deine-domain.tld/api`
- `OPENROUTER_API_KEY` (Backend): für LLM-Calls
- `LLM_MODEL` (Backend): z.B. `z-ai/glm-4.5-air:free`
- `CORS_ORIGINS` (Backend): deine Frontend-URL(s), kommasepariert
- `DATABASE_URL` (Backend): z.B. `sqlite:///./data/data.db` (Standard)

## Ports & Defaults
- Backend: 8000 (API unter `/api`)
- Frontend Dev: 8080 (Vite Dev Server)

## Health Checks
- Backend: `GET /api/health`
- Docs: `http://<backend>/docs`

## Tipps
- Immer `VITE_API_URL` korrekt setzen, sonst ruft das Frontend falsche Hosts auf.
- SQLite liegt unter `backend/data/data.db` (bei Compose ist der Ordner gemountet).
- Für Produktion TLS über Reverse-Proxy (Traefik/Nginx/Caddy) bereitstellen.

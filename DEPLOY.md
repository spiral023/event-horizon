# Deployment-Guide (Deutsch, UTF-8)

Dieses Projekt besteht aus:
- Frontend: Vite/React (Ordner `frontend/`, Dev-Port 8080), nutzt `VITE_API_URL` für API-Calls.
- Backend: FastAPI + SQLite (Ordner `backend/`, Port 8000), konfiguriert über `backend/.env`.

Nachfolgend ein schneller VPS-Deploy sowie zwei alternative Wege.

## Schneller VPS-Deploy (Docker Compose unter `/opt/compose`)
Voraussetzungen: Ubuntu-Server mit Docker und Docker Compose Plugin.

```bash
# Wechsel in den Compose-Ordner
cd /opt/compose

# Optional: altes Deployment sichern
sudo mv event-horizon event-horizon-old-$(date +%Y%m%d-%H%M) 2>/dev/null || true

# Repository holen
git clone https://github.com/spiral023/event-horizon.git event-horizon
cd event-horizon

# Backend-Umgebung setzen
cat << 'EOF' > backend/.env
DATABASE_URL=sqlite:///./data/data.db
SECRET_KEY=change-me-secure-db-pw
CORS_ORIGINS=https://event-horizon.sp23.online
OPENROUTER_API_KEY=sk-or-v1-49.... 
LLM_MODEL=z-ai/glm-4.5-air:free
EOF

# Container bauen und starten
docker compose build
docker compose up -d
```

Prüfen:
- `docker compose ps`
- `curl http://localhost:8000/api/health`
Die SQLite-Datei wird beim ersten Start unter `backend/data/data.db` erzeugt.

## 1) Alles als Container auf einem Ubuntu-VPS (allgemein)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker

git clone <REPO_URL> event-horizon && cd event-horizon
# .envs prüfen/anpassen:
# backend/.env: DATABASE_URL, SECRET_KEY, OPENROUTER_API_KEY, LLM_MODEL, CORS_ORIGINS
# frontend/.env: VITE_API_URL=http://<deine-domain-oder-ip>:8000/api

docker compose up -d
docker compose ps
curl http://localhost:8000/api/health
```
Frontend-Hosting: separat (siehe unten) oder eigenen Container ergänzen, der `frontend/` baut und statisch ausliefert.

## 2) Frontend auf Cloudflare Pages, Backend auf VPS
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
Optional als systemd-Service oder per Docker (Variante 1).

### Frontend auf Cloudflare Pages
1. Neues Pages-Projekt, Repository verbinden.
2. Build-Befehl: `cd frontend && npm install && npm run build`
3. Build-Output: `frontend/dist`
4. Environment Variable: `VITE_API_URL=https://<dein-backend>/api`
5. Deploy ausführen.

## 3) Frontend + Backend ohne Container auf Ubuntu
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
npx serve dist --listen 8080
```
Reverse-Proxy (Nginx/Caddy) davor schalten und TLS bereitstellen.

## Wichtige Umgebungsvariablen
- `VITE_API_URL` (Frontend): z.B. `https://api.deine-domain.tld/api`
- `OPENROUTER_API_KEY` (Backend): für LLM-Calls
- `LLM_MODEL` (Backend): z.B. `z-ai/glm-4.5-air:free`
- `CORS_ORIGINS` (Backend): deine Frontend-URL(s), kommasepariert
- `DATABASE_URL` (Backend): z.B. `sqlite:///./data/data.db`

## Ports & Checks
- Backend-Port: 8000 (`/api/health`, Swagger unter `/docs`)
- Frontend Dev: 8080 (Vite Dev Server)

## Update auf neue Version (Docker Compose)
Wenn sich das GitHub-Repo geändert hat:
```bash
cd /opt/compose/event-horizon
git fetch --all
git pull
docker compose build
docker compose up -d
```
Optional aufräumen (alte Images): `docker image prune -f`

## Tipps
- `VITE_API_URL` passend zur Backend-URL setzen, sonst ruft das Frontend falsche Hosts auf.
- SQLite liegt unter `backend/data/data.db` (wird bei Compose gemountet/angelegt).
- Für Produktion TLS via Reverse-Proxy (Traefik/Nginx/Caddy) aktivieren.

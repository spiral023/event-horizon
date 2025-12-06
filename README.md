# TeamVote – Event Planning & Voting (Vite + React + FastAPI)

TeamVote ist eine deutsche, mobile-first Web-App für Team-Events: Ideen sammeln (Tinder-Style Voting inkl. Super-Like/Mystery), Termine finden, Budget einsammeln (Stretch Goals, Wall of Fame), Analytics und QR-Onboarding. Frontend (Ordner `frontend/`) spricht mit dem FastAPI-Backend (SQLite).

## Features
- Onboarding per Abteilungscode oder QR-Scan/QR-Share
- Voting-Deck (Swipe/Buttons) mit Super-Like (x3) und Mystery-Card
- Scheduling (14-Tage Raster), Budget-Topf mit Stretch Goals und Badges
- Wall of Fame, Team-Analytics (Persona, Participation, Kategorie-Fokus)
- PWA/Offline-Cache (Service Worker), Dark UI
- Mock-Daten entfernt – Frontend nutzt API (`VITE_API_URL`)

## Tech Stack
- Frontend: Vite, React, TypeScript, Tailwind, shadcn-ui, Framer Motion, Zustand, React Router
- Backend: FastAPI, SQLModel/SQLite
- Infra: Docker Compose (Backend), optional Cloudflare Pages für das Frontend

## Schnellstart (lokal)
```bash
# Voraussetzungen: Node 18+, npm; Python 3.10+; optional Docker

# Backend (venv)
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (neues Terminal)
cd frontend
npm install
VITE_API_URL=http://localhost:8000/api npm run dev
# App unter http://localhost:8080/
```

Alternativ: `scripts/start-app.ps1` (Windows, startet Backend+Frontend) oder `docker compose up -d` (Backend-Container; nur Backend).

## Env Variablen
- `frontend/.env`: `VITE_API_URL=http://localhost:8000/api`
- `backend/.env`: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `OPENROUTER_API_KEY`, `LLM_MODEL`

## Deployment
- **Container auf VPS (empfohlen):** Docker & Compose installieren, `.env` setzen, `docker compose up -d`, Health: `http://<host>:8000/api/health`. Siehe `DEPLOY.md` für ein ausführliches Schnell-Setup unter `/opt/compose`.
- **Cloudflare Pages (Frontend) + VPS (Backend):** Backend mit uvicorn oder Docker auf Port 8000 bereitstellen, `CORS_ORIGINS` auf Pages-Domain setzen, in Pages `VITE_API_URL=https://<dein-backend>/api` setzen, `npm run build`/`dist` als Output.
- **Klassisch ohne Container:** Backend via venv + `uvicorn app.main:app --host 0.0.0.0 --port 8000`; Frontend bauen (`VITE_API_URL=http://<host>:8000/api npm run build`) und als Static Files (z.B. `npx serve dist`) hinter einen Reverse-Proxy legen.

Details, Befehle und Beispiele findest du in `DEPLOY.md`.

## Tests / Health
- Backend Health: `GET /api/health`
- Swagger: `http://localhost:8000/docs`
- OpenRouter-Test: `powershell -ExecutionPolicy Bypass -File scripts/test-openrouter.ps1`

## Hinweise
- Sprache/UI: Deutsch, UTF-8 beibehalten.
- Datenbank: `backend/data/data.db` (SQLite, per Docker-Volume gemountet).
- PWA: Service Worker cached Kernassets; `npm run build && npm run preview` zum Prüfen.

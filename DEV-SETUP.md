# Local Development Setup

Dieser Guide zeigt, wie du EventHorizon lokal entwickeln kannst.

## Voraussetzungen

- **Docker Desktop** (empfohlen) oder Docker + Docker Compose
- **VS Code** (optional, aber empfohlen)
- **Git**

Optional für Entwicklung ohne Docker:
- Node.js 18+ und npm
- Python 3.10+

---

## 🚀 Schnellstart mit Docker (Empfohlen)

### Option 1: PowerShell Script (Windows)

```powershell
# Starten
.\scripts\dev-start.ps1

# Beim ersten Mal oder nach Dependencies-Änderungen
.\scripts\dev-start.ps1 -Build

# Logs anzeigen
.\scripts\dev-logs.ps1

# Stoppen
.\scripts\dev-stop.ps1
```

### Option 2: Docker Compose direkt

```bash
# Starten
docker compose -f docker-compose.dev.yml up -d

# Mit Build
docker compose -f docker-compose.dev.yml up --build -d

# Logs
docker compose -f docker-compose.dev.yml logs -f

# Stoppen
docker compose -f docker-compose.dev.yml down
```

### Option 3: Makefile (Git Bash/WSL/Linux/Mac)

```bash
# Hilfe anzeigen
make help

# Starten
make dev-up

# Mit Build
make dev-build

# Logs
make dev-logs

# Stoppen
make dev-down
```

### Option 4: VS Code Tasks

1. Öffne VS Code
2. Drücke `Ctrl+Shift+P` (Windows) oder `Cmd+Shift+P` (Mac)
3. Suche "Tasks: Run Task"
4. Wähle "Dev: Start (Docker)"

Oder nutze die Tastenkombination `Ctrl+Shift+B` für die Default Build Task.

---

## 📡 URLs nach Start

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **API Health:** http://localhost:8000/api/health
- **API Docs (Swagger):** http://localhost:8000/docs

---

## 🔥 Hot Reload

Beide Services (Frontend & Backend) haben **Hot Reload** aktiviert:

- **Frontend:** Änderungen in `frontend/src/` werden sofort übernommen
- **Backend:** Änderungen in `backend/app/` werden automatisch neu geladen

Du musst die Container **nicht** neu starten!

---

## 📝 Environment Variables

### Lokale Development-Dateien

- `frontend/.env.local` - Frontend Environment (zeigt auf localhost:8000)
- `backend/.env.local` - Backend Environment

Diese Dateien sind bereits korrekt konfiguriert und werden **nicht** ins Git committed.

### Production-Dateien

- `frontend/.env` - Zeigt auf `https://event-horizon-api.sp23.online/api`
- `backend/.env` - Production Secrets

**Wichtig:** Ändere NIEMALS die `.env` Dateien für lokales Development! Nutze `.env.local`.

---

## 🐛 Debugging

### Backend (Python)

Option 1: Logs anzeigen
```bash
docker compose -f docker-compose.dev.yml logs -f api
```

Option 2: In Container interaktiv
```bash
docker compose -f docker-compose.dev.yml exec api bash
# Dann: python -m pdb app/main.py
```

### Frontend (JavaScript/TypeScript)

1. Öffne Browser DevTools (F12)
2. Nutze `console.log()` oder Breakpoints
3. Oder nutze VS Code Debugger mit Chrome Extension

---

## 🔧 Entwicklung ohne Docker

Falls du Docker nicht nutzen möchtest:

### Backend starten

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Kopiere .env.local zu .env
cp .env.local .env

uvicorn app.main:app --reload --port 8000
```

### Frontend starten

```bash
cd frontend
npm install

# Kopiere .env.local zu .env
cp .env.local .env

npm run dev
```

**Wichtig:** Stelle sicher, dass `VITE_API_URL=http://localhost:8000/api` gesetzt ist!

---

## 🧪 Testing

### Backend Tests (noch nicht implementiert)

```bash
docker compose -f docker-compose.dev.yml exec api pytest
```

### Frontend Tests (noch nicht implementiert)

```bash
cd frontend
npm run test
```

---

## 🗄️ Datenbank

Die SQLite-Datenbank wird automatisch erstellt:
- **Lokation:** `backend/data/data.db`
- **Mounted als Volume** in Docker

### Datenbank zurücksetzen

```bash
# Container stoppen
docker compose -f docker-compose.dev.yml down

# Datenbank löschen
rm backend/data/data.db

# Container neu starten (DB wird neu erstellt)
docker compose -f docker-compose.dev.yml up -d
```

---

## 🚨 Troubleshooting

### Port bereits in Verwendung

```
Error: Bind for 0.0.0.0:8000 failed: port is already allocated
```

**Lösung:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Frontend kann Backend nicht erreichen

**Problem:** Frontend zeigt API-Fehler

**Lösung:**
1. Prüfe `frontend/.env.local`: Muss `VITE_API_URL=http://localhost:8000/api` sein
2. Prüfe Backend Health: http://localhost:8000/api/health
3. Container neu starten: `make dev-restart`

### Docker Images neu bauen

Falls Dependencies aktualisiert wurden:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### CORS-Fehler

**Problem:** Browser zeigt CORS-Fehler

**Lösung:**
1. Prüfe `backend/.env.local`
2. Stelle sicher, dass `CORS_ORIGINS` localhost enthält:
   ```
   CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:5174
   ```
3. Backend neu starten

---

## 📦 Dependencies updaten

### Backend

```bash
cd backend
pip install -r requirements.txt
# Dann Container neu bauen
docker compose -f docker-compose.dev.yml up --build -d
```

### Frontend

```bash
cd frontend
npm install
# Dann Container neu bauen
docker compose -f docker-compose.dev.yml up --build -d
```

---

## 🎯 Best Practices

1. **Nutze immer `.env.local` für lokale Entwicklung**
2. **Committe niemals `.env` oder `.env.local` Dateien**
3. **Nutze Docker für konsistente Entwicklungsumgebung**
4. **Prüfe Logs bei Problemen:** `make dev-logs` oder `.\scripts\dev-logs.ps1`
5. **Hot Reload nutzen** statt Container neu zu starten

---

## 🆘 Hilfe

Wenn etwas nicht funktioniert:

1. Prüfe die Logs: `docker compose -f docker-compose.dev.yml logs`
2. Prüfe Container Status: `docker compose -f docker-compose.dev.yml ps`
3. Prüfe `.env.local` Dateien
4. Versuche einen Clean Restart:
   ```bash
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml up --build -d
   ```

# 🚀 Quick Start - Lokale Entwicklung

## TL;DR - Schnellster Weg

```powershell
# 1. Docker starten
.\scripts\dev-start.ps1

# 2. Browser öffnen
# Frontend: http://localhost:8080
# Backend: http://localhost:8000/docs
```

**Das war's!** 🎉

---

## Was passiert im Hintergrund?

Das `dev-start.ps1` Script:
1. ✅ Prüft ob Docker läuft
2. ✅ Erstellt `.env.local` Dateien falls nicht vorhanden
3. ✅ Startet Backend (FastAPI) auf Port 8000
4. ✅ Startet Frontend (Vite) auf Port 8080
5. ✅ Aktiviert Hot Reload für beide Services

### Hot Reload bedeutet:
- 💾 Speichere eine Datei
- 🔄 Browser aktualisiert sich automatisch
- 🎯 Keine Container-Neustarts nötig!

---

## Wichtige URLs

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Frontend** | http://localhost:8080 | Die React App |
| **Backend API** | http://localhost:8000 | API Basis-URL |
| **API Health** | http://localhost:8000/api/health | Health Check |
| **API Docs** | http://localhost:8000/docs | Swagger UI (interaktiv!) |

---

## Häufige Aufgaben

### Logs anzeigen

```powershell
# Alle Logs
.\scripts\dev-logs.ps1

# Nur Backend
.\scripts\dev-logs.ps1 api

# Nur Frontend
.\scripts\dev-logs.ps1 web
```

### Services stoppen

```powershell
.\scripts\dev-stop.ps1
```

### Services neu starten

```powershell
.\scripts\dev-stop.ps1
.\scripts\dev-start.ps1
```

### Nach Dependencies-Update (package.json oder requirements.txt)

```powershell
.\scripts\dev-start.ps1 -Build
```

---

## Alternative: Makefile (Git Bash / WSL)

```bash
make dev-up      # Starten
make dev-logs    # Logs
make dev-down    # Stoppen
make dev-restart # Neu starten
make help        # Alle Commands
```

---

## Alternative: VS Code

1. Öffne Command Palette: `Ctrl+Shift+P`
2. Suche: "Tasks: Run Task"
3. Wähle: "Dev: Start (Docker)"

Oder nutze **Tastenkombination:** `Ctrl+Shift+B`

---

## Erste Schritte in der App

1. **Öffne:** http://localhost:8080
2. **Gib einen Abteilungscode ein:** z.B. `TEST-123`
3. **Erstelle eine Kampagne:**
   - Name: "Team-Event Sommer 2025"
   - Budget: 2000€
   - Datum: "KW 25-30"
   - Region: OOE (Oberösterreich)
4. **Vote auf Events:** Tinder-Style Swipe!
5. **Budget einsammeln:** Beiträge hinzufügen

---

## Troubleshooting

### Problem: "Port bereits verwendet"

**Lösung:**
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Oder einfach Docker Desktop komplett neu starten
```

### Problem: "Frontend kann Backend nicht erreichen"

**Lösung:**
1. Prüfe `frontend/.env.local`:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```
2. Health Check: http://localhost:8000/api/health
3. Wenn nicht erreichbar:
   ```powershell
   docker compose -f docker-compose.dev.yml restart api
   ```

### Problem: "Container startet nicht"

**Lösung:**
```powershell
# Clean Restart
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build -d
```

### Problem: "Ich sehe meine Code-Änderungen nicht"

**Mögliche Ursachen:**
1. **Browser-Cache:** Drücke `Ctrl+Shift+R` (Hard Reload)
2. **Volume Mount:** Prüfe ob Container läuft:
   ```powershell
   docker compose -f docker-compose.dev.yml ps
   ```
3. **Node Modules:** Bei Frontend-Problemen:
   ```powershell
   cd frontend
   npm install
   .\scripts\dev-start.ps1 -Build
   ```

---

## Was ist anders als Production?

| Aspekt | Development | Production |
|--------|------------|------------|
| **Frontend URL** | localhost:8080 | event-horizon.sp23.online |
| **Backend URL** | localhost:8000 | event-horizon-api.sp23.online |
| **Hot Reload** | ✅ Aktiviert | ❌ Deaktiviert |
| **Source Maps** | ✅ Aktiviert | ❌ Deaktiviert |
| **Minification** | ❌ Aus | ✅ Aktiviert |
| **Docker Volumes** | Source-Code gemountet | Build-Artefakte only |
| **CORS** | Localhost erlaubt | Nur sp23.online |
| **Secret Key** | `dev-secret-key...` | Sicherer Token |

---

## Environment Variables

### Frontend (`.env.local`)
```bash
VITE_API_URL=http://localhost:8000/api
```

### Backend (`.env.local`)
```bash
DATABASE_URL=sqlite:///./data/data.db
SECRET_KEY=dev-secret-key-only-for-local-development
CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:5174
ENVIRONMENT=development
OPENROUTER_API_KEY=sk-or-v1-...
LLM_MODEL=z-ai/glm-4.5-air:free
```

**⚠️ WICHTIG:** Ändere **NIEMALS** die `.env` Dateien für lokales Development!
Die `.env.local` Dateien werden automatisch verwendet und überschreiben `.env`.

---

## Datenbank zurücksetzen

```powershell
# Services stoppen
.\scripts\dev-stop.ps1

# Datenbank löschen
Remove-Item backend\data\data.db

# Services neu starten (DB wird automatisch neu erstellt)
.\scripts\dev-start.ps1
```

---

## Performance-Tipps

1. **Docker Desktop:** Gib mindestens 4GB RAM und 2 CPUs
2. **WSL 2:** Aktiviere WSL 2 Backend in Docker Desktop
3. **Exclude from Antivirus:**
   - `C:\Users\asi\Documents\GitHub\event-horizon`
   - Docker Desktop

---

## Nächste Schritte

📖 **Mehr Details:** Siehe [DEV-SETUP.md](DEV-SETUP.md)

🐛 **Debugging:** VS Code Debugger Setup in [DEV-SETUP.md](DEV-SETUP.md#debugging)

🧪 **Testing:** (Coming soon)

📦 **Production Deployment:** Siehe [DEPLOY.md](DEPLOY.md)

---

## Hilfe gebraucht?

1. **Logs prüfen:** `.\scripts\dev-logs.ps1`
2. **Container Status:** `docker compose -f docker-compose.dev.yml ps`
3. **Health Check:** http://localhost:8000/api/health
4. **Clean Restart:**
   ```powershell
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml up --build -d
   ```

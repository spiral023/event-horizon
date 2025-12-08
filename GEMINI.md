# Gemini Project Context: TeamVote (Event Horizon)

This document provides context for the "TeamVote" (repo: `event-horizon`) project, a German-language, mobile-first web application for team event planning.

## Project Overview

TeamVote is a full-stack application designed for planning and coordinating team events. It features a Vite/React frontend and a Python/FastAPI backend. The application is designed to be mobile-first and includes features like event idea voting, scheduling, budget tracking, and user analytics.

### Key Technologies

*   **Frontend:**
    *   **Framework:** Vite + React 18
    *   **Language:** TypeScript (Strict Mode enabled)
    *   **UI:** Tailwind CSS with shadcn/ui components (Radix UI based)
    *   **State Management:** Zustand + React Query (@tanstack/react-query)
    *   **Routing:** React Router DOM
    *   **Features:** QR Code scanning/generation, Framer Motion animations, Recharts
    *   **Linting:** ESLint + Prettier

*   **Backend:**
    *   **Framework:** FastAPI
    *   **Language:** Python 3.12+
    *   **Database:** SQLite (via SQLModel/SQLAlchemy)
    *   **Security:** SlowAPI (Rate Limiting), CORSMiddleware
    *   **Server:** Uvicorn

*   **Infrastructure & Deployment:**
    *   **Containerization:** Docker & Docker Compose
    *   **Reverse Proxy:** Traefik (handles SSL/TLS and routing for `event-horizon.sp23.online`)
    *   **Orchestration:** `docker-compose.yml` defines `api`, `web` (frontend), and `traefik` integration.

## Building and Running the Project

The project is a monorepo containing the `frontend` and `backend` services.

### Local Development (Manual)

**1. Start the Backend:**

*   Navigate to the `backend` directory.
*   Ensure virtual environment is active.
*   Install dependencies: `pip install -r requirements.txt`
*   Run the server: `uvicorn app.main:app --reload --port 8000`

**2. Start the Frontend:**

*   Navigate to the `frontend` directory.
*   Install dependencies: `npm install`
*   Run the development server: `npm run dev`
*   Access at: `http://localhost:5173` (Vite default) or port defined in console.

### Local Development (Automated Scripts)

*   **Windows:**
    *   `scripts/dev-start.ps1`: Starts both backend and frontend in development mode.
    *   `scripts/start-app.ps1`: Alternative startup script.
    *   `scripts/rebuild-frontend.ps1`: Rebuilds the frontend artifacts.

### Docker Environment

*   Run `docker compose up -d` from the project root.
*   This setup uses Traefik and mirrors the production environment.
*   **Domains (Local/Traefik):**
    *   Frontend: `https://event-horizon.sp23.online` (requires hosts entry or DNS)
    *   API: `https://event-horizon-api.sp23.online`

## Directory Structure

*   `backend/`: FastAPI application code.
    *   `app/`: Main application logic (routes, models, services).
    *   `data/`: SQLite database storage.
*   `frontend/`: React application code.
    *   `src/components/`: Reusable UI components (shadcn/ui).
    *   `src/features/`: Feature-specific logic (auth, voting, etc.).
    *   `src/pages/`: Route components.
    *   `src/store/`: Zustand state stores.
*   `scripts/`: Utility scripts for devops, database management, and backups.
    *   `export_events_to_csv.py` / `import_events_from_csv.py`: Data migration tools.

## Development Conventions

*   **Language:** The UI and comments are primarily in **German**.
*   **Type Safety:** TypeScript `strictNullChecks` and `noImplicitAny` are enabled.
*   **Accessibility:**
    *   All icon-only buttons must have `aria-label`.
    *   Semantic HTML is preferred.
*   **API Communication:** Frontend uses a configured API client (likely Axios or Fetch wrapper) pointing to `VITE_API_URL`.
*   **Database:** Local SQLite (`backend/data/data.db`) is used for persistence.

## Current Status (Phase 3 Completed)

*   **TypeScript:** Strict mode fully enabled.
*   **Accessibility:** ARIA labels added, keyboard navigation verified.
*   **Pending (Phase 4):** Comprehensive testing (Jest/Pytest), CI/CD pipeline.

## Gemini Memories

- **Testing:** Führe nicht automatisch Tests aus (Do not automatically run tests).
- **Functionality:** User prefers to cache external .ics calendar feeds for 24 hours to avoid rate limits.
- **Architecture:** Model configuration (Council/Chairman) is now managed by the backend (`config.py`, `models_data.py`) and exposed via API, allowing frontend configuration. `start.ps1` is no longer the sole source of truth for available models.

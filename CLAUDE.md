# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeamVote is a German mobile-first web app for team event planning with Tinder-style voting, scheduling, budget collection, and analytics. The project uses a monorepo structure with separate frontend and backend directories.

## Development Commands

### Backend (FastAPI + SQLite)
```bash
# From backend/ directory
python -m venv .venv
.venv\Scripts\activate              # Windows
# source .venv/bin/activate         # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Health check:** `GET http://localhost:8000/api/health`
**API docs:** `http://localhost:8000/docs` (Swagger UI)

### Frontend (Vite + React + TypeScript)
```bash
# From frontend/ directory
npm install
npm run dev                         # Dev server on port 8080
npm run build                       # Production build
npm run preview                     # Preview production build
npm run lint                        # ESLint
```

**Frontend dev URL:** `http://localhost:8080`

### Quick Start Scripts
- `scripts/start-app.ps1` - Windows PowerShell script to start both backend and frontend
- `scripts/test-openrouter.ps1` - Test OpenRouter API integration

### Docker Deployment
```bash
docker compose build
docker compose up -d
docker compose ps
```

## Architecture

### Backend Structure (`backend/`)
- **Entry point:** `app/main.py` - FastAPI app with CORS middleware and request logging
- **Database:** SQLite with SQLModel ORM (`app/core/database.py`)
  - Auto-creates `backend/data/data.db` on first run
  - Seeds event options for 5 Austrian regions (OOE, Tirol, Sbg, Stmk, Ktn)
  - Manual schema migrations via `_ensure_voting_deadline_column()` pattern
- **Models:** `app/models/domain.py` - SQLModel tables (Department, Campaign, EventOption, Vote, etc.)
- **Routes:** `app/api/routes/` - API endpoints organized by resource
  - `/api/campaigns` - Campaign CRUD, voting, availability, contributions, analytics
  - `/api/events` - Event options by region
  - `/api/rooms` - QR code onboarding tokens
  - `/api/health` - Health check endpoint
- **Services:** `app/services/` - Business logic (analytics, budget, campaign hydration)
- **Config:** `app/core/config.py` - Pydantic settings from `.env`

### Frontend Structure (`frontend/src/`)
- **Entry point:** `main.tsx` → `App.tsx` (React Router with Tanstack Query)
- **Routing:** React Router v6 in `App.tsx`
  - `/` - Index/onboarding page
  - `/dashboard` - Campaign list
  - `/voting/:id` - Tinder-style voting deck
  - `/campaign/:id` - Campaign detail with tabs (activities, scheduling, budget, analytics)
  - `/create` - Create campaign form
  - `/qr-scan` & `/qr-create` - QR onboarding
- **State:** Zustand store (`store/appStore.ts`) with persistence
  - Stores: deptCode, user profile, current campaign, votes, super-like state
- **API Client:** `services/apiClient.ts`
  - Single source of truth for API calls
  - Uses `VITE_API_URL` environment variable (defaults to `http://localhost:8000/api`)
  - All requests go through `request<T>()` helper with error handling
  - Transforms backend responses (number conversion, campaign hydration)
- **Features:** Organized by domain (`features/`)
  - `auth/` - Department code and QR onboarding
  - `voting/` - TinderDeck swipe interface
  - `budget/` - Contribution form, stretch goals, Wall of Fame
  - `scheduling/` - DateGrid availability selector
  - `analytics/` - TeamAnalytics visualization
  - `campaigns/` - CampaignList component
- **UI:** shadcn/ui components (`components/ui/`) + Tailwind CSS

### Key Data Flow
1. **Onboarding:** User enters department code → creates/loads UserProfile → navigates to Dashboard
2. **Campaign Creation:** CreateCampaign form → `createCampaign()` → backend auto-assigns event options based on region/season
3. **Voting:** TinderDeck → local vote collection → `submitVotes()` batch submission with session_id
4. **Scheduling:** DateGrid → `submitAvailability()` with session_id
5. **Budget:** ContributionForm → `submitContribution()` → unlocks stretch goals → updates Wall of Fame

### Session Management
- Frontend generates `session_id` (UUID) stored in localStorage (`utils/storage.ts`)
- Backend tracks votes/availability by `session_id` OR `user_id` (allows anonymous participation)

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite:///./data/data.db
SECRET_KEY=change-me
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
OPENROUTER_API_KEY=sk-or-v1-...
LLM_MODEL=z-ai/glm-4.5-air:free
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000/api
```

## Important Patterns

### Backend
- **Dependency injection:** Use `Depends(get_session)` for DB sessions in route handlers
- **Model hydration:** `hydrate_campaign()` and `hydrate_campaigns()` attach related data (event_options, stretch_goals, contributions) to campaigns
- **Enum types:** Use string enums (CampaignStatus, EventCategory, BadgeType) defined in models
- **ID generation:** `gen_id()` uses `uuid4().hex` for all primary keys

### Frontend
- **API calls:** Always use functions from `services/apiClient.ts`, never raw fetch
- **Number handling:** Backend sends numbers as strings for some fields; apiClient maps to `Number()`
- **Type safety:** Types defined in `types/domain.ts` match backend schemas
- **Routing:** Use `<NavLink>` component instead of raw `<Link>` for active states
- **State persistence:** Zustand store auto-persists to localStorage as `eventhorizon-storage`

## Region & Season System

Backend seeds 7+ event options per region (OOE, Tirol, Sbg, Stmk, Ktn). Each event has:
- `season` field: `"all_year"`, `"summer"`, or `"winter"`
- Frontend's `getSeasonFromDate()` infers season from campaign's `target_date_range` string
  - Detects German keywords (Sommer, Winter), month names, calendar week ranges (KW)
  - Filters event options accordingly in `resolveEventOptions()`

## Database

- **SQLite file location:** `backend/data/data.db` (created on first run)
- **Schema changes:** No formal migrations; use pattern from `_ensure_voting_deadline_column()` for additive changes
- **Seeding:** `seed_event_options()` runs on every startup but checks if data exists first

## Language & Localization

- **UI language:** German (Deutsch)
- **Encoding:** UTF-8 throughout
- **Date formats:** Use German conventions ("KW 10-25", "Juni 2025")
- All user-facing text, error messages, and event descriptions are in German

## Testing

No automated tests currently in the project. For manual testing:
- Backend: Use Swagger UI at `/docs` or curl/Postman
- Frontend: Manual browser testing, React DevTools for state inspection
- OpenRouter integration: `scripts/test-openrouter.ps1`

## Deployment Notes

See `DEPLOY.md` for full deployment instructions. Key points:
- Backend runs on port 8000, serves API at `/api/*`
- Frontend builds to `frontend/dist/`, can be served statically
- Docker Compose includes Traefik labels for reverse proxy setup
- `VITE_API_URL` must match backend's public URL in production
- `CORS_ORIGINS` must include frontend's public URL

# Gemini Project Context: TeamVote

This document provides context for the "TeamVote" project, a German-language, mobile-first web application for team event planning.

## Project Overview

TeamVote is a full-stack application designed for planning and coordinating team events. It features a Vite/React frontend and a Python/FastAPI backend. The application is designed to be mobile-first and includes features like event idea voting, scheduling, budget tracking, and user analytics.

### Key Technologies

*   **Frontend:**
    *   Framework: Vite + React
    *   Language: TypeScript
    *   UI: Tailwind CSS with shadcn/ui components
    *   State Management: Zustand
    *   Routing: React Router
    *   Animations: Framer Motion
    *   Charts: Recharts

*   **Backend:**
    *   Framework: FastAPI
    *   Database: SQLModel with SQLite
    *   Server: Uvicorn

*   **Infrastructure & Deployment:**
    *   Containerization: Docker (via `docker-compose.yml`)
    *   Reverse Proxy: Traefik is used in the Docker setup for handling network traffic and SSL.
    *   Deployment: The app can be run locally, via Docker, or deployed to cloud services.

## Building and Running the Project

The project is a monorepo containing the `frontend` and `backend` services.

### Local Development (without Docker)

**1. Start the Backend:**

*   Navigate to the `backend` directory.
*   Create and activate a virtual environment (e.g., `python -m venv .venv` then `. .venv/Scripts/activate`).
*   Install dependencies: `pip install -r requirements.txt`
*   Run the server: `uvicorn app.main:app --reload --port 8000`

**2. Start the Frontend (in a new terminal):**

*   Navigate to the `frontend` directory.
*   Install dependencies: `npm install`
*   Run the development server, pointing to the local backend API: `VITE_API_URL=http://localhost:8000/api npm run dev`
*   The application will be available at `http://localhost:8080`.

**Alternative:** The `scripts/start-app.ps1` script can be used on Windows to automate starting both backend and frontend.

### Running with Docker

*   Ensure Docker and Docker Compose are installed.
*   Run `docker compose up -d` from the project root. This will build and start the `api` (backend) service. The provided `docker-compose.yml` is configured for a production-like setup using Traefik and does not run the frontend directly in a dev environment.

## Key Scripts

*   `frontend/package.json`:
    *   `npm run dev`: Starts the Vite development server.
    *   `npm run build`: Builds the production-ready frontend application.
    *   `npm run lint`: Lints the frontend codebase.
    *   `npm run preview`: Serves the production build locally for previewing.

## Development Conventions

*   **API Communication:** The frontend communicates with the backend via a REST API. The API base URL is configured using the `VITE_API_URL` environment variable in the frontend.
*   **Database:** A SQLite database (`backend/data/data.db`) is used for local development and is persisted via a Docker volume in the container setup.
*   **Language:** The application's UI and source code comments are primarily in German.
*   **UI Components:** The frontend heavily relies on the `shadcn/ui` component library, which is built on top of Radix UI and Tailwind CSS.

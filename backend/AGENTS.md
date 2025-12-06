# AGENTS.md for the backend

This document provides a guide for AI agents to understand and work with the backend codebase.

## Purpose & Responsibilities

The backend is a FastAPI application that provides a RESTful API for the event-horizon application. It is responsible for:

- Managing campaigns, events, and user data.
- Handling business logic related to voting, budgeting, and analytics.
- Providing data to the frontend application.

It **must not** contain any frontend code or logic.

## Architecture & Key Files

The backend follows a standard FastAPI project structure:

- `app/main.py`: The main entry point of the application. It initializes the FastAPI app, includes routers, and sets up middleware.
- `app/core/config.py`: Defines the application's configuration using Pydantic settings. It loads settings from environment variables and a `.env` file.
- `app/core/database.py`: Manages the database connection and session. It uses SQLModel and SQLAlchemy for database interactions.
- `app/api/routes/`: Contains the API routers for different resources (e.g., `campaigns.py`, `events.py`).
- `app/models/domain.py`: Defines the SQLModel domain models, which represent the database tables.
- `app/schemas/domain.py`: Defines the Pydantic schemas for data validation and serialization.
- `app/services/`: Contains the business logic of the application (e.g., `campaigns.py`, `analytics.py`).

## Data & APIs

- **Data Models**: The data models are defined in `app/models/domain.py` using SQLModel. They represent the database tables and their relationships.
- **Data Schemas**: The Pydantic schemas in `app/schemas/domain.py` are used for request and response data validation. They are separate from the database models to provide a clear API contract.
- **External APIs**: The application may use external APIs, such as the OpenRouter API for LLM integration. The API keys and other credentials should be stored in the `.env` file.

## Conventions & Style

- **SQLModel**: Use SQLModel for database models and interactions.
- **Pydantic**: Use Pydantic for data validation and settings management.
- **FastAPI**: Use FastAPI for creating the RESTful API.
- **Dependency Injection**: Use FastAPI's dependency injection system to manage dependencies (e.g., database sessions).
- **Routing**: Keep routers organized by resource in the `app/api/routes/` directory.

## Testing & Tooling

- **Testing**: The project does not have a dedicated test suite yet. When adding new features, consider adding tests to ensure correctness.
- **Linting**: The project does not have a linter configured yet. It is recommended to use a linter like `ruff` to ensure code quality.
- **Formatting**: The project does not have a code formatter configured yet. It is recommended to use a formatter like `black` to ensure consistent code style.

## Gotchas & Non-Obvious Rules

- The `secret_key` in `app/core/config.py` should be changed for production environments.
- The `database_url` in `app/core/config.py` can be configured to use a different database system.

## Recipe: Making a Good PR Here

1.  **Create a new branch**: `git checkout -b feature/my-new-feature`
2.  **Add a new route**: Create or modify a route in the `app/api/routes/` directory.
3.  **Add a new service**: Create or modify a service in the `app/services/` directory to implement the business logic.
4.  **Add a new model**: If necessary, add or modify a model in the `app/models/domain.py` file.
5.  **Add a new schema**: If necessary, add or modify a schema in the `app/schemas/domain.py` file.
6.  **Add tests**: If possible, add tests for the new feature.
7.  **Update `AGENTS.md`**: If you make any significant changes to the architecture or conventions, update this file.
8.  **Create a pull request**: Push your changes and create a pull request.

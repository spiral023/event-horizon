# Makefile für lokales Development
# Funktioniert auf Windows mit "make" (via Git Bash, WSL, oder chocolatey install make)

.PHONY: help dev-up dev-down dev-logs dev-build dev-restart prod-up prod-down clean

help: ## Zeigt diese Hilfe
	@echo "EventHorizon Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev-up: ## Startet lokales Development (Docker Compose)
	@echo "Starting development environment..."
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "Frontend:    http://localhost:8080"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs:    http://localhost:8000/docs"

dev-build: ## Baut und startet lokales Development
	@echo "Building and starting development environment..."
	docker compose -f docker-compose.dev.yml up --build -d

dev-down: ## Stoppt lokales Development
	@echo "Stopping development environment..."
	docker compose -f docker-compose.dev.yml down

dev-logs: ## Zeigt Logs von Development Services
	docker compose -f docker-compose.dev.yml logs -f

dev-restart: dev-down dev-up ## Neustart Development Environment

prod-up: ## Startet Production Environment
	docker compose up -d

prod-down: ## Stoppt Production Environment
	docker compose down

clean: ## Entfernt alle Container, Volumes und Images
	docker compose -f docker-compose.dev.yml down -v
	docker compose down -v
	@echo "Cleaned up!"

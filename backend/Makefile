.PHONY: up-infra up down down-volumes build logs shell help

COMPOSE = docker compose

## ── Primary targets ──────────────────────────────────────────────────────────

up-infra: ## Start infrastructure services (backend API)
	$(COMPOSE) up -d backend

up: ## Start all services
	$(COMPOSE) up -d

down: ## Stop all services (volumes preserved)
	$(COMPOSE) down

down-volumes: ## Stop all services and remove all volumes
	$(COMPOSE) down -v

## ── Utility targets ──────────────────────────────────────────────────────────

build: ## Rebuild Docker images
	$(COMPOSE) build --no-cache

logs: ## Tail logs for all services
	$(COMPOSE) logs -f

logs-backend: ## Tail backend logs only
	$(COMPOSE) logs -f backend

shell: ## Open a shell inside the backend container
	$(COMPOSE) exec backend /bin/bash

## ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

# Dawnlit — convenience targets. Run `make help` for the list.
# Docker targets need Docker Compose v2.24+; the gate targets mirror docs/PLAN.md §5 exactly.

SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE      ?= docker compose
COMPOSE_PROD ?= docker compose -f docker-compose.yml -f docker-compose.prod.yml
BE           := backend
FE           := frontend
VENV         := $(BE)/.venv
PY           := .venv/bin/python

.PHONY: help up down logs ps prod-up be-venv be-gate db-gate fe-gate contract e2e local-db local-db-stop seed migrate db-reset

help: ## Show this help
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ----- Docker -----------------------------------------------------------------------------------
up: ## Build and start the full stack (http://localhost:8080) with demo data
	@test -f .env || { cp .env.example .env && echo "created .env from .env.example"; }
	$(COMPOSE) up --build -d
	@echo "Storefront http://localhost:8080 · Admin http://localhost:8080/admin · API docs http://localhost:8080/api/docs"

down: ## Stop the stack (keeps volumes; add ARGS=-v to wipe DB + storage)
	$(COMPOSE) down $(ARGS)

logs: ## Follow logs (SVC=backend to filter)
	$(COMPOSE) logs -f --tail=200 $(SVC)

ps: ## Show service status
	$(COMPOSE) ps

prod-up: ## Production deploy on a VM (docs/DEPLOYMENT.md)
	$(COMPOSE_PROD) up -d --build

# ----- Local (no Docker) ------------------------------------------------------------------------
local-db: ## Start the isolated local MySQL on 127.0.0.1:3307
	infra/local/mysql.sh start

local-db-stop: ## Stop the isolated local MySQL
	infra/local/mysql.sh stop

be-venv: ## Create backend/.venv and install dev requirements
	@test -x $(VENV)/bin/python || python3.12 -m venv $(VENV)
	$(VENV)/bin/pip install -r $(BE)/requirements-dev.txt

migrate: ## alembic upgrade head (local DB)
	cd $(BE) && .venv/bin/alembic upgrade head

seed: ## Seed essential + demo data (idempotent; ARGS=--essential for essentials only)
	cd $(BE) && $(PY) -m app.seeds $(ARGS)

db-reset: ## Drop and recreate the local schema, then seed everything (E2E baseline)
	cd $(BE) && .venv/bin/alembic downgrade base && .venv/bin/alembic upgrade head && $(PY) -m app.seeds --all

# ----- Quality gates (PLAN §5) ------------------------------------------------------------------
be-gate: ## Backend gate: ruff, ruff format --check, mypy, pytest
	cd $(BE) && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/mypy app && .venv/bin/pytest

db-gate: ## DB gate: alembic upgrade head + seeds twice (idempotency)
	cd $(BE) && .venv/bin/alembic upgrade head && $(PY) -m app.seeds && $(PY) -m app.seeds

fe-gate: ## Frontend gate: eslint, tsc, vitest, vite build
	cd $(FE) && npm run lint && npm run typecheck && npm run test -- --run && npm run build

contract: ## Contract gate: generated types up to date + CONTRACT_STRICT=1 test_contract.py
	cd $(FE) && npm run gen:api && git diff --exit-code -- src/api/schema.d.ts
	cd $(BE) && CONTRACT_STRICT=1 .venv/bin/pytest tests/test_contract.py

e2e: ## Playwright E2E (resets + seeds the local DB, starts the API via E2E_START_BACKEND=1)
	$(MAKE) db-reset
	cd $(FE) && E2E_START_BACKEND=1 npx playwright test

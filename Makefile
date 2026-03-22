APP_NAME := payment-analytics
DOCKER_NODE := docker run --rm -v $(PWD):/app -w /app node:22-slim
VERSION := $(shell grep '"version"' src-tauri/tauri.conf.json | head -1 | sed 's/.*: "//;s/".*//')

.PHONY: help setup dev release clean check lint frontend-dev frontend-build rust-check open

# ──────────────────────────────────────────────
# Quick start
# ──────────────────────────────────────────────

help: ## Show all available commands
	@echo ""
	@echo "  Payment Analytics — Makefile commands"
	@echo "  ────────────────────────────────────────"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## First-time setup: install all dependencies
	@echo "→ Installing frontend dependencies via Docker..."
	@$(DOCKER_NODE) npm install
	@echo "→ Checking Rust toolchain..."
	@rustup update stable
	@echo "→ Installing Tauri CLI..."
	@cargo install tauri-cli --version "^2.0" 2>/dev/null || true
	@echo ""
	@echo "✓ Setup complete. Run 'make dev' to start."

# ──────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────

dev: ## Start app in dev mode (frontend Docker + Tauri hot reload)
	@./scripts/dev.sh

frontend-dev: ## Start only frontend dev server (Docker, port 1420)
	@echo "→ Starting frontend dev server on http://localhost:1420"
	@docker run --rm -it \
		--name coinflow-frontend-dev \
		-v $(PWD):/app \
		-w /app \
		-p 1420:1420 \
		node:22-slim \
		sh -c "npm install --silent && npm run dev"

frontend-build: ## Build frontend only (Docker)
	@$(DOCKER_NODE) sh -c "npm install --silent && npm run build"
	@echo "✓ Frontend built → dist/"

# ──────────────────────────────────────────────
# Release
# ──────────────────────────────────────────────

release: ## Build release .app / .dmg bundle (ad-hoc signed, no Apple account needed)
	@echo "→ Building frontend via Docker..."
	@$(DOCKER_NODE) sh -c "npm install --silent && npm run build"
	@echo "→ Building Tauri release..."
	@cd src-tauri && cargo tauri build
	@echo "→ Ad-hoc signing .app (removes 'damaged' Gatekeeper error)..."
	@APP_PATH=$$(find src-tauri/target/release/bundle/macos -name "*.app" | head -1); \
	  if [ -n "$$APP_PATH" ]; then \
	    codesign --force --deep --sign - "$$APP_PATH" && echo "  signed: $$APP_PATH"; \
	  else \
	    echo "  warning: .app not found, skipping signing"; \
	  fi
	@echo ""
	@echo "✓ Release built!"
	@echo "  .app  → src-tauri/target/release/bundle/macos/"
	@echo "  .dmg  → src-tauri/target/release/bundle/dmg/"
	@echo ""
	@echo "  Note: users may see 'unidentified developer' on first launch."
	@echo "  Fix: right-click → Open, or System Settings → Privacy & Security → Open Anyway"

sign: ## Ad-hoc sign the built .app (run after make release if needed)
	@APP_PATH=$$(find src-tauri/target/release/bundle/macos -name "*.app" | head -1); \
	  if [ -n "$$APP_PATH" ]; then \
	    codesign --force --deep --sign - "$$APP_PATH" && echo "✓ Signed: $$APP_PATH"; \
	  else \
	    echo "✗ No .app found. Run 'make release' first."; \
	  fi

open: ## Open the built .app (after make release)
	@open src-tauri/target/release/bundle/macos/Payment\ Analytics.app 2>/dev/null || echo "No build found. Run 'make release' first."

# ──────────────────────────────────────────────
# Quality
# ──────────────────────────────────────────────

check: ## Type-check frontend + Rust
	@echo "→ TypeScript check..."
	@$(DOCKER_NODE) npx tsc --noEmit
	@echo "→ Rust check..."
	@cd src-tauri && cargo check
	@echo "✓ All checks passed"

lint: ## Lint frontend (tsc) + Rust (clippy)
	@echo "→ TypeScript..."
	@$(DOCKER_NODE) npx tsc --noEmit
	@echo "→ Clippy..."
	@cd src-tauri && cargo clippy -- -W clippy::all
	@echo "✓ Lint passed"

rust-check: ## Check Rust compilation only
	@cd src-tauri && cargo check

# ──────────────────────────────────────────────
# Maintenance
# ──────────────────────────────────────────────

clean: ## Remove all build artifacts
	@rm -rf dist node_modules
	@cd src-tauri && cargo clean
	@echo "✓ Cleaned"

version: ## Show current app version
	@echo "v$(VERSION)"

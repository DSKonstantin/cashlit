# Payment Analytics App

Desktop-приложение для визуализации аналитики из платёжных провайдеров (Coinflow, Stripe, PayPal и др.).
Вдохновлено дизайном Subscription Day — тёмная тема, glassmorphism, плавные анимации.

## Stack

- **Runtime**: Tauri 2 (Rust backend + webview frontend)
- **Frontend**: React 18+, TypeScript (strict), Tailwind CSS 4, Framer Motion
- **Charts**: Recharts
- **State**: TanStack Query (server state), React Context (app state)
- **Icons**: Lucide React
- **Routing**: React Router

## Architecture: Provider Abstraction

The app is built around a multi-provider architecture. The core abstraction is the `PaymentProvider` trait in Rust:

```
PaymentProvider trait
  ├── CoinflowProvider  (MVP)
  ├── StripeProvider     (next)
  └── PayPalProvider     (future)
```

**Key principle**: Frontend is completely provider-agnostic. It works with unified types (Plan, Subscriber, Payment, AnalyticsSummary). Provider is just a label for filtering.

### Data Flow
```
[Provider APIs] -> [Provider Adapters] -> [Unified Models] -> [Analytics Engine] -> [IPC Commands] -> [React UI]
```

### Adding a New Provider
1. Create `src-tauri/src/providers/{name}/` with mod.rs, client.rs, types.rs, mapper.rs
2. Implement `PaymentProvider` trait
3. Register in ProviderRegistry
4. No changes to commands, frontend, or analytics engine

## Security

- All HTTP requests go through Rust backend (no direct fetch from webview)
- API keys stored in Tauri secure storage, never exposed to frontend
- Each provider has its own credentials
- CSP configured to block unnecessary origins

## Design Principles

- Dark theme only (no light mode for MVP)
- Glassmorphism: semi-transparent cards with backdrop-blur
- Compact window (480x720 default)
- Subtle animations: enhance, never distract
- All amounts in cents internally, formatted for display in UI only
- UTC timestamps everywhere, local conversion in UI only

## Conventions

- Rust: snake_case, `Result<T, E>` everywhere, no unwrap in prod, typed API responses
- TypeScript: strict mode, no `any`, interfaces for all data shapes
- Components: under 150 lines, single responsibility
- Tailwind: utility classes only
- File naming: kebab-case for files, PascalCase for React components

## Agents

Specialized agents in `/agents/`:
- `tauri-rust-engineer.md` — Rust backend, Tauri config, provider trait, IPC, secure storage
- `frontend-developer.md` — React components, provider-agnostic UI, state, routing
- `ui-designer.md` — design system, colors, animations, glassmorphism
- `api-architect.md` — provider abstraction, unified data models, metrics computation
- `code-reviewer.md` — quality, security, performance reviews

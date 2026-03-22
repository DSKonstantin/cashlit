# Cashlit

**Payment analytics dashboard for indie developers and small teams.**
Track revenue, subscriptions, and payments across Coinflow, Stripe, and PayPal — all in one compact desktop app.

[![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/platform-macOS-lightgrey?logo=apple)](https://github.com/DSKonstantin/cashlit/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24C8D8?logo=tauri)](https://tauri.app)

---

## Download

**[→ Download the latest release](https://github.com/DSKonstantin/cashlit/releases/latest)**

No setup required. Download, drag to Applications, open.

> **macOS only.** Windows / Linux builds are not available yet.

### First launch on macOS

macOS may show a warning because the app is not signed with an Apple Developer certificate.
This is expected for open-source apps. Here is how to open it:

**Option A — Right-click method (easiest):**
1. Right-click the app in Finder
2. Select **Open**
3. Click **Open** in the dialog

**Option B — System Settings:**
1. Try to open the app normally — it will be blocked
2. Go to **System Settings → Privacy & Security**
3. Scroll down and click **Open Anyway**

**Option C — Terminal (fastest):**
```bash
xattr -cr "/Applications/Cashlit.app" && open "/Applications/Cashlit.app"
```

You only need to do this once.

---

## What is Cashlit?

Cashlit is a native macOS desktop app that aggregates payment data from multiple providers into a single analytics view. No browser, no SaaS subscription, no data leaving your machine — your API keys stay local.

- Connect **Coinflow**, **Stripe**, and **PayPal** in one place
- See revenue, subscribers, MRR, and payment history
- Filter by provider, date range, and project
- Dark UI with a compact 620×520 window — stays out of your way

---

## Features

- **Multi-provider** — Coinflow, Stripe, PayPal with a unified data model
- **Revenue analytics** — MRR, total revenue, subscriber count, churn
- **Calendar view** — daily revenue breakdown with drill-down
- **Payment history** — filterable list across all providers
- **Secure credentials** — API keys stored locally, never sent anywhere except the provider's own API
- **Onboarding flow** — connect your first provider in under a minute
- **Dark theme** — glassmorphism UI, smooth animations

---

## Supported Providers

| Provider | Status | Auth |
|---|---|---|
| [Coinflow](https://coinflow.cash) | Supported | API Key |
| [Stripe](https://stripe.com) | Supported | Secret Key |
| [PayPal](https://paypal.com) | Supported | Client ID + Secret |

More providers can be added — see [Contributing](#contributing).


---

## For Developers

### Prerequisites

- **macOS** (required for Tauri + WebKit)
- **Rust** stable — [install via rustup](https://rustup.rs)
- **Docker** — used to run the Node/npm frontend build in isolation

### Build from source

```bash
# Clone the repo
git clone https://github.com/DSKonstantin/cashlit.git
cd cashlit

# First-time setup (installs npm deps + Tauri CLI)
make setup

# Start in dev mode (hot reload)
make dev

# Build a release .app
make release
```

Run `make help` to see all available commands.

### Architecture

The app is built around a provider abstraction layer. The Rust backend handles all HTTP requests — the frontend never talks to payment APIs directly.

```
[Payment APIs] → [Provider Adapters] → [Unified Models] → [IPC] → [React UI]
```

Adding a new provider requires only creating a new module in `src-tauri/src/providers/` and implementing the `PaymentProvider` trait. No changes to the frontend or analytics engine.

```
src-tauri/src/providers/
├── coinflow/       ← client, types, mapper
├── stripe/         ← client, types, mapper
├── paypal/         ← client, types, mapper
└── types.rs        ← shared unified types
```

**Stack:** Tauri 2 · React 18 · TypeScript (strict) · Tailwind CSS · Recharts · TanStack Query · Framer Motion

---

## Contributing

Contributions are welcome for personal, non-commercial use cases.

- **New provider?** Create a module in `src-tauri/src/providers/` following the existing pattern
- **Bug fix or improvement?** Open an issue first to discuss
- **Design?** The UI targets a compact 620×520 window with dark theme and glassmorphism

Please read [CLAUDE.md](CLAUDE.md) for architecture conventions before submitting a PR.

---

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — free for personal use, not for commercial products or services.

---

## Support the Project

If Cashlit saves you time, consider supporting development:

**Solana (SOL):**
```
HLYczfKAbdFY2GXhKr5sKsaimgVTXhYBe4C1gqn8MgsM
```

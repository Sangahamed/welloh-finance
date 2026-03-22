# Welloh: Global Trading Simulator

## Overview
A React + TypeScript + Vite single-page application for trading simulation with a focus on African and global markets. Users can practice trading, analyze markets, develop strategies, compete on a leaderboard with leagues, and participate in prediction markets.

## Architecture
- **Frontend**: React 18 + TypeScript, built with Vite
- **Auth & Database**: Supabase (authentication, user accounts, trade history, predictions, bets)
- **AI**: Google Gemini API (market analysis, strategy, education, prediction idea generation)
- **Charts**: Recharts for financial data visualization
- **Styling**: Tailwind CSS (loaded via CDN in index.html)

## Project Structure
```
/
├── App.tsx                    # Root component with hash-based routing
├── index.tsx                  # Entry point
├── index.html                 # HTML shell (includes Tailwind CDN)
├── vite.config.ts             # Vite config (port 5000, host 0.0.0.0)
├── types.ts                   # Shared TypeScript types (incl. Prediction, Bet, League)
├── components/
│   ├── icons/Icons.tsx        # Custom SVG icon components
│   ├── ui/                    # Reusable UI primitives (NeonCard, NeonBadge, NeonButton, etc.)
│   ├── LandingView.tsx        # Public landing page
│   ├── LoginView.tsx          # Login form
│   ├── SignUpView.tsx         # Registration form
│   ├── DashboardView.tsx      # Main simulation dashboard
│   ├── StockChartView.tsx     # Stock chart + advanced orders (market/limit/stop-loss)
│   ├── AnalysisView.tsx       # Market analysis (Gemini)
│   ├── StrategyView.tsx       # Mentor IA - trading strategies (Gemini streaming)
│   ├── EducationView.tsx      # Educational content (Gemini streaming)
│   ├── PredictionsView.tsx    # Prediction markets (Phase 2) - create/browse/bet
│   ├── LeaderboardView.tsx    # User rankings with 6-tier league system + composite score
│   ├── AdminDashboardView.tsx # Admin controls
│   ├── PublicTendersView.tsx  # Business opportunities (Gemini)
│   └── ProfileView.tsx        # User profile
├── contexts/
│   └── AuthContext.tsx        # Authentication state and methods
├── lib/
│   ├── supabaseClient.ts      # Supabase client (hardcoded keys)
│   └── database.ts            # Database helpers (incl. predictions, bets functions)
└── services/
    └── geminiService.ts       # Gemini AI service (incl. generatePredictionIdeas)
```

## Routing
Hash-based routing (`window.location.hash`). Pages: `landing`, `login`, `signup`, `simulation`, `analysis`, `strategy`, `education`, `predictions`, `tenders`, `leaderboard`, `admin`, `profile/:id`.

## Phase 2 Features (Implemented)
- **Prediction Markets** (`#predictions`): Create binary/multi-option predictions with required analysis proof. AI-powered idea generation via Gemini. Participation with points betting. Graceful fallback if Supabase tables not yet created.
- **League System**: Leaderboard uses Bronze → Silver → Gold → Sapphire → Diamond → Legend tiers based on composite score (PnL 50% + Sharpe 30% + Win Rate 20%).
- **Advanced Orders**: Trading panel now supports Market, Limit, and Stop-Loss orders with price targeting.

## Supabase Tables Required for Phase 2
The predictions feature requires these tables (run SQL to create):
- `predictions` — id, creator_id, creator_name, title, description, category, options (JSONB), expires_at, analysis_proof, status, total_pool, participants_count, resolved_option_id
- `bets` — id, user_id, prediction_id, option_id, amount, created_at

## Environment Variables
- `GEMINI_API_KEY` — Required for AI features. Set in Replit Secrets.
- Supabase credentials are hardcoded in `lib/supabaseClient.ts`.

## Development
- Run: `npm run dev` (starts Vite on port 5000)
- Build: `npm run build`

## Deployment
- Configured as a static site deployment
- Build command: `npm run build`
- Output directory: `dist`

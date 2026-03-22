# Welloh: Global Trading Simulator

## Overview
A React + TypeScript + Vite single-page application for trading simulation with a focus on African and global markets. Users can practice trading, analyze markets, develop strategies, and compete on a leaderboard.

## Architecture
- **Frontend**: React 18 + TypeScript, built with Vite
- **Auth & Database**: Supabase (authentication, user accounts, trade history)
- **AI**: Google Gemini API for market analysis and strategy features
- **Charts**: Recharts for financial data visualization
- **Styling**: Tailwind CSS (loaded via CDN in index.html)

## Project Structure
```
/
├── App.tsx                  # Root component with routing logic
├── index.tsx                # Entry point
├── index.html               # HTML shell (includes Tailwind CDN)
├── vite.config.ts           # Vite config (port 5000, host 0.0.0.0)
├── types.ts                 # Shared TypeScript types
├── components/              # React components
│   ├── icons/Icons.tsx      # Custom SVG icon components
│   ├── ui/                  # Reusable UI primitives
│   ├── LandingView.tsx      # Public landing page
│   ├── LoginView.tsx        # Login form
│   ├── SignUpView.tsx       # Registration form
│   ├── DashboardView.tsx    # Main simulation dashboard
│   ├── AnalysisView.tsx     # Market analysis
│   ├── StrategyView.tsx     # Trading strategies
│   ├── EducationView.tsx    # Educational content
│   ├── LeaderboardView.tsx  # User rankings
│   ├── AdminDashboardView.tsx # Admin controls
│   └── ProfileView.tsx      # User profile
├── contexts/
│   └── AuthContext.tsx      # Authentication state and methods
├── lib/
│   ├── supabaseClient.ts    # Supabase client (hardcoded keys)
│   └── database.ts          # Database helper functions
└── services/
    └── geminiService.ts     # Google Gemini AI service
```

## Routing
Hash-based routing (`window.location.hash`). Pages: `landing`, `login`, `signup`, `simulation`, `analysis`, `strategy`, `education`, `tenders`, `leaderboard`, `admin`, `profile/:id`.

## Environment Variables
- `GEMINI_API_KEY` — Required for AI features (market analysis, strategy). Set in Replit Secrets.
- Supabase credentials are hardcoded in `lib/supabaseClient.ts`.

## Development
- Run: `npm run dev` (starts Vite on port 5000)
- Build: `npm run build`

## Deployment
- Configured as a static site deployment
- Build command: `npm run build`
- Output directory: `dist`


# Welloh: Global Trading Simulator & Talent Identifier

Welloh is an advanced stock market simulation platform designed to train the next generation of financial talent. It offers a comprehensive, risk-free environment to trade on all international markets with a unique and powerful focus on the emerging markets of Africa.

The platform's dual mission is to provide an unparalleled educational tool for aspiring traders and to serve as a talent identification pipeline for financial institutions seeking to recruit top performers.

## Core Features

The application is structured around four main pillars, providing a complete journey from learning the basics to executing complex strategies.

### 1. 📈 Dashboard (Simulation)
The heart of the platform, where users can actively trade and manage their virtual portfolio.
- **Virtual Portfolio**: Start with a $100,000 virtual portfolio to buy and sell stocks.
- **Global Market Access**: Search for and trade stocks from major global exchanges (NYSE, NASDAQ) and key African markets (BRVM, JSE, etc.).
- **AI-Powered Data**: Get realistic (yet simulated) stock data and AI-driven buy/sell recommendations for any ticker.
- **Performance Tracking**: Monitor your portfolio's total value, gains/losses, and allocation.
- **Transaction History**: Keep a detailed log of all your buy and sell orders.

### 2. 🔬 Analyse
A dedicated suite of tools for deep-diving into financial analysis, powered by the Gemini API.
- **In-Depth Company Analysis**: Generate comprehensive reports on any company, including key metrics, financial projections, strengths, and weaknesses.
- **Competitive Comparison**: Directly compare two companies side-by-side across all key financial indicators.
- **Persistent History & Alerts**: Your analysis history is saved locally, and you can set custom alerts on key metrics that trigger notifications.
- **Latest News**: Pulls in recent news articles relevant to the analyzed company.
- **Customizable Charts**: Adjust chart colors, line types, and grid visibility to suit your preferences.

### 3. 💡 Mentor IA
A personalized AI-powered mentor to guide your investment journey.
- **Conversational Strategy Building**: Ask complex questions about investment strategies, market conditions, risk management, or specific sectors.
- **Streaming Responses**: The AI provides detailed, structured advice in a conversational, streaming format.
- **Focus on Africa**: Ideal for exploring the nuances of investing in diverse African markets.

### 4. 📚 Apprendre (Education Hub)
A structured learning center to build financial literacy from the ground up.
- **Curated Learning Paths**: Content is organized for Beginners, Intermediate users, and those wanting a specific Focus on Africa.
- **Practical Topics**: Covers everything from "What is a stock?" to "Understanding the ZLECAF and its impact."

## Technical Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 for a utility-first design approach.
- **AI & Data Generation**: Google Gemini API (`@google/genai`) is used for all financial analysis, data simulation, and AI mentorship.
- **Charting**: `Recharts` for creating responsive and interactive financial charts.
- **State Management**: A combination of React's native `useState`, `useCallback`, and `Context` API for managing application state (e.g., Theme, Chart Settings).
- **Client-Side Storage**: `localStorage` is used to persist user analysis history, alerts, and chart settings between sessions.

## Project Structure

```
/
├── components/          # Reusable React components
│   ├── AnalysisView.tsx   # Main component for the 'Analyse' section
│   ├── DashboardView.tsx  # Main component for the trading simulation
│   ├── StrategyView.tsx   # The 'Mentor IA' interface
│   └── ...              # Other UI components (Header, Footer, Cards, etc.)
├── contexts/            # React context providers for global state
│   ├── SettingsContext.tsx # Manages chart personalization settings
│   └── ThemeContext.tsx    # Manages light/dark mode
├── services/            # API interaction layer
│   └── geminiService.ts   # All functions making calls to the Gemini API
├── App.tsx              # Main application router and view management
├── index.tsx            # Application entry point
├── index.html           # Main HTML file
└── README.md            # This file
```

## How to Run

This application is designed to run in a web-based development environment where environment variables can be securely managed.

1.  **API Key**: The application requires a Google Gemini API key. This key must be set as an environment variable named `API_KEY` in the execution environment. The code in `services/geminiService.ts` will automatically use this variable.
2.  **Installation**: No `npm install` is necessary as all dependencies (`react`, `@google/genai`, `recharts`, etc.) are loaded via an `importmap` in `index.html` from a CDN.
3.  **Run**: Serve the `index.html` file through a local development server. The application will mount and run.

---

*Disclaimer: This application is for demonstration and educational purposes only. It does not provide real financial advice, and all trading data is simulated.*
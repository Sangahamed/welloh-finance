import React from 'react';

export interface Metric {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export interface Projection {
  year: string;
  revenue: number;
  profit: number;
}

export interface AnalysisData {
  companyName: string;
  ticker: string;
  summary: string;
  keyMetrics: Metric[];
  projections: Projection[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Acheter' | 'Conserver' | 'Vendre';
  confidenceScore: number;
}

export interface NewsArticle {
  title: string;
  uri: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  companyIdentifier: string;
  comparisonIdentifier?: string;
  currency: string;
  analysisData: {
    main: AnalysisData;
    comparison: AnalysisData | null;
  };
  news: NewsArticle[];
}

export interface Alert {
  id:string;
  metricLabel: string;
  condition: 'gt' | 'lt';
  threshold: number;
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  percentChange: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface StockHolding {
  ticker: string;
  exchange: string;
  companyName: string;
  shares: number;
  purchasePrice: number;
  currentValue?: number;
}

export interface Portfolio {
  cash: number;
  holdings: StockHolding[];
  initialValue: number;
  winRate?: string;
  avgGainLoss?: string;
  sharpeRatio?: string;
}

export interface StockData {
  companyName: string;
  ticker: string;
  exchange: string;
  price: number;
  change: number;
  percentChange: string;
  volume: string;
  summary: string;
  recommendation: 'Acheter' | 'Conserver' | 'Vendre';
  confidenceScore: number;
  marketCap?: string;
  country?: string;
}

export interface Transaction {
    id: string;
    type: 'buy' | 'sell';
    ticker: string;
    exchange: string;
    companyName: string;
    shares: number;
    price: number;
    timestamp: number;
}

// New type for stock price chart
export interface HistoricalPricePoint {
    date: string; // "YYYY-MM-DD"
    price: number;
}

// New type for Public Tenders
export interface PublicTender {
  id: string;
  title: string;
  country: string;
  sector: string;
  issuingEntity: string;
  summary: string;
  deadline: string;
  uri: string;
}


// New types for authentication
export interface User {
  id: string;
  email?: string;
  fullName: string;
  role: 'user' | 'admin';
}

export interface WatchlistItem {
  ticker: string;
  exchange: string;
}

// This is the structure stored in the database for a user's profile
export interface UserAccount extends User {
    portfolio: Portfolio;
    transactions: Transaction[];
    watchlist: WatchlistItem[];
    analysisHistory: HistoryItem[];
    alerts: Alert[];
    country?: string;
    institution?: string;
}
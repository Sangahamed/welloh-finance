
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMarketOverview, getStockData, searchStocks } from '../services/geminiService';
import type { MarketIndex, Transaction, StockHolding, Portfolio, StockData, WatchlistItem } from '../types';
import MarketOverview from './MarketOverview';
import WatchlistPanel from './WatchlistPanel';
import StockChartView from './StockChartView';
import LevelUpNotification from './LevelUpNotification';
import { WalletIcon, BriefcaseIcon, ClockIcon, MagnifyingGlassIcon } from './icons/Icons';

const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
    { name: 'Novice', threshold: 0, color: 'text-gray-400' },
    { name: 'Apprenti', threshold: 110000, color: 'text-green-400' },
    { name: 'Trader', threshold: 150000, color: 'text-blue-400' },
    { name: 'Investisseur', threshold: 250000, color: 'text-indigo-400' },
    { name: 'Maestro', threshold: 500000, color: 'text-purple-400' },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

// Search Results Table Component
const SearchResultsTable: React.FC<{
    stocks: StockData[];
    onSelectStock: (ticker: string) => void;
}> = ({ stocks, onSelectStock }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ticker</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nom</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prix</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Var. %</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Capitalisation</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pays</th>
                    <th className="relative px-4 py-2"><span className="sr-only">Action</span></th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stocks.map((stock) => (
                    <tr key={stock.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-600 dark:text-indigo-400">{stock.ticker}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">{stock.companyName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stock.price)}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {stock.percentChange}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stock.marketCap || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stock.country || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => onSelectStock(stock.ticker)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                                Analyser
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Skeleton for SearchResultsTable
const SearchResultsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-2 pt-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>)}
    </div>
);


// Portfolio Panel Component
const PortfolioPanel: React.FC<{ portfolio: Portfolio }> = ({ portfolio }) => {
    const { cash, holdings, initialValue } = portfolio;
    const holdingsValue = holdings.reduce((acc, h) => acc + (h.shares * h.currentValue!), 0);
    const totalValue = cash + holdingsValue;
    const totalGainLoss = totalValue - initialValue;
    const totalReturnPercent = initialValue > 0 ? (totalGainLoss / initialValue) * 100 : 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center mb-4"><WalletIcon /><span className="ml-2">Votre Portefeuille</span></h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Valeur Totale</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Gain/Perte</div>
                    <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(totalGainLoss)} ({totalReturnPercent.toFixed(2)}%)
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Liquidités</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(cash)}</div>
                </div>
                 <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Actifs</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(holdingsValue)}</div>
                </div>
            </div>
        </div>
    );
};

// Holdings Table Component
const HoldingsTable: React.FC<{ holdings: StockHolding[] }> = ({ holdings }) => {
    if (holdings.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">Vous ne détenez aucune action. Recherchez-en une pour commencer !</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ticker</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prix d'Achat</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valeur Actuelle</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gain/Perte</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {holdings.map(h => {
                        const totalValue = h.shares * (h.currentValue || h.purchasePrice);
                        const totalCost = h.shares * h.purchasePrice;
                        const gainLoss = totalValue - totalCost;
                        const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
                        return (
                            <tr key={h.ticker}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{h.ticker}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{h.shares}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(h.purchasePrice)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalValue)}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(gainLoss)} ({gainLossPercent.toFixed(2)}%)
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Transaction History Component - needs to be exported
export const TransactionHistory: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center mb-4"><ClockIcon /><span className="ml-2">Historique des Transactions</span></h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className={`flex justify-between items-center p-2 rounded-md border-l-4 ${t.type === 'buy' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{t.type === 'buy' ? 'Achat' : 'Vente'} - {t.ticker}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.shares} actions @ {formatCurrency(t.price)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(t.shares * t.price)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucune transaction enregistrée.</p>
                )}
            </div>
        </div>
    );
};

// Main Dashboard View
const DashboardView: React.FC<{ onNavigate: (page: string) => void; }> = ({ onNavigate }) => {
    const { currentUser, currentUserAccount, updateCurrentUserAccount } = useAuth();
    const [marketIndices, setMarketIndices] = useState<MarketIndex[] | null>(null);
    const [marketLoading, setMarketLoading] = useState(true);
    const [marketError, setMarketError] = useState<string | null>(null);
    const [selectedTicker, setSelectedTicker] = useState<string | null>('AAPL');
    const [refreshedPortfolio, setRefreshedPortfolio] = useState<Portfolio | null>(currentUserAccount?.portfolio ?? null);
    const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
    const [levelUpNotification, setLevelUpNotification] = useState<{ oldLevel: string, newLevel: string } | null>(null);
    
    // State for market search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<StockData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchAttempted, setSearchAttempted] = useState(false);


    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                setMarketLoading(true);
                setMarketError(null);
                const overview = await getMarketOverview();
                setMarketIndices(overview);
            } catch (error) {
                setMarketError("Impossible de charger les données du marché.");
                console.error(error);
            } finally {
                setMarketLoading(false);
            }
        };
        fetchMarketData();
    }, []);

    useEffect(() => {
        if (!currentUserAccount) {
            setIsPortfolioLoading(false);
            return;
        }

        const refreshPortfolio = async () => {
            setIsPortfolioLoading(true);
            const { holdings, ...restOfPortfolio } = currentUserAccount.portfolio;

            // --- Level Up Check: Calculate old value before refresh ---
            const oldHoldingsValue = holdings.reduce((acc, h) => acc + (h.shares * h.purchasePrice), 0);
            const oldTotalValue = currentUserAccount.portfolio.cash + oldHoldingsValue;
            const oldLevel = getLevel(oldTotalValue);
            // ---

            if (holdings.length === 0) {
                setRefreshedPortfolio(currentUserAccount.portfolio);
                setIsPortfolioLoading(false);
                return;
            }
            
            try {
                const freshDataPromises = holdings.map(h => getStockData(h.ticker));
                const freshDataResults = await Promise.allSettled(freshDataPromises);
                
                const updatedHoldings = holdings.map((holding, index) => {
                    const result = freshDataResults[index];
                    if (result.status === 'fulfilled' && result.value) {
                        return { ...holding, currentValue: result.value.price };
                    }
                    // Fallback to purchase price if API fails
                    return { ...holding, currentValue: holding.purchasePrice }; 
                });
                
                const newPortfolioState = { ...restOfPortfolio, holdings: updatedHoldings };
                setRefreshedPortfolio(newPortfolioState);
                
                // --- Level Up Check: Compare with new value ---
                const newHoldingsValue = updatedHoldings.reduce((acc, h) => acc + (h.shares * h.currentValue!), 0);
                const newTotalValue = newPortfolioState.cash + newHoldingsValue;
                const newLevel = getLevel(newTotalValue);

                if (newLevel.threshold > oldLevel.threshold) {
                    setLevelUpNotification({ oldLevel: oldLevel.name, newLevel: newLevel.name });
                }
                // ---

            } catch (e) {
                console.error("Failed to refresh portfolio data:", e);
                setRefreshedPortfolio(currentUserAccount.portfolio); // Fallback to stale data on error
            } finally {
                setIsPortfolioLoading(false);
            }
        };

        refreshPortfolio();
    }, [currentUserAccount]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setSearchError(null);
            setSearchAttempted(false);
            return;
        }
        setSearchAttempted(true);
        setIsSearching(true);
        setSearchError(null);
        try {
            const results = await searchStocks(searchTerm.trim());
            setSearchResults(results);
        } catch (err) {
            setSearchError("La recherche d'actions a échoué. Veuillez réessayer.");
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleSelectStock = (ticker: string) => {
        setSelectedTicker(ticker);
        setSearchResults([]);
        setSearchTerm('');
        setSearchError(null);
        setSearchAttempted(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleWatchlist = useCallback((ticker: string, exchange: string) => {
        if (!currentUserAccount) return;
        const newWatchlistItem = { ticker, exchange };
        const isInWatchlist = currentUserAccount.watchlist.some(
            item => item.ticker === ticker && item.exchange === exchange
        );

        const newWatchlist = isInWatchlist
            ? currentUserAccount.watchlist.filter(item => item.ticker !== ticker || item.exchange !== exchange)
            : [...currentUserAccount.watchlist, newWatchlistItem];
            
        updateCurrentUserAccount({ watchlist: newWatchlist });
    }, [currentUserAccount, updateCurrentUserAccount]);

    if (!currentUserAccount) {
        return <div>Chargement du tableau de bord...</div>;
    }
    
    const isSelectedStockWatched = selectedTicker ? currentUserAccount.watchlist.some(item => item.ticker === selectedTicker) : false;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bonjour, {currentUser?.fullName} !</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-300">Bienvenue sur votre tableau de bord de simulation.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-grow w-full">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value.trim() === '') {
                                    setSearchAttempted(false);
                                    setSearchResults([]);
                                    setSearchError(null);
                                }
                            }}
                            placeholder="Rechercher une action (ex: 'banques au Nigéria', 'AAPL', 'Sonatel')"
                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-10 pr-4 py-2.5 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isSearching ? 'Recherche...' : 'Rechercher'}
                    </button>
                </form>
                <div className="mt-6">
                    {isSearching ? (
                        <SearchResultsSkeleton />
                    ) : searchError ? (
                        <p className="text-red-500 text-center py-4">{searchError}</p>
                    ) : searchAttempted ? (
                        searchResults.length > 0 ? (
                            <SearchResultsTable stocks={searchResults} onSelectStock={handleSelectStock} />
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucun résultat pour "{searchTerm}".</p>
                        )
                    ) : (
                        <MarketOverview indices={marketIndices} isLoading={marketLoading} error={marketError} />
                    )}
                </div>
            </div>
            
            {isPortfolioLoading ? (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            ) : (
                refreshedPortfolio && <PortfolioPanel portfolio={refreshedPortfolio} />
            )}

            <StockChartView 
                key={selectedTicker} // Re-mount component on ticker change
                ticker={selectedTicker} 
                onToggleWatchlist={handleToggleWatchlist} 
                isWatched={isSelectedStockWatched}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                     <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center mb-4"><BriefcaseIcon /><span className="ml-2">Vos Actifs</span></h3>
                     {isPortfolioLoading ? (
                        <div className="space-y-2 animate-pulse">
                             <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                             <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                             <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        </div>
                    ) : (
                       <HoldingsTable holdings={refreshedPortfolio?.holdings || []} />
                    )}
                </div>
                <div className="space-y-8">
                    <WatchlistPanel 
                        watchlist={currentUserAccount.watchlist} 
                        onToggleWatchlist={handleToggleWatchlist}
                        onSelectStock={handleSelectStock}
                    />
                    <TransactionHistory transactions={currentUserAccount.transactions} />
                </div>
            </div>
             {/* Notification Area */}
            <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
                <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                    {levelUpNotification && (
                        <LevelUpNotification 
                            levelInfo={levelUpNotification} 
                            onClose={() => setLevelUpNotification(null)} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;

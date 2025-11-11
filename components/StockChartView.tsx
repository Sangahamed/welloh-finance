import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getHistoricalStockData } from '../services/geminiService';
import type { StockData, HistoricalPricePoint, Transaction } from '../types';
import { StarIcon } from './icons/Icons';

interface StockChartViewProps {
    ticker: string | null;
    onToggleWatchlist: (ticker: string, exchange: string) => void;
    isWatched: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const StockChartView: React.FC<StockChartViewProps> = ({ ticker, onToggleWatchlist, isWatched }) => {
    const { theme } = useTheme();
    const { currentUserAccount, updateCurrentUserAccount } = useAuth();
    
    const [stockData, setStockData] = useState<StockData | null>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalPricePoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [shares, setShares] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!ticker) {
            setStockData(null);
            setHistoricalData([]);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [stock, history] = await Promise.all([
                    getStockData(ticker),
                    getHistoricalStockData(ticker)
                ]);
                setStockData(stock);
                setHistoricalData(history);
            } catch (err) {
                setError(`Impossible de charger les données pour ${ticker}. Veuillez réessayer.`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [ticker]);

    const handleTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserAccount || !stockData) return;

        const numShares = parseInt(shares, 10);
        if (isNaN(numShares) || numShares <= 0) {
            alert("Veuillez entrer un nombre d'actions valide.");
            return;
        }

        const transactionCost = numShares * stockData.price;
        let { cash, holdings } = currentUserAccount.portfolio;
        
        const newTransaction: Transaction = {
            id: `txn_${Date.now()}`,
            type: tradeType,
            ticker: stockData.ticker,
            exchange: stockData.exchange,
            companyName: stockData.companyName,
            shares: numShares,
            price: stockData.price,
            timestamp: Date.now(),
        };

        if (tradeType === 'buy') {
            if (cash < transactionCost) {
                alert("Fonds insuffisants pour cet achat.");
                return;
            }
            cash -= transactionCost;
            
            const existingHoldingIndex = holdings.findIndex(h => h.ticker === stockData.ticker && h.exchange === stockData.exchange);
            if (existingHoldingIndex > -1) {
                const existing = holdings[existingHoldingIndex];
                const newTotalShares = existing.shares + numShares;
                const newPurchasePrice = ((existing.purchasePrice * existing.shares) + transactionCost) / newTotalShares;
                holdings[existingHoldingIndex] = { ...existing, shares: newTotalShares, purchasePrice: newPurchasePrice, currentValue: stockData.price };
            } else {
                holdings.push({
                    ticker: stockData.ticker,
                    exchange: stockData.exchange,
                    companyName: stockData.companyName,
                    shares: numShares,
                    purchasePrice: stockData.price,
                    currentValue: stockData.price,
                });
            }
        } else { // sell
            const existingHolding = holdings.find(h => h.ticker === stockData.ticker && h.exchange === stockData.exchange);
            if (!existingHolding || existingHolding.shares < numShares) {
                alert("Vous n'avez pas assez d'actions à vendre.");
                return;
            }
            cash += transactionCost;
            existingHolding.shares -= numShares;
            if (existingHolding.shares === 0) {
                holdings = holdings.filter(h => h.ticker !== stockData.ticker || h.exchange !== stockData.exchange);
            }
        }
        
        try {
            await updateCurrentUserAccount({
                portfolio: { ...currentUserAccount.portfolio, cash, holdings },
                transactions: [...currentUserAccount.transactions, newTransaction]
            });

            alert(`Transaction réussie !`);
            setShares('');
        } catch (err) {
            console.error("Échec de la transaction:", err);
            alert(`La transaction a échoué: ${err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'}`);
        }
    };
    
    const axisColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff';
    const tooltipBorder = theme === 'dark' ? '#4b5563' : '#d1d5db';
    
    if (!ticker) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                Sélectionnez une action de votre liste de surveillance ou recherchez-en une pour voir les détails.
            </div>
        );
    }
    
    if (isLoading) return <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 h-96 flex justify-center items-center">Chargement des données de l'action...</div>;
    if (error) return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">{error}</div>;
    if (!stockData) return null;

    const priceColor = stockData.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const holding = currentUserAccount?.portfolio.holdings.find(h => h.ticker === stockData.ticker);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stockData.companyName} ({stockData.ticker})</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stockData.exchange}</p>
                </div>
                <div className="text-right">
                    <p className={`text-3xl font-bold ${priceColor}`}>{formatCurrency(stockData.price)}</p>
                    <p className={`text-sm font-semibold ${priceColor}`}>{stockData.change > 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.percentChange})</p>
                </div>
                 <button onClick={() => onToggleWatchlist(stockData.ticker, stockData.exchange)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={isWatched ? "Retirer de la liste" : "Ajouter à la liste"}>
                    <StarIcon className={`h-6 w-6 ${isWatched ? 'text-yellow-400' : 'text-gray-400'}`} fill={isWatched ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Chart */}
            <div style={{ width: '100%', height: 300 }} className="mb-6">
                {isClient && (
                    <ResponsiveContainer>
                        <LineChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="date" stroke={axisColor} fontSize={12} tick={{ fill: axisColor }} />
                            <YAxis stroke={axisColor} domain={['auto', 'auto']} fontSize={12} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} tick={{ fill: axisColor }} />
                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} />
                            <Legend />
                            <Line type="monotone" dataKey="price" name="Prix de clôture" stroke="#4f46e5" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            {/* Trade Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2">
                     <h4 className="font-bold text-gray-800 dark:text-gray-200">Résumé</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stockData.summary}</p>
                     <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                         <div><span className="font-semibold text-gray-500 dark:text-gray-400">Volume:</span> {stockData.volume}</div>
                         <div><span className="font-semibold text-gray-500 dark:text-gray-400">Recommandation IA:</span> {stockData.recommendation} ({stockData.confidenceScore}%)</div>
                         {holding && (
                             <>
                                 <div><span className="font-semibold text-gray-500 dark:text-gray-400">Actions détenues:</span> {holding.shares}</div>
                                 <div><span className="font-semibold text-gray-500 dark:text-gray-400">Valeur détenue:</span> {formatCurrency(holding.shares * stockData.price)}</div>
                             </>
                         )}
                     </div>
                 </div>

                 <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0 md:pl-6">
                     <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Passer un Ordre</h4>
                     <form onSubmit={handleTrade}>
                         <div className="flex rounded-md shadow-sm mb-3">
                             <button type="button" onClick={() => setTradeType('buy')} className={`px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-l-md ${tradeType === 'buy' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>Acheter</button>
                             <button type="button" onClick={() => setTradeType('sell')} className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-300 dark:border-gray-600 rounded-r-md ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>Vendre</button>
                         </div>
                          <label htmlFor="shares" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantité</label>
                          <input
                            type="number"
                            id="shares"
                            value={shares}
                            onChange={(e) => setShares(e.target.value)}
                            min="1"
                            placeholder="Nombre d'actions"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Coût estimé: {formatCurrency(Number(shares) * stockData.price)}</p>
                          <button type="submit" className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                              Confirmer l'Ordre
                          </button>
                     </form>
                 </div>
            </div>
        </div>
    );
};

export default StockChartView;
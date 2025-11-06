import React, { useState, useEffect } from 'react';
import { getStockData } from '../services/geminiService';
import { StockData } from '../types';
import { ChartTrendingUpIcon, StarIcon } from './icons/Icons';

interface WatchlistPanelProps {
    watchlist: string[];
    onToggleWatchlist: (ticker: string) => void;
    onSelectStock: (ticker: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ watchlist, onToggleWatchlist, onSelectStock }) => {
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchWatchlistData = async () => {
            if (watchlist.length === 0) {
                setStocks([]);
                return;
            }
            setIsLoading(true);
            const stockPromises = watchlist.map(ticker => getStockData(ticker).catch(() => null));
            const results = await Promise.all(stockPromises);
            setStocks(results.filter((stock): stock is StockData => stock !== null));
            setIsLoading(false);
        };

        fetchWatchlistData();
    }, [watchlist]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center mb-4">
                <ChartTrendingUpIcon className="h-6 w-6 mr-2" />
                <span>Liste de Surveillance</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {isLoading && watchlist.length > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Chargement des données...</div>
                )}
                {!isLoading && stocks.length > 0 && stocks.map(stock => (
                    <div key={stock.ticker} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-1 cursor-pointer" onClick={() => onSelectStock(stock.ticker)}>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{stock.ticker}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{stock.companyName}</p>
                        </div>
                        <div className="text-right flex-1 cursor-pointer" onClick={() => onSelectStock(stock.ticker)}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(stock.price)}</p>
                            <p className={`text-xs font-semibold ${stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.percentChange})
                            </p>
                        </div>
                        <button 
                            onClick={() => onToggleWatchlist(stock.ticker)}
                            className="ml-4 text-yellow-400 hover:text-yellow-500 dark:text-yellow-500 dark:hover:text-yellow-400 p-1"
                            title="Retirer de la liste"
                        >
                            <StarIcon className="h-5 w-5" fill="currentColor" />
                        </button>
                    </div>
                ))}
                {!isLoading && watchlist.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Votre liste est vide. Recherchez une action pour l'ajouter.</p>
                )}
            </div>
        </div>
    );
};

export default WatchlistPanel;
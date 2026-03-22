import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getStockData, getHistoricalStockData } from '../services/geminiService';
import type { StockData, HistoricalPricePoint, Transaction } from '../types';
import NeonCard from './ui/NeonCard';
import NeonButton from './ui/NeonButton';
import NeonBadge from './ui/NeonBadge';
import NeonInput from './ui/NeonInput';
import { StarIcon, ArrowUpIcon, ArrowDownIcon, ChartTrendingUpIcon, SparklesIcon } from './icons/Icons';

interface StockChartViewProps {
  ticker: string | null;
  onToggleWatchlist: (ticker: string, exchange: string) => void;
  isWatched: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

// Custom Tooltip Component
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-neon-cyan/30">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-bold text-neon-cyan">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const StockChartView: React.FC<StockChartViewProps> = ({ ticker, onToggleWatchlist, isWatched }) => {
  const { currentUserAccount, updateCurrentUserAccount } = useAuth();
  
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop-loss'>('market');
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
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
        setError(`Impossible de charger les donnees pour ${ticker}. Veuillez reessayer.`);
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

    // Determine execution price based on order type
    let executionPrice = stockData.price;
    if (orderType === 'limit' || orderType === 'stop-loss') {
      const parsedLimitPrice = parseFloat(limitPrice);
      if (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
        alert("Veuillez entrer un prix valide pour l'ordre.");
        return;
      }
      if (orderType === 'limit' && tradeType === 'buy' && parsedLimitPrice < stockData.price) {
        alert(`Ordre limite placé à $${parsedLimitPrice.toFixed(2)}. Exécution simulée au prix limite.`);
      } else if (orderType === 'limit' && tradeType === 'sell' && parsedLimitPrice > stockData.price) {
        alert(`Ordre limite placé à $${parsedLimitPrice.toFixed(2)}. Exécution simulée au prix limite.`);
      } else if (orderType === 'stop-loss') {
        if (tradeType === 'sell' && parsedLimitPrice >= stockData.price) {
          alert(`Stop-loss déclenché : le prix actuel ($${stockData.price.toFixed(2)}) a atteint votre seuil.`);
        }
      }
      executionPrice = parsedLimitPrice;
    }

    const transactionCost = numShares * executionPrice;
    let { cash, holdings } = currentUserAccount.portfolio;
    
    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      type: tradeType,
      ticker: stockData.ticker,
      exchange: stockData.exchange,
      companyName: stockData.companyName,
      shares: numShares,
      price: executionPrice,
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
        holdings[existingHoldingIndex] = { ...existing, shares: newTotalShares, purchasePrice: newPurchasePrice, currentValue: executionPrice };
      } else {
        holdings.push({
          ticker: stockData.ticker,
          exchange: stockData.exchange,
          companyName: stockData.companyName,
          shares: numShares,
          purchasePrice: executionPrice,
          currentValue: executionPrice,
        });
      }
    } else {
      const existingHolding = holdings.find(h => h.ticker === stockData.ticker && h.exchange === stockData.exchange);
      if (!existingHolding || existingHolding.shares < numShares) {
        alert("Vous n'avez pas assez d'actions a vendre.");
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

      const orderLabel = orderType === 'market' ? 'Marché' : orderType === 'limit' ? 'Limite' : 'Stop-Loss';
      alert(`Ordre ${orderLabel} exécuté : ${tradeType === 'buy' ? 'Achat' : 'Vente'} de ${numShares} ${stockData.ticker} à $${executionPrice.toFixed(2)}`);
      setShares('');
      setLimitPrice('');
    } catch (err) {
      console.error("Echec de la transaction:", err);
      alert(`La transaction a echoue: ${err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'}`);
    }
  };
  
  if (!ticker) {
    return (
      <NeonCard variant="default" className="p-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-white/5 border border-white/10 mb-6">
            <ChartTrendingUpIcon className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">Selectionnez une action de votre liste</p>
          <p className="text-gray-500 text-sm mt-2">ou recherchez-en une pour voir les details</p>
        </div>
      </NeonCard>
    );
  }
  
  if (isLoading) {
    return (
      <NeonCard variant="default" className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 skeleton rounded" />
              <div className="h-4 w-32 skeleton rounded" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-8 w-32 skeleton rounded ml-auto" />
              <div className="h-4 w-20 skeleton rounded ml-auto" />
            </div>
          </div>
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </NeonCard>
    );
  }

  if (error) {
    return (
      <NeonCard variant="default" className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      </NeonCard>
    );
  }

  if (!stockData) return null;

  const isPositive = stockData.change >= 0;
  const holding = currentUserAccount?.portfolio.holdings.find(h => h.ticker === stockData.ticker);

  return (
    <NeonCard variant={isPositive ? 'green' : 'default'} glow={isPositive} className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {stockData.companyName}
            </h2>
            <NeonBadge variant="cyan" size="sm">{stockData.ticker}</NeonBadge>
          </div>
          <p className="text-gray-400">{stockData.exchange}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-2xl md:text-3xl font-bold font-display ${isPositive ? 'text-neon-green text-glow-green' : 'text-red-400'}`}>
              {formatCurrency(stockData.price)}
            </p>
            <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{stockData.change.toFixed(2)}</span>
              <span>({stockData.percentChange})</span>
            </div>
          </div>
          
          <button 
            onClick={() => onToggleWatchlist(stockData.ticker, stockData.exchange)} 
            className={`
              p-3 rounded-xl border transition-all duration-300
              ${isWatched 
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30'
              }
            `}
            title={isWatched ? "Retirer de la liste" : "Ajouter a la liste"}
          >
            <StarIcon className="w-5 h-5" fill={isWatched ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80 mb-6 rounded-xl bg-dark-800/50 p-4 border border-white/5">
        {isClient && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#00FF88' : '#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? '#00FF88' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                domain={['auto', 'auto']} 
                fontSize={11}
                tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#00FF88' : '#ef4444'} 
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-neon-violet" />
              Resume IA
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">{stockData.summary}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Volume</p>
              <p className="text-sm font-semibold text-white">{stockData.volume}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Recommandation</p>
              <p className="text-sm font-semibold text-neon-cyan">{stockData.recommendation}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Confiance IA</p>
              <p className="text-sm font-semibold text-neon-green">{stockData.confidenceScore}%</p>
            </div>
            {holding && (
              <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
                <p className="text-xs text-gray-500 mb-1">Vous detenez</p>
                <p className="text-sm font-semibold text-neon-cyan">{holding.shares} actions</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Panel */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="font-bold text-white mb-4">Passer un Ordre</h4>
          <form onSubmit={handleTrade} className="space-y-3">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-dark-700/50">
              <button 
                type="button" 
                onClick={() => setTradeType('buy')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  ${tradeType === 'buy' 
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-lg shadow-neon-green/20' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                Acheter
              </button>
              <button 
                type="button" 
                onClick={() => setTradeType('sell')}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                  ${tradeType === 'sell' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                Vendre
              </button>
            </div>

            {/* Order Type Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Type d'ordre</label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-dark-700/50">
                {(['market', 'limit', 'stop-loss'] as const).map(ot => (
                  <button
                    key={ot}
                    type="button"
                    onClick={() => { setOrderType(ot); setLimitPrice(''); }}
                    className={`
                      px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300
                      ${orderType === ot
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                        : 'text-gray-400 hover:text-white'
                      }
                    `}
                  >
                    {ot === 'market' ? 'Marché' : ot === 'limit' ? 'Limite' : 'Stop-Loss'}
                  </button>
                ))}
              </div>
              {orderType !== 'market' && (
                <p className="text-xs text-gray-500 mt-1">
                  {orderType === 'limit'
                    ? tradeType === 'buy'
                      ? 'Achat exécuté au prix cible ou inférieur.'
                      : 'Vente exécutée au prix cible ou supérieur.'
                    : 'Vente automatique si le cours tombe sous le seuil.'}
                </p>
              )}
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Quantité</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min="1"
                placeholder="Nombre d'actions"
                required
                className="
                  w-full bg-dark-700/50 border border-white/10 rounded-xl
                  px-4 py-3 text-white placeholder-gray-500
                  focus:border-neon-cyan focus:ring-0 focus:outline-none
                  focus:shadow-lg focus:shadow-neon-cyan/20
                  transition-all duration-300
                "
              />
            </div>

            {/* Limit/Stop Price Input */}
            {orderType !== 'market' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {orderType === 'limit' ? 'Prix limite ($)' : 'Prix stop-loss ($)'}
                </label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  step="0.01"
                  min="0.01"
                  placeholder={`Actuel: $${stockData.price.toFixed(2)}`}
                  required
                  className="
                    w-full bg-dark-700/50 border border-neon-cyan/30 rounded-xl
                    px-4 py-3 text-white placeholder-gray-500
                    focus:border-neon-cyan focus:ring-0 focus:outline-none
                    focus:shadow-lg focus:shadow-neon-cyan/20
                    transition-all duration-300
                  "
                />
              </div>
            )}

            {/* Estimated Cost */}
            <div className="p-3 rounded-xl bg-dark-800/50 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {orderType === 'market' ? 'Coût estimé' : 'Coût au prix cible'}
                </span>
                <span className="text-lg font-bold text-white">
                  {formatCurrency(Number(shares || 0) * (orderType === 'market' ? stockData.price : (parseFloat(limitPrice) || stockData.price)))}
                </span>
              </div>
              {orderType !== 'market' && limitPrice && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Prix marché actuel</span>
                  <span>{formatCurrency(stockData.price)}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <NeonButton
              type="submit"
              variant={tradeType === 'buy' ? 'green' : 'orange'}
              size="lg"
              fullWidth
            >
              {orderType === 'market' ? '' : orderType === 'limit' ? '⚡ ' : '🛡 '}
              {tradeType === 'buy' ? 'Acheter' : 'Vendre'} {shares || 0} actions
            </NeonButton>
          </form>
        </div>
      </div>
    </NeonCard>
  );
};

export default StockChartView;

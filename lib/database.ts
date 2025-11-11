import { supabase } from './supabaseClient';
import type { UserAccount, StockHolding, Transaction, WatchlistItem, HistoryItem, Alert } from '../types';

/**
 * Fetches all necessary user data from the new database schema and assembles it
 * into the single UserAccount object the application expects.
 */
export const getUserAccount = async (userId: string): Promise<UserAccount | null> => {
    if (!supabase) return null;
    
    // 1. Fetch profile from 'profiles' table
    const { data: profiles, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', userId).single();

    if (profileError || !profiles) { 
        console.error('Error fetching profile:', profileError?.message); 
        return null; 
    }
    const profile = profiles;

    // 2. Fetch portfolio - Made robust against multiple portfolio entries.
    const { data: portfoliosData, error: portfolioError } = await supabase
        .from('portfolios').select('*').eq('user_id', userId);

    if (portfolioError) {
        console.error('Error fetching portfolio:', portfolioError.message);
        return null;
    }
    if (!portfoliosData || portfoliosData.length === 0) {
        console.error('Error fetching portfolio: No portfolio found for user.');
        return null;
    }
    // Handle potential duplicates by taking the first one.
    const portfolio = portfoliosData[0];

    // 3. Fetch holdings for the portfolio
    const { data: holdingsData, error: holdingsError } = await supabase
        .from('holdings').select('ticker, shares, purchase_price, exchange').eq('portfolio_id', portfolio.id);
    
    if (holdingsError) { console.error('Error fetching holdings:', holdingsError.message); return null; }

    // 4. Fetch transactions for the portfolio
    const { data: dbTransactions, error: transactionsError } = await supabase
        .from('transactions').select('*').eq('portfolio_id', portfolio.id).order('timestamp', { ascending: false });

    if (transactionsError) { console.error('Error fetching transactions:', transactionsError.message); return null; }

    // 5. Fetch watchlist items
    const { data: watchlist, error: watchlistError } = await supabase
        .from('watchlists').select('id').eq('user_id', userId).single();
    
    let watchlistItems: WatchlistItem[] = [];
    if (watchlistError || !watchlist) { 
        console.error('Error fetching watchlist:', watchlistError?.message); 
    } else {
        const { data: items, error: itemsError } = await supabase
            .from('watchlist_items')
            .select('ticker, exchange')
            .eq('watchlist_id', watchlist.id);
        
        if (itemsError) {
            console.error('Error fetching watchlist items:', itemsError.message);
        } else if (items) {
            watchlistItems = items.map(item => ({ ticker: item.ticker, exchange: item.exchange }));
        }
    }
    
    // 6. Fetch analysis history
    const { data: historyData, error: historyError } = await supabase
        .from('analysis_histories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);

    if (historyError) { console.error('Error fetching analysis history:', historyError.message); }

    // 7. Fetch alerts
    const { data: alertsData, error: alertsError } = await supabase
        .from('analysis_alerts').select('*').eq('user_id', userId);

    if (alertsError) { console.error('Error fetching alerts:', alertsError.message); }


    // Assemble the UserAccount object
    const holdings: StockHolding[] = holdingsData.map(h => ({
        ticker: h.ticker,
        exchange: h.exchange,
        companyName: '', // This is fetched dynamically in the UI
        shares: h.shares,
        purchasePrice: h.purchase_price,
    }));
    
    const transactions: Transaction[] = dbTransactions.map(t => ({
        id: t.id,
        type: t.type.toLowerCase() as 'buy' | 'sell',
        ticker: t.ticker,
        exchange: t.exchange,
        companyName: '', // Fetched dynamically
        shares: t.shares,
        price: t.price,
        timestamp: new Date(t.timestamp).getTime(),
    }));

    const analysisHistory: HistoryItem[] = (historyData || []).map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        companyIdentifier: item.company_identifier,
        comparisonIdentifier: item.comparison_identifier,
        currency: item.currency,
        analysisData: item.analysis_data,
        news: item.news_data,
    }));

    const alerts: Alert[] = (alertsData || []).map(item => ({
        id: item.id,
        metricLabel: item.metric_label,
        condition: item.condition,
        threshold: item.threshold,
    }));

    return {
        id: profile.id,
        fullName: profile.full_name,
        role: profile.role || 'user',
        country: profile.country,
        institution: profile.institution,
        portfolio: {
            cash: portfolio.cash_balance,
            initialValue: portfolio.initial_capital,
            holdings: holdings,
        },
        transactions: transactions,
        watchlist: watchlistItems,
        analysisHistory,
        alerts,
    };
};

/**
 * Updates a user account by disassembling the partial UserAccount object
 * and targeting the correct tables in the new database schema.
 */
export const updateUserAccount = async (userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> => {
    if (!supabase) return null;

    const { data: currentPortfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).single();
    if (!currentPortfolio) throw new Error("Cannot update account without a portfolio.");
    const portfolioId = currentPortfolio.id;

    if (updates.portfolio) {
        const { cash, holdings } = updates.portfolio;
        await supabase.from('portfolios').update({ cash_balance: cash }).eq('id', portfolioId);
        
        // Clear and re-insert holdings
        const { error: deleteError } = await supabase.from('holdings').delete().eq('portfolio_id', portfolioId);
        if (deleteError) throw deleteError;

        if (holdings.length > 0) {
            const holdingsToInsert = holdings.map(h => ({
                portfolio_id: portfolioId,
                ticker: h.ticker,
                exchange: h.exchange,
                shares: h.shares,
                purchase_price: h.purchasePrice,
            }));
            const { error: insertError } = await supabase.from('holdings').insert(holdingsToInsert);
            if (insertError) throw insertError;
        }
    }

    if (updates.transactions && updates.transactions.length > 0) {
        // The new transaction is appended to the end of the array by the client.
        const newTransaction = updates.transactions[updates.transactions.length - 1];
        
        // The database schema generates the UUID, so we don't send the client-generated ID.
        const { error } = await supabase.from('transactions').insert({
            portfolio_id: portfolioId,
            ticker: newTransaction.ticker,
            exchange: newTransaction.exchange,
            type: newTransaction.type.toUpperCase(),
            shares: newTransaction.shares,
            price: newTransaction.price,
            timestamp: new Date(newTransaction.timestamp).toISOString(),
        });

        if (error) throw error;
    }

    if (updates.watchlist) {
        const { data: watchlist } = await supabase.from('watchlists').select('id').eq('user_id', userId).single();
        if(watchlist) {
            await supabase.from('watchlist_items').delete().eq('watchlist_id', watchlist.id);
            const itemsToInsert = updates.watchlist.map(item => ({ 
                watchlist_id: watchlist.id, 
                ticker: item.ticker,
                exchange: item.exchange
            }));
            if (itemsToInsert.length > 0) {
                 await supabase.from('watchlist_items').insert(itemsToInsert);
            }
        }
    }
    
    return getUserAccount(userId);
};


/**
 * Gets all user accounts and assembles their data for the admin dashboard.
 */
export const getAllUsers = async (): Promise<UserAccount[]> => {
    if (!supabase) return [];
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    
    if (error) {
        console.error('Error fetching all users:', error.message);
        return [];
    }

    const userAccounts = await Promise.all(
        profiles.map(profile => getUserAccount(profile.id))
    );
    
    return userAccounts.filter((account): account is UserAccount => account !== null);
};

// New functions for Analysis History
export const addAnalysisHistory = async (userId: string, item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem | null> => {
    if (!supabase) return null;
    const { error, data } = await supabase
        .from('analysis_histories')
        .insert({
            user_id: userId,
            company_identifier: item.companyIdentifier,
            comparison_identifier: item.comparisonIdentifier,
            currency: item.currency,
            analysis_data: item.analysisData,
            news_data: item.news,
        })
        .select()
        .single();
    if (error) {
        console.error("Error adding analysis history:", error.message);
        return null;
    }
    return {
        id: data.id,
        timestamp: new Date(data.created_at).getTime(),
        companyIdentifier: data.company_identifier,
        comparisonIdentifier: data.comparison_identifier,
        currency: data.currency,
        analysisData: data.analysis_data,
        news: data.news_data,
    };
};

export const clearAnalysisHistory = async (userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('analysis_histories').delete().eq('user_id', userId);
    if (error) {
        console.error("Error clearing analysis history:", error.message);
        return false;
    }
    return true;
};

// New functions for Alerts
export const addAlert = async (userId: string, alertData: Omit<Alert, 'id'>): Promise<Alert | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('analysis_alerts')
        .insert({
            user_id: userId,
            metric_label: alertData.metricLabel,
            condition: alertData.condition,
            threshold: alertData.threshold,
        })
        .select()
        .single();
    
    if (error) {
        console.error("Error adding alert:", error.message);
        return null;
    }
    return {
        id: data.id,
        metricLabel: data.metric_label,
        condition: data.condition,
        threshold: data.threshold,
    };
};

export const removeAlert = async (alertId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase.from('analysis_alerts').delete().eq('id', alertId);
    if (error) {
        console.error("Error removing alert:", error.message);
        return false;
    }
    return true;
};
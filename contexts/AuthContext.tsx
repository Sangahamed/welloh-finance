import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    getUserAccount,
    updateUserAccount,
    getAllUsers,
    addAnalysisHistory as dbAddAnalysisHistory,
    clearAnalysisHistory as dbClearAnalysisHistory,
    addAlert as dbAddAlert,
    removeAlert as dbRemoveAlert,
} from '../lib/database';
import type { User, UserAccount, HistoryItem, Alert } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SignUpData {
    fullName: string;
    email: string;
    password: string;
    country: string;
    institution: string;
}

interface AuthContextType {
    currentUser: User | null;
    currentUserAccount: UserAccount | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (signupData: Omit<SignUpData, 'password'> & {password: string}) => Promise<void>;
    logout: () => Promise<void>;
    updateCurrentUserAccount: (updates: Partial<UserAccount>) => Promise<void>;
    getAllUserAccounts: () => Promise<UserAccount[]>;
    getUserAccountById: (userId: string) => Promise<UserAccount | null>;
    addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
    clearHistory: () => Promise<void>;
    addAlert: (alertData: Omit<Alert, 'id'>) => Promise<void>;
    removeAlert: (alertId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserAccount = useCallback(async (supabaseUser: SupabaseUser | null) => {
        if (supabaseUser) {
            try {
                // Rely entirely on the backend trigger to have created the account.
                const account = await getUserAccount(supabaseUser.id);
                
                if (account) {
                    const userWithEmail: User = {
                        id: account.id,
                        email: supabaseUser.email,
                        fullName: account.fullName,
                        role: account.role,
                    };

                    const accountWithEmail: UserAccount = {
                        ...account,
                        email: supabaseUser.email,
                    };

                    setCurrentUser(userWithEmail);
                    setCurrentUserAccount(accountWithEmail);
                } else {
                    // This can happen if the trigger fails or is slow.
                    // We log an error and don't log the user in to avoid an inconsistent state.
                    console.error(`User account for ${supabaseUser.id} not found. The creation trigger might have failed.`);
                    setCurrentUser(null);
                    setCurrentUserAccount(null);
                }

            } catch (e: any) {
                 console.error("Failed to fetch user account:", e.message);
                 await supabase?.auth.signOut(); // Sign out on failure
                 setCurrentUser(null);
                 setCurrentUserAccount(null);
            }
        } else {
            setCurrentUser(null);
            setCurrentUserAccount(null);
        }
        setIsLoading(false);
    }, []);
    
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await fetchUserAccount(session?.user ?? null);
        };

        getInitialSession();
        
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await fetchUserAccount(session?.user ?? null);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [fetchUserAccount]);

    const login = async (email: string, password: string) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("L'adresse e-mail ou le mot de passe est incorrect.");
            }
            throw new Error(error.message);
        }
    };

    const signup = async (signupData: SignUpData) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        
        const { fullName, email, password, country, institution } = signupData;

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    country,
                    institution,
                }
            }
        });

        if (signUpError) {
            if (signUpError.message.includes("User already registered")) {
                throw new Error("Un utilisateur avec cette adresse e-mail existe déjà.");
            }
            throw new Error(signUpError.message);
        }
    };

    const logout = async () => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setCurrentUser(null);
        setCurrentUserAccount(null);
    };
    
    const updateCurrentUserAccount = async (updates: Partial<UserAccount>) => {
        if (!currentUserAccount) return;
        const updatedAccount = await updateUserAccount(currentUserAccount.id, updates);
        if (updatedAccount) {
            // Re-add email from auth context, as updateUserAccount returns from DB without it
            const accountWithEmail: UserAccount = {
                ...updatedAccount,
                email: currentUserAccount.email,
            };
            setCurrentUserAccount(accountWithEmail);
        }
    };
    
    const getAllUserAccounts = async (): Promise<UserAccount[]> => {
        return await getAllUsers();
    };

    const getUserAccountById = async (userId: string): Promise<UserAccount | null> => {
        return await getUserAccount(userId);
    };

    const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        if (!currentUser) return;
        const newItem = await dbAddAnalysisHistory(currentUser.id, item);
        if (newItem && currentUserAccount) {
            const updatedHistory = [newItem, ...currentUserAccount.analysisHistory].slice(0, 20);
            setCurrentUserAccount(prev => prev ? { ...prev, analysisHistory: updatedHistory } : null);
        }
    };

    const clearHistory = async () => {
        if (!currentUser) return;
        const success = await dbClearAnalysisHistory(currentUser.id);
        if (success && currentUserAccount) {
            setCurrentUserAccount(prev => prev ? { ...prev, analysisHistory: [] } : null);
        }
    };

    const addAlert = async (alertData: Omit<Alert, 'id'>) => {
        if (!currentUser) return;
        const newAlert = await dbAddAlert(currentUser.id, alertData);
        if (newAlert && currentUserAccount) {
            setCurrentUserAccount(prev => prev ? { ...prev, alerts: [...prev.alerts, newAlert] } : null);
        }
    };
    
    const removeAlert = async (alertId: string) => {
        if (!currentUser) return;
        const success = await dbRemoveAlert(alertId);
        if (success && currentUserAccount) {
            const updatedAlerts = currentUserAccount.alerts.filter(a => a.id !== alertId);
            setCurrentUserAccount(prev => prev ? { ...prev, alerts: updatedAlerts } : null);
        }
    };

    const value = {
        currentUser,
        currentUserAccount,
        isLoading,
        login,
        signup,
        logout,
        updateCurrentUserAccount,
        getAllUserAccounts,
        getUserAccountById,
        addHistoryItem,
        clearHistory,
        addAlert,
        removeAlert,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
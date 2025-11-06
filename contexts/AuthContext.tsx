import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { User, UserAccount } from '../types';
import * as db from '../lib/database';

const CURRENT_USER_SESSION_KEY = 'welloh_current_user_email';

interface AuthContextType {
  currentUser: User | null;
  currentUserAccount: UserAccount | null;
  login: (email: string, password_provided: string) => Promise<void>;
  signup: (fullName: string, email: string, password_provided: string) => Promise<void>;
  logout: () => void;
  updateCurrentUserAccount: (updates: Partial<UserAccount>) => Promise<void>;
  getAllUserAccounts: () => Promise<UserAccount[]>;
  getUserAccountById: (id: string) => Promise<UserAccount | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);

    useEffect(() => {
        // On initial load, check for a logged-in user in sessionStorage
        const loggedInUserEmail = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
        if (loggedInUserEmail) {
            db.getUserByEmail(loggedInUserEmail).then(user => {
                if (user) {
                    setCurrentUserAccount(user);
                }
            });
        }
    }, []);

    const login = async (email: string, password_provided: string): Promise<void> => {
        const user = await db.getUserByEmail(email);

        if (!user || user.password !== password_provided) {
            throw new Error("Email ou mot de passe invalide.");
        }
        
        sessionStorage.setItem(CURRENT_USER_SESSION_KEY, user.email);
        setCurrentUserAccount(user);
    };

    const signup = async (fullName: string, email: string, password_provided: string): Promise<void> => {
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            throw new Error("Un compte avec cet email existe déjà.");
        }

        const newUserAccountData = {
            fullName,
            email,
            password: password_provided, // Again, don't do this in production
            role: 'user' as const,
            portfolio: {
                cash: 100000,
                holdings: [],
                initialValue: 100000,
                winRate: "N/A",
                avgGainLoss: "N/A",
                sharpeRatio: "N/A"
            },
            transactions: [],
            watchlist: [],
        };
        
        const newUser = await db.createUser(newUserAccountData);

        sessionStorage.setItem(CURRENT_USER_SESSION_KEY, newUser.email);
        setCurrentUserAccount(newUser);
    };

    const logout = () => {
        sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
        setCurrentUserAccount(null);
        window.location.hash = 'landing';
    };

    const updateCurrentUserAccount = useCallback(async (updates: Partial<UserAccount>) => {
        if (!currentUserAccount) return;

        const updatedAccount = await db.updateUser(currentUserAccount.id, updates);
        setCurrentUserAccount(updatedAccount);
        
    }, [currentUserAccount]);

    const getAllUserAccounts = useCallback(async (): Promise<UserAccount[]> => {
        return await db.getAllUsers();
    }, []);

    const getUserAccountById = useCallback(async (id: string): Promise<UserAccount | undefined> => {
        return await db.getUserById(id);
    }, []);
    
    // currentUser is a subset of currentUserAccount for public consumption
    const currentUser: User | null = currentUserAccount ? {
        id: currentUserAccount.id,
        email: currentUserAccount.email,
        fullName: currentUserAccount.fullName,
        role: currentUserAccount.role
    } : null;

    return (
        <AuthContext.Provider value={{ currentUser, currentUserAccount, login, signup, logout, updateCurrentUserAccount, getAllUserAccounts, getUserAccountById }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
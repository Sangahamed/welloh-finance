import type { UserAccount } from '../types';

// This file simulates a database connection.
// In a real application, these functions would interact with Supabase or another backend service.
// For now, they use localStorage but are asynchronous to mimic network latency.

const USERS_STORAGE_KEY = 'welloh_users';

const simulateLatency = (delay: number = 50) => new Promise(res => setTimeout(res, delay));

// --- Private Helper Functions ---

const getUsersFromStorage = (): UserAccount[] => {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        if (users) {
            return JSON.parse(users);
        }
        // Initialize with an admin user if no users exist
        const adminUser: UserAccount = {
            id: `user_${Date.now()}_admin`,
            fullName: 'Admin User',
            email: 'admin@welloh.com',
            password: 'password123', // In a real app, this would be hashed
            role: 'admin',
            portfolio: {
                cash: 1000000,
                holdings: [],
                initialValue: 1000000,
                winRate: 'N/A',
                avgGainLoss: 'N/A',
                sharpeRatio: 'N/A'
            },
            transactions: [],
            watchlist: ['AAPL', 'GOOGL', 'BRVM.BRVM'],
        };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
        return [adminUser];
    } catch (e) {
        console.error("Failed to read from localStorage", e);
        return [];
    }
};

const saveUsersToStorage = (users: UserAccount[]) => {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Failed to save to localStorage", e);
    }
};

// --- Public Database API ---

export const getAllUsers = async (): Promise<UserAccount[]> => {
    await simulateLatency(250); // Simulate fetching multiple records
    return getUsersFromStorage();
};

export const getUserById = async (id: string): Promise<UserAccount | undefined> => {
    await simulateLatency();
    const users = getUsersFromStorage();
    return users.find(u => u.id === id);
};

export const getUserByEmail = async (email: string): Promise<UserAccount | undefined> => {
    await simulateLatency();
    const users = getUsersFromStorage();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = async (newUserData: Omit<UserAccount, 'id'>): Promise<UserAccount> => {
    await simulateLatency();
    const users = getUsersFromStorage();
    
    if (users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase())) {
        throw new Error("Un compte avec cet email existe déjà.");
    }
    
    const newUser: UserAccount = {
        ...newUserData,
        id: `user_${Date.now()}`,
    };
    
    const updatedUsers = [...users, newUser];
    saveUsersToStorage(updatedUsers);
    return newUser;
};

export const updateUser = async (userId: string, updates: Partial<UserAccount>): Promise<UserAccount> => {
    await simulateLatency();
    const users = getUsersFromStorage();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        throw new Error("Utilisateur non trouvé.");
    }

    // Ensure we don't overwrite the ID with the partial update
    const updatedUser = { ...users[userIndex], ...updates, id: userId };
    users[userIndex] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
};

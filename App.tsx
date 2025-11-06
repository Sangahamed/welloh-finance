import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Import views
import LandingView from './components/LandingView';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';
import DashboardView from './components/DashboardView';
import AnalysisView from './components/AnalysisView';
import StrategyView from './components/StrategyView';
import EducationView from './components/EducationView';
import AdminDashboardView from './components/AdminDashboardView';
import ProfileView from './components/ProfileView';

const App: React.FC = () => {
    const { currentUser } = useAuth();
    const [currentPage, setCurrentPage] = useState('landing');
    const [pageId, setPageId] = useState<string | null>(null);

    const handleNavigate = useCallback((page: string) => {
        window.location.hash = page;
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const [page, id] = hash.split('/');
            const newPage = page || (currentUser ? 'simulation' : 'landing');
            setCurrentPage(newPage);
            setPageId(id || null);
        };
        
        handleHashChange(); // Set initial page
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [currentUser]);

    // Effect to handle redirection for logged-in users on the landing page
    useEffect(() => {
        if (currentUser && currentPage === 'landing') {
            handleNavigate('simulation');
        }
    }, [currentUser, currentPage, handleNavigate]);

    const renderPage = useMemo(() => {
        if (!currentUser) {
            switch (currentPage) {
                case 'login':
                    return <LoginView onNavigate={handleNavigate} />;
                case 'signup':
                    return <SignUpView onNavigate={handleNavigate} />;
                case 'landing':
                default:
                    return <LandingView onNavigate={handleNavigate} />;
            }
        }

        // User is logged in
        switch (currentPage) {
            case 'simulation':
                return <DashboardView onNavigate={handleNavigate} />;
            case 'analysis':
                return <AnalysisView />;
            case 'strategy':
                return <StrategyView />;
            case 'education':
                return <EducationView />;
            case 'admin':
                return currentUser.role === 'admin' ? <AdminDashboardView onNavigate={handleNavigate} /> : <h2>Access Denied</h2>;
            case 'profile':
                 return pageId ? <ProfileView userId={pageId} onNavigate={handleNavigate} /> : <h2>User ID missing</h2>;
            case 'landing':
                 // The useEffect above handles the redirect. Show a loading state.
                 return <div className="text-center p-8">Redirection...</div>;
            default:
                 // If page is not found for a logged-in user, redirect to simulation
                 handleNavigate('simulation');
                 return <div className="text-center p-8">Page non trouvée. Redirection...</div>;
        }
    }, [currentPage, pageId, currentUser, handleNavigate]);


    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Header currentPage={currentPage} onNavigate={handleNavigate} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <ErrorBoundary>
                    {renderPage}
                </ErrorBoundary>
            </main>
            <Footer />
        </div>
    );
};

export default App;
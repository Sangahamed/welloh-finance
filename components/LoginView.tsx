import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { ExclamationTriangleIcon, GoogleIcon, AppleIcon } from './icons/Icons';

interface LoginViewProps {
  onNavigate: (page: string) => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode, providerName: string }> = ({ icon, providerName }) => (
    <button
        type="button"
        className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-transparent text-sm font-medium text-gray-300 hover:bg-gray-700"
    >
        <span className="mr-2">{icon}</span>
        Continuer avec {providerName}
    </button>
);

const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(email, password);
            // The auth listener will still run, but we navigate immediately
            // for a better user experience. The App component's guard logic
            // will ensure consistency once the user state is updated.
            onNavigate('simulation');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Ravis de vous revoir !">
            <div className="space-y-4">
                <SocialButton icon={<GoogleIcon />} providerName="Google" />
                <SocialButton icon={<AppleIcon />} providerName="Apple" />
            </div>

             <div className="my-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#1C1F2A] text-gray-400">
                           OU CONTINUER AVEC
                        </span>
                    </div>
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Adresse e-mail
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Mot de passe
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </div>
            </form>
             <div className="mt-6 text-center text-sm">
                 <span className="text-gray-400">Pas encore de compte ? </span>
                 <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="font-medium text-indigo-400 hover:text-indigo-300">
                    S'inscrire
                </a>
            </div>
        </AuthLayout>
    );
};

export default LoginView;
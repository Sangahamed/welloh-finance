import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { ExclamationTriangleIcon, GoogleIcon, AppleIcon } from './icons/Icons';

interface SignUpViewProps {
    onNavigate: (page: string) => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode, providerName: string }> = ({ icon, providerName }) => (
    <button
        type="button"
        className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-transparent text-sm font-medium text-gray-300 hover:bg-gray-700"
    >
        <span className="mr-2">{icon}</span>
        S'inscrire avec {providerName}
    </button>
);

const PasswordRequirement: React.FC<{ meets: boolean, text: string }> = ({ meets, text }) => (
    <p className={`text-xs ${meets ? 'text-green-400' : 'text-gray-400'}`}>
        {meets ? '✓' : '•'} {text}
    </p>
);

const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        institution: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const { signup } = useAuth();

    const isPasswordLongEnough = formData.password.length >= 6;
    const doPasswordsMatch = formData.password && formData.password === formData.confirmPassword;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!isPasswordLongEnough) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (!doPasswordsMatch) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setIsLoading(true);

        try {
            const { confirmPassword, ...signupData } = formData;
            await signup(signupData);
            setIsSignedUp(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSignedUp) {
        return (
            <AuthLayout title="Vérifiez votre boîte de réception !">
                <div className="text-center text-gray-300 space-y-4">
                    <p className="text-lg">Inscription réussie !</p>
                    <p>
                        Un lien de confirmation a été envoyé à 
                        <span className="font-bold text-indigo-400 block">{formData.email}</span>.
                    </p>
                    <p>
                        Veuillez cliquer sur ce lien pour activer votre compte. Vous pourrez ensuite vous connecter.
                    </p>
                    <button
                        onClick={() => onNavigate('login')}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Aller à la page de connexion
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Rejoignez Welloh aujourd'hui">
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
                           OU S'INSCRIRE AVEC L'EMAIL
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
                
                <fieldset className="space-y-4">
                    <legend className="sr-only">Informations de Compte</legend>
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Nom complet</label>
                        <div className="mt-1">
                            <input id="fullName" name="fullName" type="text" autoComplete="name" required value={formData.fullName} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Adresse e-mail</label>
                        <div className="mt-1">
                            <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Mot de passe</label>
                        <div className="mt-1">
                            <input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirmer le mot de passe</label>
                        <div className="mt-1">
                            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                     <div className="space-y-1">
                        <PasswordRequirement meets={isPasswordLongEnough} text="Au moins 6 caractères" />
                        <PasswordRequirement meets={doPasswordsMatch} text="Les mots de passe correspondent" />
                    </div>
                </fieldset>
                
                 <fieldset className="space-y-4 pt-4 border-t border-gray-700">
                    <legend className="block text-sm font-medium text-gray-300 mb-2">Informations Personnelles</legend>
                     <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-300">Pays</label>
                        <div className="mt-1">
                            <input id="country" name="country" type="text" placeholder="Ex: Sénégal" required value={formData.country} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="institution" className="block text-sm font-medium text-gray-300">Institution (Université/Entreprise)</label>
                        <div className="mt-1">
                            <input id="institution" name="institution" type="text" placeholder="Ex: UCAO" required value={formData.institution} onChange={handleChange} disabled={isLoading} className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 disabled:opacity-50" />
                        </div>
                    </div>
                </fieldset>

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Création du compte...' : "Créer mon compte"}
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm">
                 <span className="text-gray-400">Déjà un compte ? </span>
                 <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="font-medium text-indigo-400 hover:text-indigo-300">
                    Se connecter
                </a>
            </div>
        </AuthLayout>
    );
};

export default SignUpView;
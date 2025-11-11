import React from 'react';
import { ChartTrendingUpIcon, GlobeAltIcon, SparklesIcon, ShieldCheckIcon, BookOpenIcon } from './icons/Icons';

interface LandingViewProps {
    onNavigate: (view: string) => void;
}

const Feature: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex flex-col items-center text-center p-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-500 text-white">
            {icon}
        </div>
        <h3 className="mt-5 text-lg font-medium text-white">{title}</h3>
        <p className="mt-2 text-base text-gray-400">
            {children}
        </p>
    </div>
);

const TrustCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg">
        <div className="flex items-center text-indigo-400">
            {icon}
            <h3 className="ml-3 text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-4 text-gray-400">{children}</p>
    </div>
);


const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 text-center">
                <div className="absolute inset-0 top-0 h-full w-full bg-gradient-to-b from-indigo-900/30 via-[#0B0E15] to-[#0B0E15] animate-gradient-pan -z-10"></div>
                
                 <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
                 <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl animate-fade-in-up">
                    <span className="block">Pilotez votre avenir financier.</span>
                    <span className="block text-indigo-400 mt-2">Simulez, analysez, excellez.</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300 sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Entraînez-vous sans risque sur les marchés mondiaux et africains, analysez avec l'IA, et transformez vos performances en opportunités de carrière.
                </p>
                <div className="mt-8 flex justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={() => onNavigate('signup')}
                        className="w-full max-w-xs flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105"
                    >
                        Commencer gratuitement
                    </button>
                </div>
                 <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <div className="relative p-2 bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 max-w-4xl mx-auto">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-25"></div>
                        <img src="https://i.imgur.com/uG9G6Qc.png" alt="Dashboard Welloh" className="relative rounded-lg" />
                    </div>
                </div>
            </div>
            
            {/* Social Proof */}
            <div className="py-16">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider">ILS NOUS FONT CONFIANCE</p>
                     <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-4">
                         <div className="col-span-1 flex justify-center">
                            <span className="text-3xl font-medium text-gray-500">Société Générale</span>
                         </div>
                         <div className="col-span-1 flex justify-center">
                             <span className="text-3xl font-medium text-gray-500">BNP Paribas</span>
                         </div>
                         <div className="col-span-1 flex justify-center">
                             <span className="text-3xl font-medium text-gray-500">Standard Chartered</span>
                         </div>
                         <div className="col-span-1 flex justify-center">
                             <span className="text-3xl font-medium text-gray-500">Ecobank</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                             <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Accès sans précédent aux marchés</h2>
                            <p className="mt-4 text-lg text-gray-400">Accédez aux données simulées des bourses BRVM, JSE, NYSE, et plus encore. Prenez le pouls des marchés mondiaux et africains depuis une seule plateforme.</p>
                            <ul className="mt-6 space-y-2 text-gray-300">
                                <li className="flex items-center"><ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />Trading sans risque avec 100 000 $ virtuels.</li>
                                <li className="flex items-center"><ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />Données de marché réalistes alimentées par l'IA.</li>
                            </ul>
                        </div>
                        <div className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <img src="https://i.imgur.com/Z4qA4fV.png" alt="Marchés" className="rounded-md" />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                         <div className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg md:order-2">
                            <img src="https://i.imgur.com/tY7GqWc.png" alt="Analyse IA" className="rounded-md" />
                        </div>
                        <div className="md:order-1">
                             <h2 className="text-3xl font-extrabold text-white sm:text-4xl">L'analyse financière, réinventée par l'IA</h2>
                            <p className="mt-4 text-lg text-gray-400">Obtenez des analyses financières, des projections et des recommandations pour n'importe quelle action. Comparez des concurrents et découvrez des opportunités cachées.</p>
                            <ul className="mt-6 space-y-2 text-gray-300">
                                <li className="flex items-center"><ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />Rapports complets générés en secondes.</li>
                                <li className="flex items-center"><ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />Mentor IA pour des stratégies d'investissement sur mesure.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Section */}
            <div className="py-24 sm:py-32">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                            Conçu pour votre succès et votre sécurité
                        </h2>
                        <p className="mt-4 text-lg text-gray-400">
                           Votre salle de sport financière, construite sur des fondations solides.
                        </p>
                    </div>
                     <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TrustCard icon={<ShieldCheckIcon className="h-6 w-6"/>} title="Sécurité de niveau bancaire">
                            Nous utilisons un cryptage de pointe et les meilleures pratiques de sécurité pour protéger vos informations.
                        </TrustCard>
                        <TrustCard icon={<GlobeAltIcon className="h-6 w-6"/>} title="Données réalistes et éthiques">
                           Notre IA est entraînée pour fournir des simulations de données crédibles, vous préparant aux conditions réelles du marché.
                        </TrustCard>
                         <TrustCard icon={<BookOpenIcon className="h-6 w-6"/>} title="Une mission éducative">
                            Notre but est de démocratiser l'accès à l'éducation financière et d'identifier les futurs leaders de la finance.
                        </TrustCard>
                     </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="text-center py-24 bg-gray-900/50">
                 <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                    Prêt à commencer votre carrière ?
                </h2>
                <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                    Les meilleurs talents de notre plateforme sont repérés par les plus grandes institutions financières.
                </p>
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => onNavigate('signup')}
                        className="w-full max-w-xs flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105"
                    >
                        Rejoindre l'élite
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingView;
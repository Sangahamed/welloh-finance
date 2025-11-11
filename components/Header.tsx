
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Bars3Icon, XMarkIcon } from './icons/Icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const commonNavItems = [
      { id: 'simulation', label: 'Dashboard' },
      { id: 'analysis', label: 'Analyse' },
      { id: 'strategy', label: 'Mentor IA' },
      { id: 'education', label: 'Apprendre' },
      { id: 'leaderboard', label: 'Classement' },
      { id: 'tenders', label: 'Appels d\'Offres' },
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Admin Dashboard' }
  ];

  const navItems = currentUser?.role === 'admin' ? [...commonNavItems, ...adminNavItems] : commonNavItems;

  const NavLinks: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
      if (!currentUser) return null;
      return (
          <>
              {navItems.map(item => (
                  <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => { e.preventDefault(); handleNavigation(item.id); }}
                      className={isMobile ?
                          `block px-3 py-2 rounded-md text-base font-medium ${
                              currentPage === item.id 
                              ? 'bg-indigo-900/50 text-indigo-300' 
                              : 'text-gray-300 hover:bg-gray-700'
                          }` :
                          `font-medium transition-colors ${
                              currentPage === item.id 
                              ? 'text-indigo-400' 
                              : 'text-gray-300 hover:text-white'
                          }`
                      }
                  >
                      {item.label}
                  </a>
              ))}
          </>
      );
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-500/30 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="#landing" onClick={(e) => { e.preventDefault(); handleNavigation(currentUser ? 'simulation' : 'landing'); }} className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-auto text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z" />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-100">Welloh</span>
            </a>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <NavLinks />
            </nav>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-4 ml-4">
              {currentUser ? (
                <>
                  <a
                    href={`#profile/${currentUser.id}`}
                    onClick={(e) => { e.preventDefault(); onNavigate(`profile/${currentUser.id}`); }}
                    className="text-sm font-medium text-gray-300 hover:text-white"
                  >
                    Mon Profil
                  </a>
                  <button onClick={logout} className="text-sm font-medium text-gray-300 hover:text-white">Déconnexion</button>
                </>
              ) : (
                <>
                  <a href="#login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="text-sm font-medium text-gray-300 hover:text-white">Connexion</a>
                  <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">S'inscrire</a>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center ml-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-300 hover:bg-gray-700"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Ouvrir le menu principal</span>
                {isMobileMenuOpen ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks isMobile />
            <div className="border-t border-gray-700 mt-3 pt-3">
              {currentUser ? (
                <>
                  <a href={`#profile/${currentUser.id}`} onClick={(e) => { e.preventDefault(); handleNavigation(`profile/${currentUser.id}`); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700">Mon Profil</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); logout(); setIsMobileMenuOpen(false); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700">Déconnexion</a>
                </>
              ) : (
                <>
                  <a href="#login" onClick={(e) => { e.preventDefault(); handleNavigation('login'); }} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700">Connexion</a>
                  <a href="#signup" onClick={(e) => { e.preventDefault(); handleNavigation('signup'); }} className="mt-1 block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">S'inscrire</a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

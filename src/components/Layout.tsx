import React, { useState } from 'react';
import { Menu, X, Mail, Phone, MapPin, UserCheck, ShieldCheck, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { TEACHER_IMAGE_URL, TEACHER_PROFILE_URL, TEACHER_FALLBACK_URL } from '../constants';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const admins = ["aaron.rojaas.cardenas@gmail.com", "silviaisabelgom@gmail.com"];
      setIsAdmin(user?.email ? admins.includes(user.email) : false);
    });
    return () => unsubscribe();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleNavigate('home')}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20">
              <img 
                src={TEACHER_IMAGE_URL} 
                alt="Maestra Silvia"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = TEACHER_FALLBACK_URL;
                }}
              />
            </div>
            <span className="text-2xl font-bold text-on-surface font-headline tracking-tight">Silvia, Maestra Particular</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => onNavigate('home')}
              className={cn(
                "font-semibold px-3 py-2 rounded-lg transition-colors",
                currentPage === 'home' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              Inicio
            </button>
            <button 
              onClick={() => onNavigate('calendar')}
              className={cn(
                "font-semibold px-3 py-2 rounded-lg transition-colors",
                currentPage === 'calendar' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              Calendario
            </button>
            {isAdmin && (
              <button 
                onClick={() => onNavigate('admin')}
                className={cn(
                  "font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
                  currentPage === 'admin' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                Panel Admin
              </button>
            )}
            {currentUser && (
              <button 
                onClick={() => logout()}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => onNavigate('request')}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Solicitar Tutoría
            </button>
          </div>

          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-surface border-t border-outline-variant/10 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                <button 
                  onClick={() => handleNavigate('home')}
                  className={cn(
                    "text-left font-semibold px-4 py-3 rounded-xl transition-colors",
                    currentPage === 'home' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  Inicio
                </button>
                <button 
                  onClick={() => handleNavigate('calendar')}
                  className={cn(
                    "text-left font-semibold px-4 py-3 rounded-xl transition-colors",
                    currentPage === 'calendar' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  Calendario
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleNavigate('admin')}
                    className={cn(
                      "text-left font-semibold px-4 py-3 rounded-xl transition-colors flex items-center gap-2",
                      currentPage === 'admin' ? "text-primary bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Panel Admin
                  </button>
                )}
                <button 
                  onClick={() => handleNavigate('request')}
                  className="mt-2 bg-primary text-on-primary px-4 py-3.5 rounded-xl font-bold text-center shadow-lg shadow-primary/20"
                >
                  Solicitar Tutoría
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant/20 py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-lg font-bold text-on-surface font-headline">Silvia, Maestra Particular</span>
            <p className="text-on-surface-variant text-sm max-w-xs leading-relaxed">
              © 2024 Silvia, Maestra Particular. Fomentando el aprendizaje intencional a través de una mentoría educativa de calidad.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <button onClick={() => onNavigate('home')} className="text-on-surface-variant text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4">Metodología</button>
            <button onClick={() => onNavigate('home')} className="text-on-surface-variant text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4">Perfil Docente</button>
            <button onClick={() => onNavigate('calendar')} className="text-on-surface-variant text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4">Calendario</button>
            <button className="text-on-surface-variant text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4">Contáctanos</button>
            {!currentUser && (
              <button 
                onClick={() => signInWithGoogle()}
                className="text-on-surface-variant/40 text-xs hover:text-primary transition-colors flex items-center gap-1 mt-1"
              >
                <LogIn className="w-3 h-3" /> Acceso Maestra
              </button>
            )}
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-4">
              <a 
                href="mailto:aaron.rojaas.cardenas@gmail.com" 
                className="p-2 rounded-full bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a 
                href="https://wa.me/5491123507300" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all"
                title="WhatsApp"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a 
                href="https://maps.app.goo.gl/z6cMYPdp5Pf1KwDY9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all"
                title="Ubicación"
              >
                <MapPin className="w-5 h-5" />
              </a>
            </div>
            <p className="text-on-surface-variant text-xs">© 2024 Silvia, Maestra Particular. Fomentando el aprendizaje intencional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

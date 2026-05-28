import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sun, Moon, CheckCircle, BookOpen, Lock, LogOut, Loader2, Save } from 'lucide-react';
import { TEACHER_IMAGE_URL, TEACHER_PROFILE_URL, TEACHER_FALLBACK_URL } from '../constants';
import { db, auth, signInWithGoogle, logout, updateAvailability, listenToAvailability } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface CalendarProps {
  onNavigate: (page: string) => void;
}

type DayStatus = 'available' | 'full' | 'partial-am' | 'partial-pm' | 'closed' | 'not-available' | 'reading-workshop';

export default function CalendarPage({ onNavigate }: CalendarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [availability, setAvailability] = useState<Record<string, DayStatus>>({});
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dynamic date state
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Starts in April 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(currentDate);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentMonthPath = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Adjust to start Monday (0: Mon, 1: Tue, ..., 6: Sun)
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Previous month padding
  const prevMonthDate = new Date(year, month, 0);
  const prevMonthDaysCount = prevMonthDate.getDate();
  const prevMonthPadding = Array.from({ length: startingDayIndex }, (_, i) => prevMonthDaysCount - startingDayIndex + i + 1);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const admins = ["aaron.rojaas.cardenas@gmail.com", "silviaisabelgom@gmail.com"];
      setIsAdmin(u?.email ? admins.includes(u.email) : false);
    });

    const unsubscribeAvailability = listenToAvailability((data) => {
      setAvailability(data);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeAvailability();
    };
  }, []);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      // Limit to 2026
      if (next.getFullYear() !== 2026) return prev;
      return next;
    });
  };

  const handleDayClick = async (day: number) => {
    if (!isAdmin) return;

    const dateKey = `${currentMonthPath}-${day.toString().padStart(2, '0')}`;
    const currentStatus = availability[dateKey] || 'available';
    
    // Cycle through states
    const statusCycle: DayStatus[] = ['available', 'partial-am', 'partial-pm', 'full', 'reading-workshop', 'closed'];
    const nextIndex = (statusCycle.indexOf(currentStatus as any) + 1) % statusCycle.length;
    const nextStatus = statusCycle[nextIndex];

    setIsSyncing(true);
    try {
      await updateAvailability(dateKey, nextStatus as any);
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Error al actualizar la disponibilidad. Verifica tus permisos.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getDayDetails = (day: number) => {
    const dateKey = `${currentMonthPath}-${day.toString().padStart(2, '0')}`;
    const status = availability[dateKey] || 'available';
    
    let label = '';
    if (status === 'closed') label = 'Cerrado';
    if (status === 'full') label = 'Completo';
    if (status === 'partial-am') label = 'Solo AM';
    if (status === 'partial-pm') label = 'Solo PM';
    if (status === 'reading-workshop') label = 'Taller Lectura';
    
    return { status, label };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16"
    >
      {/* Admin Floating Controls */}
      <AnimatePresence>
        {user && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest border border-outline-variant/20 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt="Admin" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              <span className="text-sm font-bold">{isAdmin ? 'Modo Administrador' : 'Sesión Activa'}</span>
            </div>
            <div className="h-4 w-px bg-outline-variant"></div>
            <button onClick={logout} className="p-2 hover:bg-surface-container rounded-full text-primary" title="Cerrar Sesión">
              <LogOut className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="max-w-3xl relative">
        {!user && (
          <button 
            onClick={signInWithGoogle}
            className="absolute top-0 right-0 p-3 bg-surface-container hover:bg-surface-container-high rounded-full text-on-surface-variant transition-all hover:scale-110 shadow-sm"
            title="Acceso Admin"
          >
            <Lock className="w-5 h-5 opacity-40" />
          </button>
        )}
        <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-4 block">Calendario Académico 2026</span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface tracking-tight leading-tight mb-6">
          Planifica tu <span className="text-primary-dim italic">Viaje de Aprendizaje</span>
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed mb-8">
          Explora la disponibilidad para el próximo año académico. Ofrecemos sesiones personalizadas enfocadas en el crecimiento intencional y la comprensión conceptual profunda.
        </p>
        <div className="flex flex-wrap gap-3 md:gap-4 items-center p-4 md:p-6 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 md:w-4 h-3 md:h-4 rounded-sm bg-secondary"></div>
            <span className="text-xs md:text-sm font-medium">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 md:w-4 h-3 md:h-4 rounded-sm bg-tertiary-container flex items-center justify-center">
              <Sun className="w-2 h-2 text-on-tertiary-container" />
            </div>
            <span className="text-xs md:text-sm font-medium">Solo AM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 md:w-4 h-3 md:h-4 rounded-sm bg-tertiary-container flex items-center justify-center">
              <Moon className="w-2 h-2 text-on-tertiary-container" />
            </div>
            <span className="text-xs md:text-sm font-medium">Solo PM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 md:w-4 h-3 md:h-4 rounded-sm bg-surface-container-highest"></div>
            <span className="text-xs md:text-sm font-medium">No Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 md:w-4 h-3 md:h-4 rounded-sm border-2 border-primary bg-primary/10"></div>
            <span className="text-xs md:text-sm font-medium">Taller Lectura</span>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Calendar */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-4 md:p-8 border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-surface-container transition-colors rounded-full text-primary disabled:opacity-20"
                disabled={month === 0}
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <h2 className="text-xl md:text-3xl font-bold min-w-[140px] md:min-w-[200px] text-center">{capitalizedMonth} 2026</h2>
              <button 
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-surface-container transition-colors rounded-full text-primary disabled:opacity-20"
                disabled={month === 11}
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <div className="hidden sm:flex gap-2">
              <span className="px-4 py-1.5 bg-surface-container-low rounded-full text-sm font-medium">Enfoque Personalizado</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-4 mb-4">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
              <div key={day} className="text-center text-on-surface-variant font-bold text-[10px] md:text-xs uppercase tracking-widest pb-2 md:pb-4">{day}</div>
            ))}
            
            {prevMonthPadding.map(d => (
              <div key={`prev-${d}`} className="aspect-square flex items-center justify-center text-on-surface-variant/20 text-xs md:text-base">{d}</div>
            ))}

            {days.map(d => {
              const { status, label } = getDayDetails(d);
              const isInteractable = isAdmin;

              return (
                <button 
                  key={d} 
                  onClick={() => handleDayClick(d)}
                  disabled={isSyncing}
                  className={`aspect-square rounded-lg md:rounded-xl transition-all flex flex-col items-center justify-center group relative overflow-hidden
                    ${status === 'available' ? 'bg-secondary text-on-primary hover:ring-4 ring-secondary/20' : ''}
                    ${status === 'closed' ? 'bg-surface-container-high text-on-surface-variant' : ''}
                    ${status === 'full' ? 'bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant/30 opacity-70' : ''}
                    ${status === 'partial-am' ? 'bg-amber-100 text-amber-900 border-2 border-amber-200' : ''}
                    ${status === 'partial-pm' ? 'bg-indigo-100 text-indigo-900 border-2 border-indigo-200' : ''}
                    ${status === 'not-available' ? 'bg-surface-container-low text-on-surface-variant/40' : ''}
                    ${status === 'reading-workshop' ? 'bg-primary/10 text-primary border-2 border-primary' : ''}
                    ${isInteractable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}
                  `}
                >
                  <div className="absolute top-1 left-1">
                    {status === 'partial-am' && <Sun className="w-3 h-3 text-amber-600" />}
                    {status === 'partial-pm' && <Moon className="w-3 h-3 text-indigo-600" />}
                  </div>
                  <span className="font-bold text-xs md:text-lg">{d}</span>
                  {label && (
                    <span className="text-[8px] md:text-[10px] font-bold leading-none text-center px-0.5 mt-0.5 uppercase hidden xs:block">
                      {status === 'reading-workshop' ? '📖' : status.includes('partial') ? (status === 'partial-am' ? 'Mañana' : 'Tarde') : label.replace('Solo ', '')}
                    </span>
                  )}
                  {status === 'reading-workshop' && <div className="absolute top-0.5 right-0.5 w-1 h-1 md:w-2 md:h-2 bg-primary rounded-full xs:hidden" />}
                  
                  {isSyncing && isInteractable && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin opacity-40" />
                    </div>
                  )}

                  {isInteractable && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Save className="w-3 h-3 opacity-30" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl p-8 flex-1">
            <h3 className="text-xl font-bold mb-6 italic">Sesiones y Talleres</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg text-primary shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">📚 Taller de Lectura</p>
                  <p className="text-sm text-on-surface-variant">2 veces por semana</p>
                  <p className="text-xs mt-1 text-primary font-bold">A cargo de la maestra Silvia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg text-primary shadow-sm">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Descubrimiento Matutino</p>
                  <p className="text-sm text-on-surface-variant">08:00 AM - 12:00 PM</p>
                  <p className="text-xs mt-1 text-secondary font-medium">Ideal para materias principales</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg text-primary shadow-sm">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Indagación Vespertina</p>
                  <p className="text-sm text-on-surface-variant">02:00 PM - 06:00 PM</p>
                  <p className="text-xs mt-1 text-secondary font-medium">Aprendizaje basado en proyectos</p>
                </div>
              </div>
            </div>
            <hr className="my-8 border-outline-variant/20" />
            <div className="p-4 bg-white/50 backdrop-blur rounded-xl border border-white/40">
              <p className="text-sm italic text-on-surface-variant">"Nuestra filosofía de tutoría cierra la brecha entre el currículo y la curiosidad."</p>
              <p className="text-xs mt-4 text-primary font-bold">📍 Clases presenciales en Buenos Aires</p>
            </div>
          </div>

          <div className="bg-primary p-8 rounded-xl text-on-primary overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">¿Encontraste una fecha?</h3>
              <p className="mb-8 opacity-90 leading-relaxed">Asegura tu horario preferido enviando una solicitud formal hoy mismo.</p>
              <button 
                onClick={() => onNavigate('request')}
                className="inline-block w-full text-center bg-white text-primary font-bold py-4 rounded-full hover:scale-[1.02] transition-transform active:scale-100"
              >
                Solicitud de Clases
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        </div>
      </div>

      {/* Year at a Glance */}
      <section>
        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          El Año de un Vistazo
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { month: 'Febrero', avail: '85% de Disponibilidad', color: 'bg-secondary' },
            { month: 'Marzo', avail: 'Alta Demanda', color: 'bg-tertiary-container' },
            { month: 'Abril', avail: 'Periodo de Vacaciones', color: 'bg-secondary' },
            { month: 'Mayo', avail: 'Cupos Limitados', color: 'bg-surface-container-high' },
            { month: 'Junio', avail: 'Inscripciones Abiertas', color: 'bg-secondary' },
            { month: 'Julio', avail: 'Receso de Verano', color: 'bg-surface-container-high' },
          ].map((m, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 hover:border-primary/30 transition-colors">
              <p className="font-bold mb-2">{m.month}</p>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-1 flex-1 ${m.color} rounded-full`}></div>
                <div className={`h-1 flex-1 ${m.color} rounded-full`}></div>
                <div className="h-1 flex-1 bg-surface-container-high rounded-full"></div>
              </div>
              <p className="text-[10px] text-on-surface-variant font-medium">{m.avail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology Section */}
      <section className="bg-surface-container-low rounded-xl p-12 relative overflow-hidden">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 tracking-tight">Nuestra Metodología de Programación</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Creemos en los "Ritmos Intelectuales". Nuestro calendario está diseñado para proporcionar consistencia al estudiante mientras permite las inmersiones profundas requeridas en la excelencia académica moderna. 
            </p>
            <ul className="space-y-4">
              {['Respuesta prioritaria en 24h para estudiantes activos', 'Reprogramación flexible con 48h de aviso', 'Descuentos por reserva de semestre completo'].map((item, i) => (
                <li key={i} className="flex gap-3 items-center">
                  <CheckCircle className="w-5 h-5 text-secondary fill-secondary" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden aspect-video shadow-xl border-4 border-white">
            <img 
              src={TEACHER_PROFILE_URL} 
              alt="Maestra Silvia" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = TEACHER_IMAGE_URL;
              }}
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}

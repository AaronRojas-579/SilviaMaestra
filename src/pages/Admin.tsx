import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  UserCheck,
  DollarSign,
  FileText
} from 'lucide-react';
import { auth, db, listenToStudents, addStudent, updateStudent, deleteStudent, listenToSessions, addSession, deleteSession, updateAvailability } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { cn } from '@/src/lib/utils';

const ADMINS = ["aaron.rojaas.cardenas@gmail.com", "silviaisabelgom@gmail.com"];

const TIME_SLOTS = [
  '08:00 - 09:00 (Mañana)',
  '09:00 - 10:00 (Mañana)',
  '10:00 - 11:00 (Mañana)',
  '11:00 - 12:00 (Mañana)',
  '13:00 - 14:00 (Tarde)',
  '14:00 - 15:00 (Tarde)',
  '15:00 - 16:00 (Tarde)',
  '16:00 - 17:00 (Tarde)',
  'Taller de Lectura (17:00 - 18:30)'
];

export default function AdminDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'students'>('schedule');
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [isBatchScheduling, setIsBatchScheduling] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
    show: boolean;
    student: any | null;
    month: number;
    year: number;
  }>({
    show: false,
    student: null,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [isGeneratingBudgetPDF, setIsGeneratingBudgetPDF] = useState(false);
  const [budgetConfig, setBudgetConfig] = useState<{
    show: boolean;
    student: any | null;
    type: 'weekly' | 'monthly';
    month: number;
    year: number;
    selectedWeekIndex: number;
    pricePerHour: number;
  }>({
    show: false,
    student: null,
    type: 'monthly',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selectedWeekIndex: 0,
    pricePerHour: 12000,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  // Custom Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'primary';
    isLoading?: boolean;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary',
    isLoading: false
  });

  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Student Form State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentForm, setStudentForm] = useState({
    studentName: '',
    parentName: '',
    contactPhone: '',
    grade: '',
    frequency: '1x por semana',
    preferredDays: [] as string[],
    preferredTime: '08:00 - 09:00 (Mañana)',
    comments: ''
  });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [selectedStudentForSession, setSelectedStudentForSession] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:00 - 09:00 (Mañana)');
  const [sessionNotes, setSessionNotes] = useState('');

  const [shouldRepeatWeekly, setShouldRepeatWeekly] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || !ADMINS.includes(user.email || '')) {
        onNavigate('home');
      } else {
        setIsAdmin(true);
      }
    });

    const unsubscribeStudents = listenToStudents(setStudents);
    const unsubscribeSessions = listenToSessions((data) => {
      setSessions(data);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeStudents();
      unsubscribeSessions();
    };
  }, [onNavigate]);

  const handleFirestoreError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    setNotification({
      show: true,
      title: 'Error de Base de Datos',
      message: message.includes('permission-denied') 
        ? 'No tienes permisos suficientes para esta acción.' 
        : 'Hubo un problema al procesar la solicitud.',
      type: 'error'
    });
    
    // Auto-hide notification
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStudent(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, studentForm);
        setNotification({
          show: true,
          title: 'Alumno Actualizado',
          message: `${studentForm.studentName} ha sido actualizado correctamente.`,
          type: 'success'
        });
      } else {
        await addStudent(studentForm);
        setNotification({
          show: true,
          title: 'Alumno Registrado',
          message: `${studentForm.studentName} ha sido registrado correctamente.`,
          type: 'success'
        });
      }
      setIsAddingStudent(false);
      setEditingStudent(null);
      setStudentForm({
        studentName: '',
        parentName: '',
        contactPhone: '',
        grade: '',
        frequency: '1x por semana',
        preferredDays: [],
        preferredTime: '08:00 - 09:00 (Mañana)',
        comments: ''
      });
      // Auto-hide success message
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    } catch (error) {
      handleFirestoreError(error, editingStudent ? 'updateStudent' : 'addStudent');
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const startEditStudent = (student: any) => {
    setEditingStudent(student);
    setStudentForm({ 
      ...student,
      preferredTime: student.preferredTime || '08:00 - 09:00 (Mañana)'
    });
    setIsAddingStudent(true);
  };

  const handleAddSession = async () => {
    if (!selectedDate || !selectedStudentForSession) return;

    // Check for single duplicate early
    if (!shouldRepeatWeekly) {
      const isDuplicate = sessions.some(s => 
        s.studentId === selectedStudentForSession && 
        s.date === selectedDate && 
        s.timeSlot === selectedTimeSlot
      );

      if (isDuplicate) {
        setNotification({
          show: true,
          title: 'Sesión Duplicada',
          message: 'Este alumno ya tiene una sesión agendada para este día y horario.',
          type: 'error'
        });
        return;
      }
    }

    setIsSubmittingSession(true);
    try {
      const student = students.find(s => s.id === selectedStudentForSession);
      const baseSession = {
        studentId: selectedStudentForSession,
        studentName: student?.studentName || 'Estudiante',
        timeSlot: selectedTimeSlot,
        notes: sessionNotes
      };

      if (shouldRepeatWeekly) {
        const dates = [];
        const [year, month, day] = selectedDate.split('-').map(Number);
        
        // Create 4 sessions (today + 3 weeks)
        for (let i = 0; i < 4; i++) {
          const d = new Date(year, month - 1, day + (i * 7));
          dates.push(formatDate(d));
        }

        let addedCount = 0;
        for (const date of dates) {
          const isDateDuplicate = sessions.some(s => 
            s.studentId === selectedStudentForSession && 
            s.date === date && 
            s.timeSlot === selectedTimeSlot
          );

          if (!isDateDuplicate) {
            await addSession({ ...baseSession, date });
            addedCount++;
          }
        }

        if (addedCount === 0) {
          setNotification({
            show: true,
            title: 'Sin Cambios',
            message: 'Todas las sesiones semanales ya estaban programadas para este horario.',
            type: 'info'
          });
          setIsAddingSession(false);
          setIsSubmittingSession(false);
          return;
        }
      } else {
        await addSession({ ...baseSession, date: selectedDate });
      }

      setIsAddingSession(false);
      setSessionNotes('');
      setShouldRepeatWeekly(false);
      setNotification({
        show: true,
        title: shouldRepeatWeekly ? 'Sesiones Agendadas' : 'Sesión Agendada',
        message: shouldRepeatWeekly 
          ? 'Se han programado 4 sesiones semanales.' 
          : 'La sesión se ha guardado en el calendario.',
        type: 'success'
      });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    } catch (error) {
      handleFirestoreError(error, 'addSession');
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setConfirmDialog({
      show: true,
      title: 'Eliminar Sesión',
      message: '¿Estás seguro de eliminar esta sesión? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await deleteSession(id);
          setConfirmDialog(prev => ({ ...prev, show: false, isLoading: false }));
          setNotification({
            show: true,
            title: 'Sesión Eliminada',
            message: 'La sesión ha sido eliminada.',
            type: 'info'
          });
          setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
        } catch (error) {
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          handleFirestoreError(error, 'deleteSession');
        }
      }
    });
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getSessionsForDate = (dateStr: string) => {
    return sessions
      .filter(s => s.date === dateStr)
      .sort((a, b) => {
        const timeA = a.timeSlot.match(/(\d{2}:\d{2})/)?.[0] || "";
        const timeB = b.timeSlot.match(/(\d{2}:\d{2})/)?.[0] || "";
        return timeA.localeCompare(timeB);
      });
  };

  const handleBatchSchedule = async (student: any) => {
    setConfirmDialog({
      show: true,
      title: 'Agendado Automático',
      message: `¿Deseas agendar a ${student.studentName} para todos sus días (${student.preferredDays.join(', ')}) de este mes?`,
      type: 'primary',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        setIsBatchScheduling(student.id);
        try {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const monthSessions = [];

          const dayMapping: Record<string, number> = {
            'Dom': 0, 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6
          };

          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
            const dayOfWeek = date.getDay();
            const isPreferred = student.preferredDays.some((pref: string) => dayMapping[pref] === dayOfWeek);

            if (isPreferred) {
              const dateStr = formatDate(date);
              const targetTime = student.preferredTime || '08:00 - 09:00 (Mañana)';
              const alreadyHas = sessions.find(s => 
                s.studentId === student.id && 
                s.date === dateStr && 
                s.timeSlot === targetTime
              );
              if (!alreadyHas) {
                monthSessions.push({
                  studentId: student.id,
                  studentName: student.studentName,
                  date: dateStr,
                  timeSlot: targetTime,
                  notes: 'Agendado automáticamente'
                });
              }
            }
          }

          if (monthSessions.length === 0) {
            setNotification({
              show: true,
              title: 'Información',
              message: 'No se encontraron días nuevos para agendar.',
              type: 'info'
            });
            return;
          }

          for (const session of monthSessions) {
            await addSession(session);
          }
          
          setNotification({
            show: true,
            title: 'Éxito',
            message: `Se agendaron ${monthSessions.length} clases para ${student.studentName}.`,
            type: 'success'
          });
        } catch (error) {
          console.error("Error batch scheduling:", error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false, show: false }));
          setNotification({
            show: true,
            title: 'Error',
            message: 'Hubo un problema al agendar en lote.',
            type: 'error'
          });
        } finally {
          setIsBatchScheduling(null);
          setConfirmDialog(prev => ({ ...prev, isLoading: false, show: false }));
        }
      }
    });
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.student) return;
    
    setIsGeneratingPDF(true);
    // Give time for UI to update if needed
    await new Promise(resolve => setTimeout(resolve, 800));

    const element = document.getElementById('pdf-report-template');
    if (!element) {
      console.error("Template element not found");
      setIsGeneratingPDF(false);
      return;
    }

    const replaceUnsupportedColors = (cssText: string) => {
      let result = '';
      let i = 0;
      const lower = cssText.toLowerCase();
      while (i < cssText.length) {
        if (lower.startsWith('oklch(', i) || lower.startsWith('oklab(', i)) {
          i += 6;
          let parenCount = 1;
          while (i < cssText.length && parenCount > 0) {
            if (cssText[i] === '(') {
              parenCount++;
            } else if (cssText[i] === ')') {
              parenCount--;
            }
            i++;
          }
          result += 'rgb(79, 70, 229)';
        } else {
          result += cssText[i];
          i++;
        }
      }
      return result;
    };

    // Process both <style> and <link rel="stylesheet"> tags
    const styleElements = Array.from(document.querySelectorAll('style'));
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

    const originalStyleContents = styleElements.map(style => style.textContent || '');
    const tempStyleElements: HTMLStyleElement[] = [];

    // 1. Process style tags
    styleElements.forEach(style => {
      if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
        style.textContent = replaceUnsupportedColors(style.textContent);
      }
    });

    // 2. Process link tags
    await Promise.all(
      linkElements.map(async link => {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              const tempStyle = document.createElement('style');
              tempStyle.textContent = replaceUnsupportedColors(cssText);
              document.head.appendChild(tempStyle);
              tempStyleElements.push(tempStyle);
              link.disabled = true;
            }
          }
        } catch (err) {
          console.warn('Could not process external stylesheet:', link.href, err);
        }
      })
    );

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const val = target.getPropertyValue(propertyName);
              return typeof val === 'string' ? replaceUnsupportedColors(val) : val;
            };
          }
          const value = (target as any)[prop];
          if (typeof value === 'string') {
            return replaceUnsupportedColors(value);
          }
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    };

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Calendario_${reportConfig.student.studentName}_${reportConfig.month + 1}_${reportConfig.year}.pdf`);
      
      setReportConfig(prev => ({ ...prev, show: false }));
    } catch (error) {
      console.error("Error generating PDF:", error);
      setNotification({
        show: true,
        title: 'Error de PDF',
        message: 'No se pudo generar el archivo. Por favor reintente.',
        type: 'error'
      });
    } finally {
      // Revert style content changes
      styleElements.forEach((style, idx) => {
        style.textContent = originalStyleContents[idx];
      });
      linkElements.forEach(link => {
        link.disabled = false;
      });
      tempStyleElements.forEach(tempStyle => {
        tempStyle.remove();
      });
      window.getComputedStyle = originalGetComputedStyle;
      setIsGeneratingPDF(false);
    }
  };

  const getWeeksOfMonth = (year: number, month: number) => {
    const weeks: { start: string; end: string; label: string }[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const current = new Date(firstDay);
    const currentDay = current.getDay();
    const adjust = currentDay === 0 ? -6 : 1 - currentDay;
    current.setDate(current.getDate() + adjust);
    
    while (current <= lastDay || current.getMonth() === month) {
      const monday = new Date(current);
      const sunday = new Date(current);
      sunday.setDate(sunday.getDate() + 6);
      
      weeks.push({
        start: formatDate(monday),
        end: formatDate(sunday),
        label: `Del ${monday.getDate()}/${monday.getMonth() + 1} al ${sunday.getDate()}/${sunday.getMonth() + 1}`
      });
      
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  const getSessionsForBudget = (studentId: string | undefined, type: 'weekly' | 'monthly', year: number, month: number, weekIndex: number) => {
    if (!studentId) return [];
    if (type === 'monthly') {
      return sessions.filter(s => {
        if (s.studentId !== studentId) return false;
        const [sYear, sMonth] = s.date.split('-').map(Number);
        return sYear === year && (sMonth - 1) === month;
      }).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const weeks = getWeeksOfMonth(year, month);
      const week = weeks[weekIndex];
      if (!week) return [];
      return sessions.filter(s => {
        if (s.studentId !== studentId) return false;
        return s.date >= week.start && s.date <= week.end;
      }).sort((a, b) => a.date.localeCompare(b.date));
    }
  };

  const getSpanishWeekdayAndDate = (dateStr: string) => {
    const dateStrWithTime = dateStr + 'T12:00:00';
    const dateObj = new Date(dateStrWithTime);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} de ${monthName}`;
  };

  const handleGenerateBudgetPDF = async () => {
    if (!budgetConfig.student) return;
    
    setIsGeneratingBudgetPDF(true);
    // Give time for UI to update if needed
    await new Promise(resolve => setTimeout(resolve, 800));

    const element = document.getElementById('pdf-budget-template');
    if (!element) {
      console.error("Budget template element not found");
      setIsGeneratingBudgetPDF(false);
      return;
    }

    const replaceUnsupportedColors = (cssText: string) => {
      let result = '';
      let i = 0;
      const lower = cssText.toLowerCase();
      while (i < cssText.length) {
        if (lower.startsWith('oklch(', i) || lower.startsWith('oklab(', i)) {
          i += 6;
          let parenCount = 1;
          while (i < cssText.length && parenCount > 0) {
            if (cssText[i] === '(') {
              parenCount++;
            } else if (cssText[i] === ')') {
              parenCount--;
            }
            i++;
          }
          result += 'rgb(79, 70, 229)';
        } else {
          result += cssText[i];
          i++;
        }
      }
      return result;
    };

    // Process both <style> and <link rel="stylesheet"> tags
    const styleElements = Array.from(document.querySelectorAll('style'));
    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

    const originalStyleContents = styleElements.map(style => style.textContent || '');
    const tempStyleElements: HTMLStyleElement[] = [];

    // 1. Process style tags
    styleElements.forEach(style => {
      if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
        style.textContent = replaceUnsupportedColors(style.textContent);
      }
    });

    // 2. Process link tags
    await Promise.all(
      linkElements.map(async link => {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.includes('oklch') || cssText.includes('oklab')) {
              const tempStyle = document.createElement('style');
              tempStyle.textContent = replaceUnsupportedColors(cssText);
              document.head.appendChild(tempStyle);
              tempStyleElements.push(tempStyle);
              link.disabled = true;
            }
          }
        } catch (err) {
          console.warn('Could not process external stylesheet:', link.href, err);
        }
      })
    );

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const val = target.getPropertyValue(propertyName);
              return typeof val === 'string' ? replaceUnsupportedColors(val) : val;
            };
          }
          const value = (target as any)[prop];
          if (typeof value === 'string') {
            return replaceUnsupportedColors(value);
          }
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    };

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      const filename = `Presupuesto_${budgetConfig.type === 'weekly' ? 'Semanal' : 'Mensual'}_${budgetConfig.student.studentName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);
      
      setBudgetConfig(prev => ({ ...prev, show: false }));
      setNotification({
        show: true,
        title: 'Presupuesto Generado',
        message: 'El presupuesto PDF se ha descargado correctamente.',
        type: 'success'
      });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
    } catch (error) {
      console.error("Error generating Budget PDF:", error);
      setNotification({
        show: true,
        title: 'Error de PDF',
        message: 'No se pudo generar el presupuesto. Por favor reintente.',
        type: 'error'
      });
    } finally {
      // Revert style content changes
      styleElements.forEach((style, idx) => {
        style.textContent = originalStyleContents[idx];
      });
      linkElements.forEach(link => {
        link.disabled = false;
      });
      tempStyleElements.forEach(tempStyle => {
        tempStyle.remove();
      });
      window.getComputedStyle = originalGetComputedStyle;
      setIsGeneratingBudgetPDF(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant animate-pulse font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-20">
      {/* Header */}
      <div className="bg-surface border-b border-outline-variant/10 sticky top-[73px] z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-on-surface flex items-center gap-2 sm:gap-3">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                Panel de Gestión Académica
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Administra tus alumnos y agenda de clases.</p>
            </div>
            
            <div className="flex bg-surface-container rounded-xl p-1 shadow-inner self-stretch lg:self-center">
              <button 
                onClick={() => setActiveTab('schedule')}
                className={cn(
                  "flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base",
                  activeTab === 'schedule' ? "bg-primary text-white shadow-md" : "text-primary hover:text-primary hover:bg-primary/5"
                )}
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Agenda
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={cn(
                  "flex-1 md:flex-none px-4 sm:px-6 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base",
                  activeTab === 'students' ? "bg-primary text-white shadow-md" : "text-primary hover:text-primary hover:bg-primary/5"
                )}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Alumnos
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'students' ? (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Users className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                  Alumnos (<span className="text-primary">{students.length}</span>)
                </h2>
                <button 
                  onClick={() => {
                    setEditingStudent(null);
                    setStudentForm({
                      studentName: '',
                      parentName: '',
                      contactPhone: '',
                      grade: '',
                      frequency: '1x por semana',
                      preferredDays: [],
                      preferredTime: '08:00 - 09:00 (Mañana)',
                      comments: ''
                    });
                    setIsAddingStudent(true);
                  }}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/30 transition-all text-sm sm:text-base w-full sm:w-auto"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Alumno
                </button>
              </div>

              {/* Student Form Modal */}
              <AnimatePresence>
                {isAddingStudent && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAddingStudent(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
                    >
                      <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-primary/5">
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                          {editingStudent ? <Edit2 className="text-primary" /> : <Plus className="text-primary" />}
                          {editingStudent ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}
                        </h3>
                        <button onClick={() => setIsAddingStudent(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleStudentSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Nombre del Alumno *</label>
                            <input 
                              type="text" 
                              required
                              value={studentForm.studentName}
                              onChange={e => setStudentForm({ ...studentForm, studentName: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                              placeholder="Ej: Juan Pérez"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Grado Escolar</label>
                            <select 
                              value={studentForm.grade}
                              onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                              <option value="">Seleccionar grado</option>
                              <option value="1er grado">1er grado</option>
                              <option value="2do grado">2do grado</option>
                              <option value="3er grado">3er grado</option>
                              <option value="4to grado">4to grado</option>
                              <option value="5to grado">5to grado</option>
                              <option value="6to grado">6to grado</option>
                              <option value="7mo grado">7mo grado</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Horario de Preferencia *</label>
                            <select 
                              value={studentForm.preferredTime}
                              onChange={e => setStudentForm({ ...studentForm, preferredTime: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                              {TIME_SLOTS.map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Nombre del Tutor *</label>
                            <input 
                              type="text" 
                              required
                              value={studentForm.parentName}
                              onChange={e => setStudentForm({ ...studentForm, parentName: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                              placeholder="Ej: María García"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Teléfono de Contacto *</label>
                            <input 
                              type="tel" 
                              required
                              value={studentForm.contactPhone}
                              onChange={e => setStudentForm({ ...studentForm, contactPhone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                              placeholder="Ej: +54 9 11 ..."
                            />
                          </div>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Frecuencia de Tutoría</label>
                            <select 
                              value={studentForm.frequency}
                              onChange={e => setStudentForm({ ...studentForm, frequency: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                              <option>1x por semana</option>
                              <option>2x por semana</option>
                              <option>3x por semana</option>
                              <option>4x por semana</option>
                              <option>Diario</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-on-surface-variant ml-1">Días de Preferencia</label>
                            <div className="flex flex-wrap gap-2">
                              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                <button
                                  type="button"
                                  key={day}
                                  onClick={() => {
                                    const next = studentForm.preferredDays.includes(day)
                                      ? studentForm.preferredDays.filter(d => d !== day)
                                      : [...studentForm.preferredDays, day];
                                    setStudentForm({ ...studentForm, preferredDays: next });
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    studentForm.preferredDays.includes(day)
                                      ? "bg-primary text-on-primary shadow-sm"
                                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                                  )}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-on-surface-variant ml-1">Comentarios / Observaciones</label>
                          <textarea 
                            value={studentForm.comments}
                            onChange={e => setStudentForm({ ...studentForm, comments: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                            placeholder="Notas importantes sobre el aprendizaje, salud o necesidades especiales..."
                          />
                        </div>

                        <div className="pt-4">
                          <button 
                            type="submit"
                            disabled={isSubmittingStudent}
                            className={cn(
                              "w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                              isSubmittingStudent && "opacity-70 cursor-not-allowed"
                            )}
                          >
                            {isSubmittingStudent ? (
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                {editingStudent ? 'Actualizar Alumno' : 'Registrar Alumno'}
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map(student => (
                  <motion.div 
                    layout
                    key={student.id}
                    className="bg-surface border border-outline-variant/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-bold text-on-surface group-hover:text-primary transition-colors truncate">{student.studentName}</h4>
                        <span className="inline-block px-2 py-0.5 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider rounded-md border border-primary/10 mt-1">
                          {student.grade || 'Grado no especificado'}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => setViewingStudent(student)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          title="Ver Detalles"
                        >
                          <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => startEditStudent(student)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setConfirmDialog({
                              show: true,
                              title: 'Eliminar Alumno',
                              message: `¿Estás seguro de eliminar a ${student.studentName}? Se perderán todos sus datos y sesiones.`,
                              type: 'danger',
                              onConfirm: async () => {
                                setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                                try {
                                  // First delete all sessions associated with this student
                                  const studentSessions = sessions.filter(s => s.studentId === student.id);
                                  for (const session of studentSessions) {
                                    await deleteSession(session.id);
                                  }

                                  await deleteStudent(student.id);
                                  setConfirmDialog(prev => ({ ...prev, show: false, isLoading: false }));
                                  setNotification({
                                    show: true,
                                    title: 'Alumno Eliminado',
                                    message: `${student.studentName} ha sido eliminado.`,
                                    type: 'info'
                                  });
                                  setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
                                } catch (error) {
                                  setConfirmDialog(prev => ({ ...prev, isLoading: false }));
                                  handleFirestoreError(error, 'deleteStudent');
                                }
                              }
                            });
                          }}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-full transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 pt-4 border-t border-outline-variant/5">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs font-bold truncate">{student.parentName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <a href={`tel:${student.contactPhone}`} className="text-xs font-bold hover:text-primary transition-colors">{student.contactPhone}</a>
                      </div>

                      <div className="flex items-center gap-2 text-on-surface-variant pt-1">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-tight">{student.frequency}</span>
                      </div>
                      {student.preferredDays.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.preferredDays.map(d => (
                            <span key={d} className="px-1.5 py-0.5 bg-surface-container-high text-[8px] sm:text-[9px] font-black rounded uppercase tracking-tighter">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleBatchSchedule(student)}
                        disabled={isBatchScheduling === student.id}
                        className={cn(
                          "w-full mt-4 bg-primary text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 active:scale-95",
                          isBatchScheduling === student.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isBatchScheduling === student.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        {isBatchScheduling === student.id ? 'Agendando...' : 'Agendar clases del Mes'}
                      </button>
                      
                      <button 
                        onClick={() => setReportConfig({ 
                          show: true, 
                          student, 
                          month: currentDate.getMonth(), 
                          year: currentDate.getFullYear() 
                        })}
                        className="w-full mt-2 bg-secondary/10 text-secondary py-3 rounded-xl text-xs font-bold hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border border-secondary/20"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Generar Reporte Mensual
                      </button>
                      <button 
                        onClick={() => setBudgetConfig({ 
                          show: true, 
                          student, 
                          type: 'monthly',
                          month: currentDate.getMonth(), 
                          year: currentDate.getFullYear(),
                          selectedWeekIndex: 0,
                          pricePerHour: 12000
                        })}
                        className="w-full mt-2 bg-primary/10 text-primary py-3 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border border-primary/20"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Calcular Presupuesto
                      </button>
                    </div>
                    {student.comments && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-on-surface-variant/40 shrink-0 mt-0.5" />
                        <p className="text-xs text-on-surface-variant italic line-clamp-2">{student.comments}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
                {students.length === 0 && (
                  <div className="col-span-full py-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center p-8">
                    <Users className="w-16 h-16 text-on-surface-variant/20 mb-4" />
                    <h3 className="text-xl font-bold text-on-surface-variant">No hay alumnos registrados</h3>
                    <p className="text-on-surface-variant max-w-xs mt-2">Comienza registrando un nuevo alumno para agendar sesiones.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
                <div className="bg-surface rounded-2xl sm:rounded-3xl border border-outline-variant/10 p-4 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <CalendarIcon className="text-primary w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-black text-[#1d2e51]">
                        Calendario de Clases
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 bg-[#eef2ff] rounded-2xl p-1.5 border border-primary/10">
                      <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-primary">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="font-black px-4 text-center text-sm uppercase tracking-tight text-[#1d2e51] min-w-[140px]">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long' })} De {currentDate.getFullYear()}
                      </span>
                      <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-primary">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(day => (
                      <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#4b5b81] opacity-40 py-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square opacity-0" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                      const dateStr = formatDate(dateObj);
                      const isSelected = selectedDate === dateStr;
                      const daySessions = getSessionsForDate(dateStr);
                      const isToday = formatDate(new Date()) === dateStr;

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateStr)}
                          className={cn(
                            "aspect-square rounded-2xl border-2 transition-all relative flex flex-col items-center justify-center group",
                            isSelected 
                              ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105 z-10" 
                              : "bg-white border-transparent hover:border-primary/20 hover:shadow-md",
                            isToday && !isSelected && "ring-2 ring-primary ring-offset-2"
                          )}
                          style={{
                            boxShadow: !isSelected ? '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)' : undefined
                          }}
                        >
                          <span className={cn("font-black text-xs sm:text-xl", isSelected ? "" : "text-[#1d2e51]")}>{day}</span>
                          {daySessions.length > 0 && (
                            <div className="mt-1 flex gap-1 justify-center">
                              {daySessions.slice(0, 3).map((_, i) => (
                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Date Details */}
                {selectedDate && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface rounded-2xl sm:rounded-3xl border border-outline-variant/10 p-4 sm:p-8 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
                      <div>
                        <h3 className="text-lg sm:text-2xl font-bold">
                          Agenda para el {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-xs sm:text-base text-on-surface-variant flex items-center gap-2 mt-1">
                          {getSessionsForDate(selectedDate).length === 0 
                            ? 'No hay clases programadas.' 
                            : `${getSessionsForDate(selectedDate).length} clases asignadas.`}
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsAddingSession(true)}
                        className="bg-secondary text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shadow-secondary/10 text-sm"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Asignar Alumno
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {getSessionsForDate(selectedDate).map(session => (
                        <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 bg-surface-container-low rounded-xl sm:rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-sm sm:text-lg text-on-surface leading-tight">{session.studentName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] sm:text-xs font-black text-primary flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {session.timeSlot}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end sm:justify-start gap-4 mt-2 sm:mt-0">
                            {session.notes && (
                              <div className="hidden lg:block text-xs italic text-on-surface-variant/70 border-r border-outline-variant/20 pr-4 mr-4 text-right max-w-[200px] truncate">
                                "{session.notes}"
                              </div>
                            )}
                            <button 
                              onClick={() => handleDeleteSession(session.id)}
                              className="p-2 sm:p-3 text-on-surface-variant/40 hover:text-error hover:bg-error/5 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {getSessionsForDate(selectedDate).length === 0 && (
                        <div className="py-8 sm:py-12 border-2 border-dashed border-outline-variant/30 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center px-4 sm:px-6">
                          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-on-surface-variant/20 mb-3" />
                          <p className="text-sm sm:text-base text-on-surface-variant font-medium">Libre de clases oficiales.</p>
                          <p className="text-[10px] sm:text-xs text-on-surface-variant/60 mt-1">Recuerda marcar la disponibilidad en el calendario público si deseas recibir solicitudes.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1d2e51]">
                    <CheckCircle2 className="text-primary w-6 h-6" />
                    Resumen del Mes
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#f1f3f7] p-3 pl-5 rounded-2xl border border-gray-200/50">
                      <span className="text-[#4b5b81] text-sm font-bold flex items-center gap-3">
                        <Users className="w-4 h-4 opacity-50" /> Alumnos activos
                      </span>
                      <span className="font-black text-3xl text-primary leading-none">{students.length}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#f1f3f7] p-3 pl-5 rounded-2xl border border-gray-200/50">
                      <span className="text-[#4b5b81] text-sm font-bold flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 opacity-50" /> Sesiones agendadas
                      </span>
                      <span className="font-black text-3xl text-primary leading-none">
                        {sessions.filter(s => {
                          const sDate = new Date(s.date);
                          return sDate.getMonth() === currentDate.getMonth() && sDate.getFullYear() === currentDate.getFullYear();
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-3xl p-8 border border-outline-variant/10 shadow-sm flex-1">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1d2e51]">
                    <Clock className="text-primary w-6 h-6" />
                    Buscador Rápido
                  </h3>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-30" />
                    <input 
                      type="text" 
                      placeholder="Buscar alumno..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#eef2ff] rounded-xl border border-primary/10 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-primary/30 text-[#1d2e51] font-bold"
                    />
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {students
                      .filter(s => s.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(s => (
                        <div key={s.id} className="flex gap-2 items-center group">
                          <button 
                            onClick={() => {
                              setActiveTab('students');
                            }}
                            className="flex-1 text-left p-3.5 hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10 flex items-center justify-between"
                          >
                            <span className="font-bold text-[#4b5b81]">{s.studentName}</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </button>
                          <button 
                            onClick={() => setViewingStudent(s)}
                            className="p-3 bg-[#b9c3d9] text-white rounded-xl hover:bg-primary transition-all shadow-sm"
                            title="Ver detalles"
                          >
                            <Info className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    {students.filter(s => s.studentName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <p className="text-center text-on-surface-variant/60 py-4 text-sm italic">No se encontraron alumnos</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Session Add Modal */}
      <AnimatePresence>
        {isAddingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSession(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-secondary/5">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <CalendarIcon className="text-secondary" />
                  Agendar Clase
                </h3>
                <button onClick={() => setIsAddingSession(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Seleccionar Alumno *</label>
                  <select 
                    value={selectedStudentForSession}
                    onChange={e => setSelectedStudentForSession(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Elegir alumno --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.studentName} ({s.frequency})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">Horario *</label>
                  <select 
                    value={selectedTimeSlot}
                    onChange={e => setSelectedTimeSlot(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant">Notas para esta fecha</label>
                    <textarea 
                      value={sessionNotes}
                      onChange={e => setSessionNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline-variant outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                      placeholder="Ej: Repasar fracciones..."
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-outline-variant/10">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                      checked={shouldRepeatWeekly}
                      onChange={e => setShouldRepeatWeekly(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-on-surface-variant">Repetir semanalmente (próximas 4 semanas)</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleAddSession}
                    disabled={!selectedStudentForSession || isSubmittingSession}
                    className={cn(
                      "w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2",
                      isSubmittingSession && "cursor-not-allowed"
                    )}
                  >
                    {isSubmittingSession ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      `Agendar para el ${selectedDate?.split('-').reverse().join('/')}`
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Details Modal */}
      <AnimatePresence>
        {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingStudent(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-primary/5">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </span>
                  Detalles del Alumno
                </h3>
                <button onClick={() => setViewingStudent(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                  <h4 className="text-2xl font-black text-primary">{viewingStudent.studentName}</h4>
                  <p className="text-sm font-bold text-on-surface-variant mt-1">{viewingStudent.grade}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant">Tutor responsable</p>
                      <p className="font-bold text-on-surface">{viewingStudent.parentName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant">WhatsApp / Teléfono</p>
                      <a href={`tel:${viewingStudent.contactPhone}`} className="font-bold text-primary hover:underline">{viewingStudent.contactPhone}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant">Plan de Clases</p>
                      <p className="font-bold text-on-surface">{viewingStudent.frequency}</p>
                    </div>
                  </div>

                  {viewingStudent.preferredTime && (
                    <div className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant">Horario Elegido</p>
                        <p className="font-bold text-on-surface">{viewingStudent.preferredTime}</p>
                      </div>
                    </div>
                  )}

                  {viewingStudent.preferredDays && viewingStudent.preferredDays.length > 0 && (
                    <div className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mt-1">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface-variant">Días preferidos</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {viewingStudent.preferredDays.map((d: string) => (
                            <span key={d} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {viewingStudent.comments && (
                  <div className="pt-4 border-t border-outline-variant/10">
                    <p className="text-xs font-bold text-on-surface-variant mb-2">Notas Académicas</p>
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/5">
                      <p className="text-sm text-on-surface italic leading-relaxed">{viewingStudent.comments}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-2">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setViewingStudent(null);
                        setReportConfig({
                          show: true,
                          student: viewingStudent,
                          month: currentDate.getMonth(),
                          year: currentDate.getFullYear()
                        });
                      }}
                      className="flex-1 bg-secondary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Reporte
                    </button>
                    <button 
                      onClick={() => {
                        setViewingStudent(null);
                        setBudgetConfig({
                          show: true,
                          student: viewingStudent,
                          type: 'monthly',
                          month: currentDate.getMonth(),
                          year: currentDate.getFullYear(),
                          selectedWeekIndex: 0,
                          pricePerHour: 12000
                        });
                      }}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                      <DollarSign className="w-4 h-4" />
                      Presupuesto
                    </button>
                  </div>
                  <button 
                    onClick={() => setViewingStudent(null)}
                    className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest p-8 rounded-3xl max-w-md w-full shadow-2xl border border-outline-variant/10"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                confirmDialog.type === 'danger' ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
              )}>
                {confirmDialog.type === 'danger' ? <Trash2 /> : <Info />}
              </div>
              <h3 className="text-2xl font-bold mb-2">{confirmDialog.title}</h3>
              <p className="text-on-surface-variant mb-8 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-3 px-6 rounded-xl font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  disabled={confirmDialog.isLoading}
                  className={cn(
                    "flex-1 py-3 px-6 rounded-xl font-bold transition-all shadow-lg focus:ring-4 flex items-center justify-center gap-2",
                    confirmDialog.type === 'danger' 
                      ? "bg-error text-white hover:bg-error/90 shadow-error/20 ring-error/20" 
                      : "bg-primary text-white hover:bg-primary/90 shadow-primary/20 ring-primary/20",
                    confirmDialog.isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {confirmDialog.isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {notification.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4"
          >
            <div className={cn(
              "p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border",
              notification.type === 'success' && "bg-secondary text-on-primary border-primary/10",
              notification.type === 'info' && "bg-surface-container-highest text-on-surface border-outline-variant",
              notification.type === 'error' && "bg-error text-white border-white/10"
            )}>
              <div className="flex items-center gap-3">
                {notification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {notification.type === 'info' && <Info className="w-6 h-6" />}
                {notification.type === 'error' && <AlertCircle className="w-6 h-6" />}
                <div>
                  <p className="font-bold leading-none">{notification.title}</p>
                  <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Config Modal */}
      <AnimatePresence>
        {reportConfig.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGeneratingPDF && setReportConfig(prev => ({ ...prev, show: false }))}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl relative z-20 overflow-hidden border border-outline-variant/10"
            >
              <div className="p-6 border-b border-outline-variant/10 bg-secondary/5 flex justify-between items-center text-center">
                <h3 className="text-xl font-bold flex items-center gap-2 text-secondary">
                  <CalendarIcon className="w-5 h-5" />
                  Configurar reporte
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Alumno</p>
                    <p className="text-lg font-black text-secondary">{reportConfig.student?.studentName}</p>
                  </div>
                  <div className="pt-2 border-t border-secondary/10 flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Clases en este mes</span>
                    <span className="text-sm font-black text-secondary">
                      {sessions.filter(s => {
                        if (s.studentId !== reportConfig.student?.id) return false;
                        const parts = s.date.split('-');
                        return parseInt(parts[0], 10) === reportConfig.year && parseInt(parts[1], 10) === (reportConfig.month + 1);
                      }).length}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">Mes del reporte</label>
                    <select 
                      value={reportConfig.month}
                      onChange={e => setReportConfig(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-secondary transition-all"
                    >
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">Año</label>
                    <input 
                      type="number"
                      value={reportConfig.year}
                      onChange={e => setReportConfig(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-secondary transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGeneratingPDF}
                    className="w-full bg-secondary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-secondary/20 transition-all active:scale-95"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Descargar Calendario
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setReportConfig(prev => ({ ...prev, show: false }))}
                    disabled={isGeneratingPDF}
                    className="w-full mt-3 text-on-surface-variant hover:text-on-surface py-2 font-bold transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Config Modal */}
      <AnimatePresence>
        {budgetConfig.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGeneratingBudgetPDF && setBudgetConfig(prev => ({ ...prev, show: false }))}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl shadow-2xl relative z-20 overflow-hidden border border-outline-variant/10 text-[#1d2e51]"
            >
              <div className="p-6 border-b border-outline-variant/10 bg-primary/5 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <DollarSign className="w-5 h-5" />
                  Calcular Presupuesto
                </h3>
                <button 
                  onClick={() => !isGeneratingBudgetPDF && setBudgetConfig(prev => ({ ...prev, show: false }))}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Alumno</p>
                  <p className="text-lg font-black text-primary">{budgetConfig.student?.studentName}</p>
                </div>

                {/* Period Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant ml-1">Tipo de Presupuesto</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#f1f3f7] p-1 rounded-2xl border border-gray-200/50 text-center">
                    <button
                      type="button"
                      onClick={() => setBudgetConfig(prev => ({ ...prev, type: 'monthly', selectedWeekIndex: 0 }))}
                      className={cn(
                        "py-2.5 rounded-xl font-bold text-sm transition-all",
                        budgetConfig.type === 'monthly'
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetConfig(prev => ({ ...prev, type: 'weekly', selectedWeekIndex: 0 }))}
                      className={cn(
                        "py-2.5 rounded-xl font-bold text-sm transition-all",
                        budgetConfig.type === 'weekly'
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Semanal
                    </button>
                  </div>
                </div>

                {/* Period Configuration Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">Mes</label>
                    <select 
                      value={budgetConfig.month}
                      onChange={e => setBudgetConfig(prev => ({ ...prev, month: parseInt(e.target.value), selectedWeekIndex: 0 }))}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                    >
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">Año</label>
                    <input 
                      type="number"
                      value={budgetConfig.year}
                      onChange={e => setBudgetConfig(prev => ({ ...prev, year: parseInt(e.target.value), selectedWeekIndex: 0 }))}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Week Selector (if weekly mode is chosen) */}
                {budgetConfig.type === 'weekly' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant ml-1">Seleccionar Semana</label>
                    <select
                      value={budgetConfig.selectedWeekIndex}
                      onChange={e => setBudgetConfig(prev => ({ ...prev, selectedWeekIndex: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                    >
                      {getWeeksOfMonth(budgetConfig.year, budgetConfig.month).map((week, idx) => (
                        <option key={idx} value={idx}>{week.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Picker (Default 12.000 ARS) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant ml-1">Valor por clase/hora ($ARS)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input 
                      type="number"
                      min="0"
                      step="500"
                      value={budgetConfig.pricePerHour}
                      onChange={e => setBudgetConfig(prev => ({ ...prev, pricePerHour: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-black text-primary"
                      placeholder="12000"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 italic ml-1">Por defecto: $12.000 por hora. Puedes cambiar este monto libremente.</p>
                </div>

                {/* LIVE PREVIEW SECTION */}
                {(() => {
                  const targetSessions = getSessionsForBudget(
                    budgetConfig.student?.id,
                    budgetConfig.type,
                    budgetConfig.year,
                    budgetConfig.month,
                    budgetConfig.selectedWeekIndex
                  );
                  const totalAmount = targetSessions.length * budgetConfig.pricePerHour;

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold text-indigo-700 uppercase tracking-wider">
                          <span>Resumen del Cálculo</span>
                          <span className="bg-indigo-100 px-2 py-0.5 rounded text-[10px]">Vista Previa</span>
                        </div>
                        <div className="h-[1px] bg-indigo-100 my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4b5b81] font-medium">Clases encontradas:</span>
                          <strong className="font-bold text-slate-800">{targetSessions.length} clases</strong>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4b5b81] font-medium">Valor por hora:</span>
                          <strong className="font-bold text-slate-800">${budgetConfig.pricePerHour.toLocaleString('es-AR')}</strong>
                        </div>
                        <div className="h-[1px] bg-indigo-100 my-1" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[13px] font-black text-indigo-800 uppercase tracking-tight">Monto Total Estimado:</span>
                          <span className="text-xl font-black text-[#005da7] leading-none">
                            ${totalAmount.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Detected Classes Scroll List */}
                      {targetSessions.length > 0 && (
                        <div className="space-y-1 px-1">
                          <p className="text-[11px] font-bold text-[#4b5b81] uppercase tracking-wider mb-2">Clases en este ciclo:</p>
                          <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {targetSessions.map((s, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                                <span className="font-bold text-left">{getSpanishWeekdayAndDate(s.date)}</span>
                                <span className="font-medium bg-slate-200/50 px-1.5 py-0.5 rounded text-[10px]">
                                  {s.timeSlot.split('(')[0].trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Submitting Buttons */}
                <div className="pt-2">
                  <button 
                    onClick={handleGenerateBudgetPDF}
                    disabled={isGeneratingBudgetPDF}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {isGeneratingBudgetPDF ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Descargar Presupuesto (PDF)
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setBudgetConfig(prev => ({ ...prev, show: false }))}
                    disabled={isGeneratingBudgetPDF}
                    className="w-full mt-3 text-on-surface-variant hover:text-on-surface py-2 font-bold transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIDDEN PDF TEMPLATE - LANDSCAPE OPTIMIZED - REDESIGNED */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="pdf-report-template" className="w-[1400px] bg-white p-16 text-[#1d2e51] font-sans border" style={{ borderColor: '#f3f4f6' }}>
          {/* TOP HEADER */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-[32px] font-black text-[#005da7] leading-none mb-2 tracking-tight">SILVIA ISABEL</h1>
              <p className="text-[12px] font-bold text-[#4b5b81] tracking-[0.2em] uppercase">Academic Excellence Portal</p>
            </div>
            <div className="text-center">
              <h2 className="text-[38px] font-black text-[#005da7] leading-none mb-2 uppercase tracking-tighter">
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][reportConfig.month]} {reportConfig.year}
              </h2>
              <p className="text-[16px] font-medium text-[#4b5b81]">Calendario de Rendimiento Académico</p>
            </div>
            <div className="text-right">
              {/* Reference removed */}
            </div>
          </div>

          <div className="h-[1px] w-full mb-10" style={{ backgroundColor: '#f3f4f6' }} />

          {/* INFO SECTION */}
          <div className="grid grid-cols-4 gap-8 mb-12 px-2">
            <div className="border-l-4 border-[#005da7] pl-4">
              <p className="text-[11px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Nombre del Estudiante</p>
              <h3 className="text-[20px] font-black text-[#1d2e51]">{reportConfig.student?.studentName}</h3>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: '#d1d5db' }}>
              <p className="text-[11px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Tutor Académico</p>
              <h3 className="text-[20px] font-black text-[#1d2e51]">{reportConfig.student?.parentName || 'N/A'}</h3>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: '#d1d5db' }}>
              <p className="text-[11px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Registro Institucional</p>
              <h3 className="text-[20px] font-black text-[#1d2e51]">Nivel de Grado: {reportConfig.student?.grade || 'Superior'}</h3>
            </div>
            <div className="border-l-4 border-[#005da7] pl-4">
              <p className="text-[11px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Total de Clases</p>
              <h3 className="text-[20px] font-black text-[#005da7]">
                {sessions.filter(s => {
                  if (s.studentId !== reportConfig.student?.id) return false;
                  const parts = s.date.split('-');
                  return parseInt(parts[0], 10) === reportConfig.year && parseInt(parts[1], 10) === (reportConfig.month + 1);
                }).length} Clases
              </h3>
            </div>
          </div>

          {/* TABLE HEADERS */}
          <div className="grid grid-cols-7 mb-4 px-2">
            {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'].map(d => (
              <div key={d} className="text-center text-[14px] font-bold text-[#4b5b81] tracking-widest">{d}</div>
            ))}
          </div>

          {/* CALENDAR GRID */}
          <div className="grid grid-cols-7 border-t border-l rounded-lg overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
            {(() => {
              const year = reportConfig.year;
              const month = reportConfig.month;
              const firstDay = new Date(year, month, 1).getDay();
              const adjFirstDay = firstDay === 0 ? 6 : firstDay - 1;
              const days = new Date(year, month + 1, 0).getDate();
              
              const cells = [];
              for (let i = 0; i < adjFirstDay; i++) {
                cells.push(<div key={`empty-${i}`} className="h-32 border-r border-b" style={{ borderColor: '#e5e7eb', backgroundColor: 'rgba(249, 250, 251, 0.2)' }} />);
              }
              
              for (let day = 1; day <= days; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const daySessions = sessions
                  .filter(s => s.studentId === reportConfig.student?.id && s.date === dateStr)
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                
                cells.push(
                  <div key={day} className="h-32 border-r border-b p-4 relative flex flex-col items-center justify-center" style={{ borderColor: '#e5e7eb' }}>
                    <span className="absolute top-3 left-4 text-[13px] font-bold" style={{ color: '#d1d5db' }}>{day}</span>
                    <div className="flex flex-col gap-1.5 w-full items-center">
                      {daySessions.map(s => (
                        <p key={s.id} className="text-[13px] font-black text-[#005da7] tracking-tighter flex items-center gap-1.5">
                          <span className="text-[10px]">●</span>
                          {s.timeSlot.split('(')[0].trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }
              
              const totalCells = adjFirstDay + days;
              const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
              for (let i = 0; i < remaining; i++) {
                cells.push(<div key={`last-${i}`} className="h-32 border-r border-b" style={{ borderColor: '#e5e7eb', backgroundColor: 'rgba(249, 250, 251, 0.2)' }} />);
              }
              
              return cells;
            })()}
          </div>

          {/* FOOTER */}
          <div className="mt-12 flex items-center justify-center px-4 border-t pt-8" style={{ borderColor: '#f3f4f6' }}>
            <div className="flex items-center gap-3 text-[#4b5b81]">
              <CalendarIcon className="w-6 h-6 text-[#005da7]" />
              <p className="text-[13px] font-medium">
                Documento generado el {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN BUDGET PDF TEMPLATE - PORTRAIT OPTIMIZED */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div id="pdf-budget-template" className="w-[800px] bg-white p-12 text-[#1d2e51] font-sans" style={{ minHeight: '1100px' }}>
          {/* TOP HEADER */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
            <div>
              <h1 className="text-[28px] font-black text-[#005da7] leading-none mb-1 tracking-tight">SILVIA ISABEL</h1>
              <p className="text-[10px] font-bold text-[#4b5b81] tracking-[0.2em] uppercase">Maestra Particular - Apoyo Académico</p>
            </div>
            <div className="text-right">
              <h2 className="text-[22px] font-black text-[#005da7] leading-none mb-1 uppercase tracking-tight">
                PRESUPUESTO ACADÉMICO
              </h2>
              <p className="text-[11px] font-medium text-[#4b5b81]">
                {budgetConfig.type === 'weekly' ? 'Frecuencia Semanal' : 'Resumen Mensual'}
              </p>
            </div>
          </div>

          {/* BUDGET PARTICULARS */}
          <div className="grid grid-cols-2 gap-6 mb-8 px-2">
            <div className="border-l-4 border-[#005da7] pl-4">
              <p className="text-[10px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Para el estudiante</p>
              <h3 className="text-[16px] font-black text-[#1d2e51]">{budgetConfig.student?.studentName}</h3>
              <p className="text-[12px] text-[#4b5b81] font-medium mt-1">Grado: {budgetConfig.student?.grade || 'Superior'}</p>
            </div>
            <div className="border-l-4 border-gray-200 pl-4">
              <p className="text-[10px] font-bold text-[#4b5b81] opacity-50 uppercase tracking-widest mb-1">Período de Facturación</p>
              <h3 className="text-[16px] font-black text-[#1d2e51]">
                {budgetConfig.type === 'monthly' ? (
                  `${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][budgetConfig.month]} ${budgetConfig.year}`
                ) : (
                  getWeeksOfMonth(budgetConfig.year, budgetConfig.month)[budgetConfig.selectedWeekIndex]?.label || 'Semana elegida'
                )}
              </h3>
              <p className="text-[12px] text-[#4b5b81] font-medium mt-1">
                Generado el {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* MAIN BREAKDOWN (TABLE CARD) */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <div className="bg-[#f8fafc] border-b border-gray-200 px-6 py-4">
              <span className="text-[12px] font-bold text-[#4b5b81] uppercase tracking-wider">Concepto</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div>
                  <p className="font-black text-[15px] text-[#1d2e51]">Clases Particulares de Apoyo</p>
                  <p className="text-[12px] text-[#4b5b81] mt-1 space-x-2">
                    <span>Sesiones agendadas: <strong className="text-[#005da7]">{getSessionsForBudget(budgetConfig.student?.id, budgetConfig.type, budgetConfig.year, budgetConfig.month, budgetConfig.selectedWeekIndex).length}</strong></span>
                    <span>•</span>
                    <span>Monto por hora: <strong className="text-[#005da7]">${budgetConfig.pricePerHour.toLocaleString('es-AR')}</strong></span>
                  </p>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-[13px] font-bold text-[#4b5b81] uppercase tracking-wider">Total a cobrar</p>
                  <p className="text-[10px] text-[#4b5b81] mt-0.5">Valores expresados en Pesos Argentinos ($ ARS)</p>
                </div>
                <div className="bg-[#eef2ff] border border-primary/10 px-6 py-3 rounded-2xl text-right">
                  <span className="text-[26px] font-black text-[#005da7] leading-none">
                    ${(getSessionsForBudget(budgetConfig.student?.id, budgetConfig.type, budgetConfig.year, budgetConfig.month, budgetConfig.selectedWeekIndex).length * budgetConfig.pricePerHour).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZED SESSIONS */}
          <div className="px-2 mb-10">
            <h4 className="text-[12px] font-bold text-[#4b5b81] uppercase tracking-wider mb-3">Detalle de fechas calculadas:</h4>
            <div className="grid grid-cols-2 gap-3">
              {getSessionsForBudget(budgetConfig.student?.id, budgetConfig.type, budgetConfig.year, budgetConfig.month, budgetConfig.selectedWeekIndex).map((s: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-gray-100 rounded-xl">
                  <span className="flex items-center justify-center w-7 h-7 text-[12px] font-bold text-[#005da7] bg-white border border-gray-100 rounded-full shadow-sm shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[13px] font-bold text-[#1d2e51] block text-left">{getSpanishWeekdayAndDate(s.date)}</span>
                    <span className="text-[11px] font-medium text-[#4b5b81] block text-left">{s.timeSlot.split('(')[0].trim()}</span>
                  </div>
                </div>
              ))}
              {getSessionsForBudget(budgetConfig.student?.id, budgetConfig.type, budgetConfig.year, budgetConfig.month, budgetConfig.selectedWeekIndex).length === 0 && (
                <div className="col-span-2 p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl text-slate-400 text-[13px] italic">
                  No hay clases registradas en este período.
                </div>
              )}
            </div>
          </div>

          {/* FOOTER MESSAGE */}
          <div className="mt-12 text-center border-t border-gray-100 pt-8">
            <p className="text-[14px] font-bold text-[#005da7] mb-1">Muchas gracias por confiar en mi trabajo para el acompañamiento educativo.</p>
            <p className="text-[11px] text-[#4b5b81] font-medium">Por cualquier consulta, no dudes en comunicarte con Silvia Isabel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

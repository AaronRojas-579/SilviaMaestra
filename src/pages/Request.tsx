import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Verified, CalendarDays, Brain, ArrowRight } from 'lucide-react';
import { TEACHER_IMAGE_URL, TEACHER_PROFILE_URL, STUDENT_FALLBACK_URL } from '../constants';

export default function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    studentName: '',
    grade: '1° Grado (Primaria)',
    frequency: '1x por semana',
    timeSlot: '08:00 - 09:00 (Mañana)',
    comments: '',
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct WhatsApp message
    const message = `*Nueva Solicitud de Tutoría - Silvia, Maestra Particular*%0A%0A` +
      `*Padre/Tutor:* ${formData.parentName}%0A` +
      `*Estudiante:* ${formData.studentName}%0A` +
      `*Grado:* ${formData.grade}%0A` +
      `*Días Preferidos:* ${selectedDays.join(', ') || 'No especificado'}%0A` +
      `*Frecuencia:* ${formData.frequency}%0A` +
      `*Horario:* ${formData.timeSlot}%0A` +
      `*Comentarios:* ${formData.comments || 'Sin comentarios adicionales'}`;

    const whatsappUrl = `https://wa.me/5491123507300?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-32 px-8 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto text-on-primary"
        >
          <Verified className="w-10 h-10" />
        </motion.div>
        <h2 className="text-4xl font-bold">¡Solicitud Recibida!</h2>
        <p className="text-on-surface-variant">Gracias por contactarnos. La Maestra Silvia revisará tu solicitud y se pondrá en contacto contigo en un plazo de 24 horas hábiles.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-primary font-bold underline underline-offset-4"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-8 py-16 md:py-24 space-y-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
          <span className="inline-block px-4 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full text-sm font-semibold tracking-wide">
            Aprendizaje Intencional
          </span>
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-on-surface tracking-tight leading-[1.1]">
            Comienza el <span className="text-primary italic">Viaje.</span>
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
            Creemos que cada estudiante merece un enfoque personalizado. Cuéntanos tus metas educativas y construyamos juntos un camino hacia la maestría intencional.
          </p>
        </div>

      <div className="lg:col-span-7 relative">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl -z-10"></div>
        
        <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-xl border border-outline-variant/10">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Step 1 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">1</span>
                <h3 className="text-xl font-headline font-semibold">Contacto Principal</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant ml-2">Nombre del Padre/Tutor</label>
                  <input 
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    required 
                    className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300" 
                    placeholder="Ej. Elvira Pérez" 
                    type="text" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant ml-2">Nombre del Estudiante</label>
                  <input 
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required 
                    className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300" 
                    placeholder="Ej. Juan Pérez" 
                    type="text" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-2">Grado del Estudiante</label>
                <select 
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 text-on-surface appearance-none"
                >
                  <option>1° Grado (Primaria)</option>
                  <option>2° Grado (Primaria)</option>
                  <option>3° Grado (Primaria)</option>
                  <option>4° Grado (Primaria)</option>
                  <option>5° Grado (Primaria)</option>
                  <option>6° Grado (Primaria)</option>
                  <option>7° Grado (Primaria)</option>
                </select>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm">2</span>
                <h3 className="text-xl font-headline font-semibold">Preferencias de Horario</h3>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-semibold text-on-surface-variant ml-2">Días Preferidos</label>
                <div className="flex flex-wrap gap-3">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <label key={day} className="flex-1 min-w-[80px] cursor-pointer group">
                      <input 
                        className="peer hidden" 
                        type="checkbox" 
                        checked={selectedDays.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      <div className="w-full py-3 rounded-md bg-surface-container-highest text-center font-medium transition-all duration-300 peer-checked:bg-primary peer-checked:text-on-primary group-hover:bg-surface-container-high">{day}</div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant ml-2">Frecuencia Preferida</label>
                  <select 
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 text-on-surface"
                  >
                    <option>1x por semana</option>
                    <option>2x por semana</option>
                    <option>3x por semana</option>
                    <option>Personalizado / Intensivo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant ml-2">Franjas Horarias Preferidas</label>
                  <select 
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 text-on-surface"
                  >
                    <optgroup label="Turno Mañana">
                      <option>08:00 - 09:00 (Mañana)</option>
                      <option>09:00 - 10:00 (Mañana)</option>
                      <option>10:00 - 11:00 (Mañana)</option>
                      <option>11:00 - 12:00 (Mañana)</option>
                    </optgroup>
                    <optgroup label="Turno Tarde">
                      <option>13:00 - 14:00 (Tarde)</option>
                      <option>14:00 - 15:00 (Tarde)</option>
                      <option>15:00 - 16:00 (Tarde)</option>
                      <option>16:00 - 17:00 (Tarde)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-sm">3</span>
                <h3 className="text-xl font-headline font-semibold">Contexto Adicional</h3>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-2">¿Cómo podemos ayudarte? (Comentarios/Metas)</label>
                <textarea 
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-md bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-on-surface-variant/40 resize-none" 
                  placeholder="Cuéntanos sobre materias específicas, estilos de aprendizaje o desafíos..." 
                  rows={4}
                ></textarea>
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-full font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2" type="submit">
                <span>Enviar Solicitud</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-xs text-on-surface-variant mt-4 font-medium uppercase tracking-widest opacity-60">
                Normalmente respondemos en un plazo de 24 horas hábiles.
              </p>
            </div>
          </form>
        </div>
      </div>

      </div>
      
      {/* Info Section */}
      <section className="bg-surface-container-low py-20 px-8 rounded-xl mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <Verified className="w-10 h-10 text-primary" />
            <h4 className="text-xl font-headline font-bold">Seguro y Confiable</h4>
            <p className="text-on-surface-variant leading-relaxed">Todos los instructores pasan por una verificación de antecedentes y son evaluados por su excelencia pedagógica.</p>
          </div>
          <div className="space-y-4">
            <CalendarDays className="w-10 h-10 text-primary" />
            <h4 className="text-xl font-headline font-bold">Ritmo Flexible</h4>
            <p className="text-on-surface-variant leading-relaxed">Ajusta tu horario mes a mes según las necesidades cambiantes de tu familia.</p>
          </div>
          <div className="space-y-4">
            <Brain className="w-10 h-10 text-primary" />
            <h4 className="text-xl font-headline font-bold">Ajuste Intencional</h4>
            <p className="text-on-surface-variant leading-relaxed">Emparejamos a los estudiantes en función de su personalidad de aprendizaje, no solo por su disponibilidad.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Star, Brain, Heart, Palette, BarChart, CheckCircle, ArrowRight, Calendar, MapPin, Sparkles } from 'lucide-react';
import { TEACHER_IMAGE_URL, TEACHER_PROFILE_URL, TEACHER_FALLBACK_URL, LOCATION_IMAGE_URL } from '../constants';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-24 pb-24"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden px-8 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-1.5 mb-6 rounded-full bg-tertiary-container text-on-tertiary-container font-semibold text-sm"
            >
              Educación Primaria Personalizada
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight mb-6 leading-[1.1]"
            >
              Aprendizaje <span className="text-primary italic">intencional</span> con Maestra Silvia
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed"
            >
              Acompaño el crecimiento académico de tus hijos a través de una metodología que fomenta la curiosidad, la confianza y la excelencia académica.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <button 
                onClick={() => onNavigate('calendar')}
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                Ver Disponibilidad
                <Calendar className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative w-full aspect-[3/4] md:aspect-square">
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] rotate-6"></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full"
              >
                <img 
                  src={TEACHER_IMAGE_URL} 
                  alt="Maestra Silvia (Ilustración)" 
                  className="w-full h-full object-cover rounded-[2rem] shadow-2xl border-4 border-white"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = TEACHER_FALLBACK_URL;
                  }}
                />
              </motion.div>
              {/* Floating Accent */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container shadow-xl animate-bounce-slow">
                <Palette className="w-10 h-10" />
              </div>
              {/* Floating Glass Card */}
              <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-xl p-6 rounded-lg shadow-xl max-w-xs border border-white/20 z-20">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-5 h-5 text-tertiary fill-tertiary" />
                  <span className="font-bold text-on-surface">+10 Años de Experiencia</span>
                </div>
                <p className="text-sm text-on-surface-variant">Especialista en desarrollo cognitivo y lectoescritura.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre Mí Section */}
      <section className="bg-surface-container-low py-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl aspect-[4/5]">
                <img 
                  src={TEACHER_PROFILE_URL} 
                  alt="Silvia - Fundadora" 
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = TEACHER_IMAGE_URL;
                  }}
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl -z-10"></div>
              <div className="absolute top-10 -left-10 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>

            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Educación con Propósito
                </div>
                <h2 className="font-headline text-5xl font-bold text-on-surface leading-tight">Mi nombre es Silvia, y mi pasión es <span className="text-secondary">encender la chispa</span> del conocimiento.</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  Mi enfoque no es solo enseñar materias, sino cultivar el amor por el descubrimiento en un ambiente donde cada niño se sienta seguro de equivocarse para aprender.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-outline-variant/10">
                  <Brain className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">Metodología Activa</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Integro técnicas de aprendizaje basado en proyectos.</p>
                </div>
                <div className="bg-surface p-6 rounded-xl shadow-sm border border-outline-variant/10">
                  <Heart className="w-10 h-10 text-secondary mb-4" />
                  <h3 className="font-bold text-lg mb-2">Enfoque Humano</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">Priorizo la seguridad emocional y la confianza.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline text-4xl font-bold text-on-surface mb-4">Servicios de Tutoría</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">Soluciones educativas diseñadas para fortalecer el potencial de cada estudiante en un ambiente de confianza.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Refuerzo Individual",
              desc: "Sesiones personalizadas de 60 minutos enfocadas en las necesidades específicas de matemáticas, lengua o ciencias.",
              img: "https://images.unsplash.com/photo-1581229407781-c6127ab78710?q=80&w=2369&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              features: ["Atención 100% personalizada", "Material didáctico incluido"]
            },
            {
              title: "Talleres de Verano",
              desc: "Grupos reducidos para mantener el ritmo académico durante las vacaciones de forma lúdica y divertida.",
              img: "https://images.unsplash.com/photo-1675259425088-52b4b5dd701b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              features: ["Socialización y trabajo en equipo", "Aprendizaje basado en juegos"]
            },
            {
              title: "Preparación Exámenes",
              desc: "Técnicas de estudio y gestión de la ansiedad para afrontar evaluaciones con total seguridad y éxito.",
              img: "https://images.unsplash.com/photo-1727553957829-e429a578f848?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              features: ["Mapas conceptuales y memoria", "Simulacros de examen reales"]
            }
          ].map((service, idx) => (
            <div key={idx} className="group bg-surface-container-low rounded-xl overflow-hidden hover:bg-surface-container-high transition-colors p-1">
              <div className="bg-surface-container-lowest rounded-lg p-8 h-full flex flex-col">
                <div className="mb-6 rounded-lg overflow-hidden h-48">
                  <img 
                    src={service.img} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = TEACHER_FALLBACK_URL;
                    }}
                  />
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4">{service.title}</h3>
                <p className="text-on-surface-variant mb-8 flex-grow">{service.desc}</p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-5 h-5 text-secondary" /> {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => onNavigate('request')}
                  className="w-full py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-on-primary transition-all"
                >
                  Saber más
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto border-t border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-primary" />
              <h2 className="font-headline text-4xl font-bold text-on-surface">Ubicación del Atelier</h2>
            </div>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Las clases particulares se dictan en nuestro espacio de aprendizaje diseñado para la concentración y la creatividad. Un ambiente seguro y tranquilo para el desarrollo académico.
            </p>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 inline-block">
              <p className="font-bold text-on-surface mb-1">Nuestra Sede:</p>
              <p className="text-on-surface-variant mb-4">Accede a la ubicación exacta y planea tu llegada.</p>
              <a 
                href="https://maps.app.goo.gl/z6cMYPdp5Pf1KwDY9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                Ver en Google Maps <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl h-[400px] border-4 border-white relative group">
            <img 
              src={LOCATION_IMAGE_URL} 
              alt="Ubicación Atelier" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-20">
        <div className="max-w-5xl mx-auto rounded-xl bg-primary overflow-hidden relative p-12 md:p-20">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 text-center">
            <h2 className="font-headline text-3xl md:text-5xl font-bold text-on-primary mb-6">¿Listo para transformar el aprendizaje de tu hijo?</h2>
            <p className="text-on-primary/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">Reserva una sesión de diagnóstico gratuita para evaluar el nivel actual y trazar un plan de éxito personalizado.</p>
            <button 
              onClick={() => onNavigate('request')}
              className="bg-white text-primary px-10 py-4 rounded-full font-bold text-xl hover:bg-surface transition-all shadow-lg active:scale-95"
            >
              Agendar Diagnóstico Gratis
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

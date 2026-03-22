import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    title: "Premium Home Services",
    description: "Expert technicians at your doorstep in under 2 hours.",
    icon: "🛠️",
    color: "bg-blue-50"
  },
  {
    title: "Verified Professionals",
    description: "Every expert is background-checked and highly trained.",
    icon: "👨‍🔧",
    color: "bg-orange-50"
  },
  {
    title: "Transparent Pricing",
    description: "No hidden costs. Pay only after the work is done securely.",
    icon: "💳",
    color: "bg-green-50"
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/login');
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className={`min-h-screen ${slide.color} flex flex-col transition-colors duration-500`}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <motion.div 
          className="absolute w-96 h-96 bg-white rounded-full opacity-50 blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center z-10"
          >
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center text-8xl shadow-elevated mb-12 border-8 border-white/50">
              {slide.icon}
            </div>
            
            <h1 className="text-3xl font-syne font-black text-accent mb-4 tracking-tight">
              {slide.title}
            </h1>
            <p className="text-text-secondary text-lg max-w-[280px] leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-t-3xl p-8 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full btn-primary py-5 text-lg rounded-2xl shadow-lg flex justify-center items-center gap-2 group"
        >
          {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
}

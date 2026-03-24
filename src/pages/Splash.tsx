import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to Onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      // In a real app we might check if it's the first time launch
      // by looking at Capacitor Preferences. For now we go to onboarding.
      navigate('/onboarding', { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="text-center z-10"
      >
        <div className="w-32 h-32 bg-white rounded-3xl mb-6 mx-auto flex items-center justify-center shadow-elevated transform rotate-12">
          <span className="text-6xl transform -rotate-12">🛠️</span>
        </div>
        <h1 className="text-4xl font-syne font-black text-white tracking-tight mb-2">
          Houserve
        </h1>
        <p className="text-primary-light font-medium tracking-wide">
          HOME & FACILITY SERVICES
        </p>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: ["0%", "-50%", "0%"] 
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15 
              }}
              className="w-2.5 h-2.5 bg-white rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

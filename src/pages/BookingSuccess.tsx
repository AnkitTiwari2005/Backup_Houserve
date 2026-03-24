import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingRef } = location.state || { bookingRef: 'HS-XXXXXX' };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
        className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 border-4 border-success"
      >
        <svg className="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-syne font-bold text-accent mb-2 tracking-tight"
      >
        Booking Confirmed! 🎉
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-text-secondary mb-8"
      >
        You'll receive a WhatsApp confirmation shortly.
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm mb-10"
      >
        <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mb-2">Booking Reference</p>
        <p className="text-2xl font-mono font-bold text-primary tracking-widest">{bookingRef}</p>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-4"
      >
        <button 
          onClick={() => navigate('/bookings', { replace: true })}
          className="btn-primary w-full py-4 rounded-xl shadow-lg"
        >
          Track Booking
        </button>
        <button 
          onClick={() => navigate('/home', { replace: true })}
          className="btn-ghost w-full py-3 rounded-xl border-2 border-border"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoadingSplash({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500); // 2.5 seconds splash screen
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=1000&auto=format&fit=crop)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

          {/* Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
              className="mb-8"
            >
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(139,0,0,0.8)] border-4 border-primary-light">
                <span className="text-4xl font-bold text-white tracking-wider">J<span className="text-secondary">b</span></span>
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-white mb-4"
            >
              جيبلي
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 text-lg mb-12 font-medium tracking-wide"
            >
              أسرع دليفري في الجزائر ...
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center items-center gap-2"
            >
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

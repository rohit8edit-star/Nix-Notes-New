import { motion } from 'motion/react';

export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Background Paper Shape */}
      <div className="absolute inset-0 bg-primary rounded-xl rotate-6 opacity-20" />
      <div className="absolute inset-0 bg-primary rounded-xl -rotate-3 opacity-40" />
      <div className="absolute inset-0 bg-primary rounded-xl shadow-lg flex items-center justify-center">
        {/* Stylized N */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-2/3 h-2/3"
        >
          <path d="M4 20V4l16 16V4" />
        </svg>
      </div>
      
      {/* Corner Fold Effect */}
      <div className="absolute top-0 right-0 w-4 h-4 bg-white/20 rounded-bl-lg rounded-tr-xl" />
    </motion.div>
  );
}

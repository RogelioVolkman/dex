import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...', showLogo = true }) => {
  const sizes = {
    small: { container: 'w-8 h-8', spinner: 'w-6 h-6', text: 'text-sm' },
    medium: { container: 'w-12 h-12', spinner: 'w-8 h-8', text: 'text-base' },
    large: { container: 'w-16 h-16', spinner: 'w-12 h-12', text: 'text-lg' }
  };

  const currentSize = sizes[size] || sizes.large;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {showLogo && (
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 360, 720]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
      )}

      {/* Main Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`${currentSize.container} border-3 border-indigo-200/30 border-t-indigo-500 rounded-full`}
        />
        
        {/* Inner ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute inset-2 border-2 border-purple-200/30 border-t-purple-500 rounded-full`}
        />
        
        {/* Center dot */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 m-auto w-2 h-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full"
        />
      </div>

      {/* Loading text */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`${currentSize.text} font-medium text-gray-300 text-center`}
      >
        {text}
      </motion.div>

      {/* Pulsing dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

// Skeleton loader component
export const SkeletonLoader = ({ className = '', children, isLoading = true }) => {
  if (!isLoading) return children;

  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white/10 rounded-lg h-full w-full" />
    </div>
  );
};

// Card skeleton
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass rounded-2xl p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl" />
            <div className="w-16 h-6 bg-white/10 rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="w-3/4 h-6 bg-white/10 rounded-lg" />
            <div className="w-full h-4 bg-white/10 rounded-lg" />
            <div className="w-5/6 h-4 bg-white/10 rounded-lg" />
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="w-24 h-4 bg-white/10 rounded-lg" />
            <div className="w-20 h-8 bg-white/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Progress spinner with steps
export const StepLoader = ({ 
  steps = ['Initializing...', 'Connecting...', 'Loading...'], 
  currentStep = 0 
}) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      <LoadingSpinner showLogo={false} text="" />
      
      <div className="space-y-2 w-full max-w-xs">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: index <= currentStep ? 1 : 0.5,
              x: 0
            }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-3 text-sm ${
              index === currentStep ? 'text-indigo-400' : 
              index < currentStep ? 'text-green-400' : 'text-gray-500'
            }`}
          >
            {index < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            ) : index === currentStep ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-4 h-4 border-2 border-gray-500 rounded-full" />
            )}
            <span>{step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Full screen overlay loader
export const OverlayLoader = ({ isVisible, text = 'Processing...', onClose }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-strong rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <LoadingSpinner text={text} />
        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoadingSpinner;
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import DEX from './pages/DEX';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import LoadingSpinner from './components/LoadingSpinner';
import { Web3Provider } from './hooks/useWeb3';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Simulate loading time for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize FHE and Web3 connections
        // In a real app, this would include actual initialization logic
        console.log('SecretLaunch initialized successfully');
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize SecretLaunch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        {/* Background mesh pattern */}
        <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none" />
        
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.2, 0.4],
              x: [0, -40, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Main app content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaign/:id" element={<CampaignDetail />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/dex" element={<DEX />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          <Footer />
        </div>

        {/* Success initialization notification */}
        {isInitialized && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed bottom-6 right-6 z-50 bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">SecretLaunch Ready</span>
            </div>
          </motion.div>
        )}
      </div>
    </Web3Provider>
  );
}

// 404 Not Found component
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          🔒
        </motion.div>
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-8">
          This page is as secret as our FHE encryption - it doesn't exist!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.history.back()}
          className="btn-primary"
        >
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
}

export default App;
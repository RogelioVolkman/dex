import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="min-h-screen pt-8">
      <div className="container-max section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Platform <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-gray-300">Privacy-preserving analytics - Coming Soon</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
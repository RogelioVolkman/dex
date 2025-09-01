import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const CampaignDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen pt-8">
      <div className="container-max section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Campaign Detail <span className="text-gradient">#{id}</span>
          </h1>
          <p className="text-gray-300">Campaign details page - Coming Soon</p>
        </motion.div>
      </div>
    </div>
  );
};

export default CampaignDetail;
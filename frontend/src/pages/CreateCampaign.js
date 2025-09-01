import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Eye, 
  EyeOff, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Wallet,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import toast from 'react-hot-toast';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { isConnected, account, signMessage } = useWeb3();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Project Details
    projectName: '',
    projectSymbol: '',
    description: '',
    category: 'DeFi',
    website: '',
    whitepaper: '',
    
    // Token Details
    totalSupply: '',
    tokenPrice: '',
    
    // Sale Configuration
    privateSaleTarget: '',
    publicSaleTarget: '',
    privateSalePrice: '',
    publicSalePrice: '',
    minInvestment: '',
    maxInvestment: '',
    
    // Timeline
    privateSaleDuration: '7',
    publicSaleDuration: '14',
    
    // Advanced Settings
    liquidityPercentage: '25',
    vestingPeriod: '90',
    
    // Legal & Verification
    kycRequired: false,
    auditCompleted: false,
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, name: 'Project Details', icon: Info },
    { id: 2, name: 'Token Configuration', icon: Target },
    { id: 3, name: 'Sale Parameters', icon: DollarSign },
    { id: 4, name: 'Timeline & Settings', icon: Calendar },
    { id: 5, name: 'Review & Launch', icon: CheckCircle }
  ];

  const categories = [
    'DeFi', 'Infrastructure', 'Gaming', 'NFT', 'Governance', 
    'Analytics', 'Privacy', 'Layer 2', 'Metaverse', 'DAO'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
        if (!formData.projectSymbol.trim()) newErrors.projectSymbol = 'Project symbol is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
        break;

      case 2:
        if (!formData.totalSupply || parseFloat(formData.totalSupply) <= 0) {
          newErrors.totalSupply = 'Valid total supply is required';
        }
        if (!formData.tokenPrice || parseFloat(formData.tokenPrice) <= 0) {
          newErrors.tokenPrice = 'Valid token price is required';
        }
        break;

      case 3:
        if (!formData.privateSaleTarget || parseFloat(formData.privateSaleTarget) <= 0) {
          newErrors.privateSaleTarget = 'Valid private sale target is required';
        }
        if (!formData.publicSaleTarget || parseFloat(formData.publicSaleTarget) <= 0) {
          newErrors.publicSaleTarget = 'Valid public sale target is required';
        }
        if (!formData.privateSalePrice || parseFloat(formData.privateSalePrice) <= 0) {
          newErrors.privateSalePrice = 'Valid private sale price is required';
        }
        if (!formData.publicSalePrice || parseFloat(formData.publicSalePrice) <= 0) {
          newErrors.publicSalePrice = 'Valid public sale price is required';
        }
        if (parseFloat(formData.privateSalePrice) >= parseFloat(formData.publicSalePrice)) {
          newErrors.publicSalePrice = 'Public sale price must be higher than private sale price';
        }
        break;

      case 4:
        if (parseInt(formData.privateSaleDuration) < 1) {
          newErrors.privateSaleDuration = 'Private sale duration must be at least 1 day';
        }
        if (parseInt(formData.publicSaleDuration) < 1) {
          newErrors.publicSaleDuration = 'Public sale duration must be at least 1 day';
        }
        break;

      case 5:
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'You must accept the terms and conditions';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create campaign data
      const campaignData = {
        ...formData,
        creator: account,
        timestamp: Date.now()
      };

      // Sign the campaign data for verification
      const signature = await signMessage(JSON.stringify(campaignData));
      
      // In a real app, this would call the smart contract
      console.log('Campaign Data:', campaignData);
      console.log('Signature:', signature);

      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success('Campaign launched successfully!');
      navigate('/campaigns');

    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error('Failed to launch campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">Project Name *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter your project name"
                className={`input-field ${errors.projectName ? 'border-red-500' : ''}`}
              />
              {errors.projectName && (
                <p className="text-red-400 text-sm mt-1">{errors.projectName}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Token Symbol *</label>
                <input
                  type="text"
                  value={formData.projectSymbol}
                  onChange={(e) => handleInputChange('projectSymbol', e.target.value.toUpperCase())}
                  placeholder="e.g., CSP"
                  maxLength={10}
                  className={`input-field ${errors.projectSymbol ? 'border-red-500' : ''}`}
                />
                {errors.projectSymbol && (
                  <p className="text-red-400 text-sm mt-1">{errors.projectSymbol}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input-field"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your project, its purpose, and value proposition..."
                rows={5}
                className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between mt-1">
                {errors.description && (
                  <p className="text-red-400 text-sm">{errors.description}</p>
                )}
                <p className="text-gray-400 text-sm">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourproject.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Whitepaper</label>
                <input
                  type="url"
                  value={formData.whitepaper}
                  onChange={(e) => handleInputChange('whitepaper', e.target.value)}
                  placeholder="https://link-to-whitepaper.pdf"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-medium">Token Configuration</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Configure your token parameters. These settings will be used to deploy your token contract.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Total Supply *</label>
                <input
                  type="number"
                  value={formData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                  placeholder="1000000"
                  className={`input-field ${errors.totalSupply ? 'border-red-500' : ''}`}
                />
                {errors.totalSupply && (
                  <p className="text-red-400 text-sm mt-1">{errors.totalSupply}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Initial Token Price (USD) *</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.tokenPrice}
                  onChange={(e) => handleInputChange('tokenPrice', e.target.value)}
                  placeholder="0.10"
                  className={`input-field ${errors.tokenPrice ? 'border-red-500' : ''}`}
                />
                {errors.tokenPrice && (
                  <p className="text-red-400 text-sm mt-1">{errors.tokenPrice}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">Token Economics</p>
                  <p>Your tokens will be minted and distributed according to the sale parameters you set in the next step.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Private Sale Target (USD) *</label>
                <input
                  type="number"
                  value={formData.privateSaleTarget}
                  onChange={(e) => handleInputChange('privateSaleTarget', e.target.value)}
                  placeholder="500000"
                  className={`input-field ${errors.privateSaleTarget ? 'border-red-500' : ''}`}
                />
                {errors.privateSaleTarget && (
                  <p className="text-red-400 text-sm mt-1">{errors.privateSaleTarget}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Public Sale Target (USD) *</label>
                <input
                  type="number"
                  value={formData.publicSaleTarget}
                  onChange={(e) => handleInputChange('publicSaleTarget', e.target.value)}
                  placeholder="1000000"
                  className={`input-field ${errors.publicSaleTarget ? 'border-red-500' : ''}`}
                />
                {errors.publicSaleTarget && (
                  <p className="text-red-400 text-sm mt-1">{errors.publicSaleTarget}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2 flex items-center space-x-2">
                  <EyeOff className="w-4 h-4" />
                  <span>Private Sale Price (USD) *</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.privateSalePrice}
                  onChange={(e) => handleInputChange('privateSalePrice', e.target.value)}
                  placeholder="0.05"
                  className={`input-field ${errors.privateSalePrice ? 'border-red-500' : ''}`}
                />
                {errors.privateSalePrice && (
                  <p className="text-red-400 text-sm mt-1">{errors.privateSalePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2 flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Public Sale Price (USD) *</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.publicSalePrice}
                  onChange={(e) => handleInputChange('publicSalePrice', e.target.value)}
                  placeholder="0.08"
                  className={`input-field ${errors.publicSalePrice ? 'border-red-500' : ''}`}
                />
                {errors.publicSalePrice && (
                  <p className="text-red-400 text-sm mt-1">{errors.publicSalePrice}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Minimum Investment (USD)</label>
                <input
                  type="number"
                  value={formData.minInvestment}
                  onChange={(e) => handleInputChange('minInvestment', e.target.value)}
                  placeholder="100"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Maximum Investment (USD)</label>
                <input
                  type="number"
                  value={formData.maxInvestment}
                  onChange={(e) => handleInputChange('maxInvestment', e.target.value)}
                  placeholder="10000"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Private Sale Duration (Days) *</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.privateSaleDuration}
                  onChange={(e) => handleInputChange('privateSaleDuration', e.target.value)}
                  className={`input-field ${errors.privateSaleDuration ? 'border-red-500' : ''}`}
                />
                {errors.privateSaleDuration && (
                  <p className="text-red-400 text-sm mt-1">{errors.privateSaleDuration}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Public Sale Duration (Days) *</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.publicSaleDuration}
                  onChange={(e) => handleInputChange('publicSaleDuration', e.target.value)}
                  className={`input-field ${errors.publicSaleDuration ? 'border-red-500' : ''}`}
                />
                {errors.publicSaleDuration && (
                  <p className="text-red-400 text-sm mt-1">{errors.publicSaleDuration}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">DEX Liquidity Percentage</label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  value={formData.liquidityPercentage}
                  onChange={(e) => handleInputChange('liquidityPercentage', e.target.value)}
                  className="input-field"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Percentage of raised funds allocated for DEX liquidity
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Vesting Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.vestingPeriod}
                  onChange={(e) => handleInputChange('vestingPeriod', e.target.value)}
                  className="input-field"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Token release delay after campaign completion
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="kycRequired"
                  checked={formData.kycRequired}
                  onChange={(e) => handleInputChange('kycRequired', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-transparent border-white/20 rounded focus:ring-indigo-500"
                />
                <label htmlFor="kycRequired" className="text-white">
                  Require KYC verification for participants
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auditCompleted"
                  checked={formData.auditCompleted}
                  onChange={(e) => handleInputChange('auditCompleted', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-transparent border-white/20 rounded focus:ring-indigo-500"
                />
                <label htmlFor="auditCompleted" className="text-white">
                  Smart contract has been audited
                </label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Campaign Summary</h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Project:</span>
                    <span className="text-white font-medium">{formData.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Symbol:</span>
                    <span className="text-white font-medium">{formData.projectSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Category:</span>
                    <span className="text-white font-medium">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Supply:</span>
                    <span className="text-white font-medium">{formData.totalSupply}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Private Target:</span>
                    <span className="text-white font-medium">${formData.privateSaleTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Public Target:</span>
                    <span className="text-white font-medium">${formData.publicSaleTarget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Private Price:</span>
                    <span className="text-white font-medium">${formData.privateSalePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Public Price:</span>
                    <span className="text-white font-medium">${formData.publicSalePrice}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">Important Notice</p>
                  <p>Once launched, campaign parameters cannot be modified. Please review all details carefully.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-transparent border-white/20 rounded focus:ring-indigo-500"
              />
              <label htmlFor="termsAccepted" className="text-white">
                I accept the Terms of Service and Privacy Policy *
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-red-400 text-sm">{errors.termsAccepted}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <Wallet className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            You need to connect your wallet to create a campaign
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="container-max section-padding">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Launch Your <span className="text-gradient">Campaign</span>
            </h1>
            <p className="text-gray-300 mt-2">
              Create a confidential fundraising campaign with FHE privacy
            </p>
          </div>
          
          <div className="w-20" />
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted ? '#10b981' : isActive ? '#6366f1' : '#374151'
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-indigo-600' : 'bg-gray-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </motion.div>
                    <span className={`text-sm text-center ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass rounded-2xl p-8">
            {renderStep()}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-4xl mx-auto">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>

          <div className="flex space-x-4">
            {currentStep < steps.length ? (
              <button onClick={nextStep} className="btn-primary">
                Next Step
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Campaign</span>
                    <Target className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
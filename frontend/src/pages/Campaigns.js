import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign,
  Eye,
  EyeOff,
  Star,
  Target,
  Calendar,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import LoadingSpinner, { CardSkeleton } from '../components/LoadingSpinner';

const Campaigns = () => {
  const { isConnected } = useWeb3();
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);

  // Mock campaigns data - in production, this would come from the blockchain
  const mockCampaigns = [
    {
      id: 1,
      name: 'CryptoShield Pro',
      symbol: 'CSP',
      description: 'Advanced privacy-focused cryptocurrency wallet with built-in FHE capabilities for secure transactions.',
      creator: '0x1234...5678',
      targetAmount: '500000',
      currentAmount: '342500',
      privateSalePrice: '0.05',
      publicSalePrice: '0.08',
      participantCount: 234,
      daysLeft: 12,
      category: 'DeFi',
      status: 'active',
      phase: 'Private Sale',
      isVerified: true,
      riskLevel: 'low',
      image: '/api/placeholder/400/300'
    },
    {
      id: 2,
      name: 'ZeroTrace Network',
      symbol: 'ZTN',
      description: 'Decentralized VPN network with anonymous payment system using fully homomorphic encryption.',
      creator: '0x8765...4321',
      targetAmount: '1000000',
      currentAmount: '650000',
      privateSalePrice: '0.12',
      publicSalePrice: '0.15',
      participantCount: 456,
      daysLeft: 8,
      category: 'Infrastructure',
      status: 'active',
      phase: 'Public Sale',
      isVerified: true,
      riskLevel: 'medium',
      image: '/api/placeholder/400/300'
    },
    {
      id: 3,
      name: 'PrivateDAO Governance',
      symbol: 'PDG',
      description: 'Revolutionary DAO platform enabling completely private voting and proposal submission.',
      creator: '0xabcd...ef90',
      targetAmount: '750000',
      currentAmount: '123000',
      privateSalePrice: '0.08',
      publicSalePrice: '0.10',
      participantCount: 89,
      daysLeft: 25,
      category: 'Governance',
      status: 'active',
      phase: 'Private Sale',
      isVerified: false,
      riskLevel: 'high',
      image: '/api/placeholder/400/300'
    },
    {
      id: 4,
      name: 'SecretSwap Exchange',
      symbol: 'SSE',
      description: 'First fully confidential DEX with encrypted order books and private liquidity pools.',
      creator: '0x9876...1234',
      targetAmount: '2000000',
      currentAmount: '1850000',
      privateSalePrice: '0.20',
      publicSalePrice: '0.25',
      participantCount: 789,
      daysLeft: 3,
      category: 'DeFi',
      status: 'ending_soon',
      phase: 'Public Sale',
      isVerified: true,
      riskLevel: 'low',
      image: '/api/placeholder/400/300'
    },
    {
      id: 5,
      name: 'Anonymous Analytics',
      symbol: 'ANA',
      description: 'Privacy-preserving blockchain analytics platform for institutional investors.',
      creator: '0xfed...abc',
      targetAmount: '300000',
      currentAmount: '300000',
      privateSalePrice: '0.06',
      publicSalePrice: '0.09',
      participantCount: 156,
      daysLeft: 0,
      category: 'Analytics',
      status: 'completed',
      phase: 'Completed',
      isVerified: true,
      riskLevel: 'low',
      image: '/api/placeholder/400/300'
    }
  ];

  const filters = [
    { id: 'all', name: 'All Campaigns', icon: Target },
    { id: 'active', name: 'Active', icon: Zap },
    { id: 'ending_soon', name: 'Ending Soon', icon: Clock },
    { id: 'completed', name: 'Completed', icon: Shield },
    { id: 'defi', name: 'DeFi', icon: DollarSign },
    { id: 'infrastructure', name: 'Infrastructure', icon: Users }
  ];

  const sortOptions = [
    { id: 'trending', name: 'Trending' },
    { id: 'ending_soon', name: 'Ending Soon' },
    { id: 'newest', name: 'Newest First' },
    { id: 'highest_raised', name: 'Highest Raised' },
    { id: 'most_participants', name: 'Most Participants' }
  ];

  useEffect(() => {
    // Simulate loading data
    const loadCampaigns = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCampaigns(mockCampaigns);
      setFilteredCampaigns(mockCampaigns);
      setLoading(false);
    };

    loadCampaigns();
  }, []);

  useEffect(() => {
    let filtered = [...campaigns];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'defi') {
        filtered = filtered.filter(campaign => campaign.category.toLowerCase() === 'defi');
      } else if (selectedFilter === 'infrastructure') {
        filtered = filtered.filter(campaign => campaign.category.toLowerCase() === 'infrastructure');
      } else {
        filtered = filtered.filter(campaign => campaign.status === selectedFilter);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'ending_soon':
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'highest_raised':
        filtered.sort((a, b) => parseFloat(b.currentAmount) - parseFloat(a.currentAmount));
        break;
      case 'most_participants':
        filtered.sort((a, b) => b.participantCount - a.participantCount);
        break;
      default:
        // trending - keep original order or implement trending algorithm
        break;
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, selectedFilter, sortBy]);

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((parseFloat(current) / parseFloat(target)) * 100, 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'ending_soon': return 'text-orange-400 bg-orange-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-8">
        <div className="container-max section-padding">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Discover <span className="text-gradient">Campaigns</span>
            </h1>
            <p className="text-xl text-gray-300">
              Explore confidential fundraising opportunities
            </p>
          </div>
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="container-max section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover <span className="text-gradient">Campaigns</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Explore confidential fundraising opportunities with complete privacy
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: Target },
              { label: 'Total Raised', value: formatAmount(campaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0)), icon: DollarSign },
              { label: 'Total Participants', value: campaigns.reduce((sum, c) => sum + c.participantCount, 0), icon: Users },
              { label: 'Success Rate', value: '92%', icon: TrendingUp }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <Icon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns, projects, or tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id} className="bg-gray-800">
                  {option.name}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <motion.button
              whileHover={{ rotate: 180 }}
              onClick={() => window.location.reload()}
              className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Filter Pills */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex flex-wrap gap-3"
              >
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedFilter === filter.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{filter.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 text-gray-300"
        >
          Showing {filteredCampaigns.length} of {campaigns.length} campaigns
        </motion.div>

        {/* Campaign Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="glass rounded-2xl overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
              >
                <Link to={`/campaign/${campaign.id}`}>
                  {/* Campaign Image */}
                  <div className="relative h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 left-4 flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.phase}
                      </span>
                      {campaign.isVerified && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-400/20 text-blue-400">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className={`w-3 h-3 rounded-full ${getRiskColor(campaign.riskLevel)}`} />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-bold text-lg">{campaign.symbol}</div>
                        <div className="text-gray-300 text-sm">{campaign.category}</div>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-gradient transition-colors">
                        {campaign.name}
                      </h3>
                      <Star className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-white font-medium">
                          {getProgressPercentage(campaign.currentAmount, campaign.targetAmount).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getProgressPercentage(campaign.currentAmount, campaign.targetAmount)}%` }}
                          transition={{ duration: 1.5, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {formatAmount(campaign.currentAmount)}
                        </div>
                        <div className="text-xs text-gray-400">Raised</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {campaign.participantCount}
                        </div>
                        <div className="text-xs text-gray-400">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {campaign.daysLeft > 0 ? `${campaign.daysLeft}d` : 'Ended'}
                        </div>
                        <div className="text-xs text-gray-400">Left</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-300">
                        <span className="flex items-center space-x-1">
                          <EyeOff className="w-4 h-4" />
                          <span>Private: ${campaign.privateSalePrice}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>Public: ${campaign.publicSalePrice}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 group"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">No campaigns found</h3>
            <p className="text-gray-300 mb-8">
              Try adjusting your search or filters to find what you're looking for
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
                setSortBy('trending');
              }}
              className="btn-primary"
            >
              Reset Filters
            </button>
          </motion.div>
        )}

        {/* Load More Button */}
        {filteredCampaigns.length > 0 && filteredCampaigns.length < campaigns.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <button className="btn-secondary">
              Load More Campaigns
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;
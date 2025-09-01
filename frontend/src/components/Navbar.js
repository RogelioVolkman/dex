import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Menu, 
  X, 
  Wallet, 
  ChevronDown,
  Zap,
  TrendingUp,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const location = useLocation();
  
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    chainId, 
    balance 
  } = useWeb3();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setShowWalletMenu(false);
  }, [location]);

  const navItems = [
    { 
      path: '/', 
      name: 'Home', 
      icon: Shield 
    },
    { 
      path: '/campaigns', 
      name: 'Campaigns', 
      icon: TrendingUp 
    },
    { 
      path: '/create', 
      name: 'Launch', 
      icon: PlusCircle 
    },
    { 
      path: '/dex', 
      name: 'DEX', 
      icon: Zap 
    },
    { 
      path: '/analytics', 
      name: 'Analytics', 
      icon: BarChart3 
    }
  ];

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    return parseFloat(balance).toFixed(4);
  };

  const WalletButton = () => {
    if (isConnecting) {
      return (
        <motion.button
          disabled
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600/50 text-white rounded-xl cursor-not-allowed"
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting...</span>
        </motion.button>
      );
    }

    if (isConnected && account) {
      return (
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{formatAddress(account)}</div>
              <div className="text-xs text-gray-300">{formatBalance(balance)} ETH</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </motion.button>

          <AnimatePresence>
            {showWalletMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50"
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Wallet Connected</div>
                      <div className="text-xs text-green-400">Chain ID: {chainId}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Address:</span>
                      <span className="text-white font-mono">{formatAddress(account)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Balance:</span>
                      <span className="text-white">{formatBalance(balance)} ETH</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Link 
                    to="/dashboard"
                    className="flex items-center space-x-2 w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors mb-2"
                    onClick={() => setShowWalletMenu(false)}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      disconnect();
                      setShowWalletMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={connect}
        className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </motion.button>
    );
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-gradient">SecretLaunch</span>
                <div className="text-xs text-gray-400">FHE Powered</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all relative group ${
                      isActive 
                        ? 'text-indigo-400 bg-white/10' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/10 rounded-xl border border-white/20"
                        initial={false}
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Wallet Button */}
            <div className="hidden md:block">
              <WalletButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20"
            >
              <div className="px-4 py-6 space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? 'text-indigo-400 bg-white/10 border border-white/20' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="pt-4 border-t border-white/10">
                  <WalletButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />

      {/* Click outside handler for wallet menu */}
      {showWalletMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </>
  );
};

export default Navbar;
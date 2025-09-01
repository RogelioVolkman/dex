import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Lock, 
  TrendingUp, 
  Zap, 
  Users, 
  DollarSign,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Globe,
  Layers
} from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState({
    totalRaised: '12.5M',
    activeProjects: '234',
    totalUsers: '15.7K',
    successRate: '89%'
  });

  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    stats: false,
    howItWorks: false
  });

  useEffect(() => {
    // Animate sections on mount
    const timers = [
      setTimeout(() => setIsVisible(prev => ({ ...prev, hero: true })), 100),
      setTimeout(() => setIsVisible(prev => ({ ...prev, features: true })), 300),
      setTimeout(() => setIsVisible(prev => ({ ...prev, stats: true })), 500),
      setTimeout(() => setIsVisible(prev => ({ ...prev, howItWorks: true })), 700)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Fully Encrypted Investments',
      description: 'All investment amounts are encrypted using Zama FHE protocol, ensuring complete privacy while maintaining transparency.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Anonymous Participation',
      description: 'Participate in fundraising campaigns without revealing your investment amounts to other participants.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Confidential DEX Trading',
      description: 'Trade tokens with complete privacy. Order amounts and balances remain encrypted throughout.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Private Analytics',
      description: 'Access aggregated insights and analytics without compromising individual privacy.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Connect Wallet',
      description: 'Connect your Web3 wallet to access the SecretLaunch platform',
      icon: Users
    },
    {
      step: '02',
      title: 'Browse Campaigns',
      description: 'Discover innovative projects and fundraising campaigns',
      icon: Globe
    },
    {
      step: '03',
      title: 'Invest Privately',
      description: 'Make encrypted investments that remain completely confidential',
      icon: Lock
    },
    {
      step: '04',
      title: 'Track & Trade',
      description: 'Monitor your investments and trade on our confidential DEX',
      icon: TrendingUp
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'DeFi Investor',
      content: 'SecretLaunch revolutionizes fundraising privacy. Finally, I can invest without revealing my portfolio size.',
      avatar: '👨‍💻'
    },
    {
      name: 'Sarah Johnson',
      role: 'Project Founder',
      content: 'The FHE technology allows us to attract institutional investors who value privacy and confidentiality.',
      avatar: '👩‍🚀'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Crypto Trader',
      content: 'The confidential DEX is a game-changer. Trading without revealing order sizes gives me a real edge.',
      avatar: '👨‍💼'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container-max section-padding relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible.hero ? 1 : 0, y: isVisible.hero ? 0 : 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isVisible.hero ? 1 : 0, scale: isVisible.hero ? 1 : 0.8 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-200">Powered by Zama FHE Protocol</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible.hero ? 1 : 0, y: isVisible.hero ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-gradient">Secret</span>
              <span className="text-white">Launch</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible.hero ? 1 : 0, y: isVisible.hero ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
            >
              The first fully confidential fundraising platform using{' '}
              <span className="text-indigo-400 font-semibold">Fully Homomorphic Encryption</span>
              {' '}for anonymous decentralized investments
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible.hero ? 1 : 0, y: isVisible.hero ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link to="/campaigns" className="group">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:shadow-indigo-500/25 transition-all flex items-center space-x-2"
                >
                  <span>Explore Campaigns</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <Link to="/create" className="group">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 hover:border-white/30 transition-all flex items-center space-x-2"
                >
                  <span>Launch Project</span>
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl backdrop-blur-xl border border-white/20 flex items-center justify-center"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 left-10 w-12 h-12 bg-gradient-to-br from-indigo-500/30 to-blue-500/30 rounded-xl backdrop-blur-xl border border-white/20 flex items-center justify-center"
        >
          <Lock className="w-6 h-6 text-white" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="container-max px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible.stats ? 1 : 0, y: isVisible.stats ? 0 : 50 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: 'Total Raised', value: stats.totalRaised, icon: DollarSign, color: 'text-green-400' },
              { label: 'Active Projects', value: stats.activeProjects, icon: Layers, color: 'text-blue-400' },
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
              { label: 'Success Rate', value: stats.successRate, icon: TrendingUp, color: 'text-indigo-400' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isVisible.stats ? 1 : 0, y: isVisible.stats ? 0 : 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 text-center hover:bg-white/15 transition-all"
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible.features ? 1 : 0, y: isVisible.features ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Privacy-First <span className="text-gradient">Features</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of confidential fundraising with cutting-edge FHE technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isVisible.features ? 1 : 0, y: isVisible.features ? 0 : 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="glass rounded-2xl p-8 hover:bg-white/15 transition-all group cursor-pointer"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 relative">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible.howItWorks ? 1 : 0, y: isVisible.howItWorks ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started with confidential fundraising in just four simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: isVisible.howItWorks ? 1 : 0, y: isVisible.howItWorks ? 0 : 30 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Step connector line */}
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-500 to-transparent z-0" />
                  )}
                  
                  <div className="glass rounded-2xl p-8 text-center relative z-10 hover:bg-white/15 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                      {step.step}
                    </div>
                    <Icon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What <span className="text-gradient">Users</span> Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-2xl p-8 hover:bg-white/15 transition-all"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container-max section-padding">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-strong rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience <span className="text-gradient">Private Fundraising</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of investors and projects already using SecretLaunch for confidential fundraising
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/campaigns">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Start Investing
                </motion.button>
              </Link>
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Launch Your Project
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
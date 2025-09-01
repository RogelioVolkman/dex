import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Twitter, 
  Github, 
  MessageCircle, 
  Mail, 
  ExternalLink,
  Heart,
  Zap
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'Campaigns', path: '/campaigns' },
      { name: 'Launch Project', path: '/create' },
      { name: 'DEX Trading', path: '/dex' },
      { name: 'Analytics', path: '/analytics' }
    ],
    resources: [
      { name: 'Documentation', path: '#', external: true },
      { name: 'API Reference', path: '#', external: true },
      { name: 'Whitepaper', path: '#', external: true },
      { name: 'Security Audit', path: '#', external: true }
    ],
    community: [
      { name: 'Discord', path: '#', external: true },
      { name: 'Telegram', path: '#', external: true },
      { name: 'Twitter', path: '#', external: true },
      { name: 'GitHub', path: '#', external: true }
    ],
    legal: [
      { name: 'Privacy Policy', path: '#' },
      { name: 'Terms of Service', path: '#' },
      { name: 'Cookie Policy', path: '#' },
      { name: 'Disclaimer', path: '#' }
    ]
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, url: '#', color: 'hover:text-blue-400' },
    { name: 'GitHub', icon: Github, url: '#', color: 'hover:text-gray-400' },
    { name: 'Discord', icon: MessageCircle, url: '#', color: 'hover:text-purple-400' },
    { name: 'Email', icon: Mail, url: '#', color: 'hover:text-green-400' }
  ];

  const stats = [
    { label: 'Projects Launched', value: '500+' },
    { label: 'Total Value Locked', value: '$25M+' },
    { label: 'Active Users', value: '15K+' }
  ];

  return (
    <footer className="relative border-t border-white/10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {/* Main footer content */}
        <div className="container-max section-padding">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Brand section */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link to="/" className="flex items-center space-x-3 mb-6 group">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <span className="text-2xl font-bold text-gradient">SecretLaunch</span>
                    <div className="text-xs text-gray-400">Powered by Zama FHE</div>
                  </div>
                </Link>

                <p className="text-gray-300 mb-6 leading-relaxed">
                  The world's first fully confidential fundraising platform using Zama's 
                  Fully Homomorphic Encryption for complete investment privacy.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="text-center"
                    >
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Social links */}
                <div className="flex space-x-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-gray-400 ${social.color} transition-colors`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Links sections */}
            <div className="lg:col-span-8">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Platform */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-4">Platform</h3>
                  <ul className="space-y-3">
                    {footerLinks.platform.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.path}
                          className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                        >
                          <span>{link.name}</span>
                          {link.external && (
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Resources */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-4">Resources</h3>
                  <ul className="space-y-3">
                    {footerLinks.resources.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.path}
                          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                        >
                          <span>{link.name}</span>
                          {link.external && (
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Community */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-4">Community</h3>
                  <ul className="space-y-3">
                    {footerLinks.community.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 group"
                        >
                          <span>{link.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Legal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-4">Legal</h3>
                  <ul className="space-y-3">
                    {footerLinks.legal.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.path}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter section */}
        <div className="border-t border-white/10">
          <div className="container-max px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl font-semibold text-white">Stay Updated</h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get the latest updates on new features, security enhancements, and platform developments
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input-field flex-1 w-full sm:w-auto"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary whitespace-nowrap"
                >
                  Subscribe
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10">
          <div className="container-max px-4 py-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
            >
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>&copy; {currentYear} SecretLaunch. All rights reserved.</span>
                <span className="hidden md:block">•</span>
                <span className="hidden md:block">Built with ❤️ for the privacy-focused community</span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>All systems operational</span>
                </div>
                <span>•</span>
                <a 
                  href="#"
                  className="hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Status</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="glass rounded-full px-6 py-2 flex items-center space-x-2 text-sm">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Audited & Secure</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
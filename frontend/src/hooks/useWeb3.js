import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  // State variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkName, setNetworkName] = useState('');

  // Supported networks
  const supportedNetworks = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    31337: 'Localhost',
    8009: 'Zama Devnet'
  };

  // Initialize provider on mount
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Update balance when account or chainId changes
  useEffect(() => {
    if (account && provider) {
      updateBalance();
    }
  }, [account, chainId, provider]);

  // Check if wallet is already connected
  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) return;

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (accounts.length > 0) {
        const signer = await web3Provider.getSigner();
        const network = await web3Provider.getNetwork();
        
        setAccount(accounts[0]);
        setSigner(signer);
        setChainId(Number(network.chainId));
        setNetworkName(supportedNetworks[Number(network.chainId)] || 'Unknown Network');
        setIsConnected(true);
        
        await updateBalance();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Connect wallet
  const connect = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setNetworkName(supportedNetworks[Number(network.chainId)] || 'Unknown Network');
      setIsConnected(true);

      await updateBalance();

      toast.success(`Connected to ${supportedNetworks[Number(network.chainId)] || 'Unknown Network'}`);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.code === -32002) {
        toast.error('Connection request pending. Please check MetaMask');
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setIsConnected(false);
    setNetworkName('');
    
    toast.success('Wallet disconnected');
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      updateBalance();
      toast.success('Account changed');
    }
  }, [account, disconnect]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId) => {
    const numericChainId = parseInt(chainId, 16);
    setChainId(numericChainId);
    setNetworkName(supportedNetworks[numericChainId] || 'Unknown Network');
    
    // Reload the page to reset state (recommended by MetaMask)
    window.location.reload();
  }, [supportedNetworks]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Update balance
  const updateBalance = async () => {
    try {
      if (!provider || !account) return;

      const balance = await provider.getBalance(account);
      const formattedBalance = ethers.formatEther(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added to MetaMask
        await addNetwork(targetChainId);
      } else {
        console.error('Error switching network:', error);
        toast.error('Failed to switch network');
      }
    }
  };

  // Add network to MetaMask
  const addNetwork = async (chainId) => {
    const networkConfigs = {
      11155111: {
        chainId: '0xAA36A7',
        chainName: 'Sepolia Testnet',
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        nativeCurrency: {
          name: 'SepoliaETH',
          symbol: 'ETH',
          decimals: 18
        },
        blockExplorerUrls: ['https://sepolia.etherscan.io/']
      },
      8009: {
        chainId: '0x1F49',
        chainName: 'Zama Devnet',
        rpcUrls: ['https://devnet.zama.ai'],
        nativeCurrency: {
          name: 'ZAMA',
          symbol: 'ZAMA',
          decimals: 18
        },
        blockExplorerUrls: ['https://devnet-explorer.zama.ai/']
      }
    };

    const config = networkConfigs[chainId];
    if (!config) {
      toast.error('Network configuration not found');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config]
      });
    } catch (error) {
      console.error('Error adding network:', error);
      toast.error('Failed to add network');
    }
  };

  // Send transaction
  const sendTransaction = async (transaction) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      const tx = await signer.sendTransaction(transaction);
      toast.success('Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.success('Transaction confirmed!');
      
      // Update balance after transaction
      await updateBalance();
      
      return receipt;
    } catch (error) {
      console.error('Transaction error:', error);
      
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else if (error.code === -32603) {
        toast.error('Internal JSON-RPC error');
      } else {
        toast.error('Transaction failed');
      }
      
      throw error;
    }
  };

  // Sign message
  const signMessage = async (message) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      const signature = await signer.signMessage(message);
      toast.success('Message signed successfully');
      return signature;
    } catch (error) {
      console.error('Signing error:', error);
      
      if (error.code === 4001) {
        toast.error('Signing rejected by user');
      } else {
        toast.error('Failed to sign message');
      }
      
      throw error;
    }
  };

  // Get contract instance
  const getContract = (address, abi) => {
    if (!signer) {
      throw new Error('Signer not available');
    }

    return new ethers.Contract(address, abi, signer);
  };

  // Check if network is supported
  const isNetworkSupported = (chainId) => {
    return Object.keys(supportedNetworks).includes(chainId.toString());
  };

  const contextValue = {
    // State
    provider,
    signer,
    account,
    chainId,
    balance,
    isConnected,
    isConnecting,
    networkName,

    // Methods
    connect,
    disconnect,
    switchNetwork,
    addNetwork,
    sendTransaction,
    signMessage,
    getContract,
    updateBalance,
    isNetworkSupported,

    // Utils
    supportedNetworks
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};
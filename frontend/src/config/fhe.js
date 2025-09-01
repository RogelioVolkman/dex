// Zama FHE Configuration for Sepolia Testnet
export const FHE_CONFIG = {
  // Network Configuration
  CHAIN_ID: 11155111, // Sepolia
  NETWORK_NAME: 'Sepolia',
  
  // Zama FHE Contract Addresses (Sepolia)
  CONTRACTS: {
    FHEVM_EXECUTOR: '0x848B0066793BcC60346Da1F49049357399B8D595',
    ACL: '0x687820221192C5B662b25367F70076A37bc79b6c',
    HCU_LIMIT: '0x594BB474275918AF9609814E68C61B1587c5F838',
    KMS_VERIFIER: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
    INPUT_VERIFIER: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
    DECRYPTION_ORACLE: '0xa02Cda4Ca3a71D7C46997716F4283aa851C28812'
  },
  
  // Service Addresses
  SERVICES: {
    DECRYPTION_ADDRESS: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
    INPUT_VERIFICATION_ADDRESS: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
    RELAYER_URL: 'https://relayer.testnet.zama.cloud'
  },
  
  // FHE Configuration Parameters
  PARAMS: {
    // Maximum encrypted value (64-bit)
    MAX_ENCRYPTED_VALUE: BigInt('18446744073709551615'),
    // Encryption key size
    KEY_SIZE: 2048,
    // Default encryption scheme
    SCHEME: 'TFHE',
    // Precision for decimal values
    PRECISION: 18
  },
  
  // Gas limits for FHE operations
  GAS_LIMITS: {
    ENCRYPT: 500000,
    DECRYPT: 300000,
    HOMOMORPHIC_ADD: 200000,
    HOMOMORPHIC_MUL: 400000,
    COMPARISON: 250000
  }
};

// Utility functions for FHE operations
export const FHE_UTILS = {
  /**
   * Check if the current network supports FHE
   */
  isFHESupported: (chainId) => {
    return chainId === FHE_CONFIG.CHAIN_ID;
  },
  
  /**
   * Get the appropriate gas limit for an FHE operation
   */
  getGasLimit: (operation) => {
    return FHE_CONFIG.GAS_LIMITS[operation.toUpperCase()] || 500000;
  },
  
  /**
   * Format value for encryption
   */
  formatForEncryption: (value, decimals = 18) => {
    if (typeof value === 'string') {
      return BigInt(value);
    }
    if (typeof value === 'number') {
      return BigInt(Math.floor(value * (10 ** decimals)));
    }
    return BigInt(value);
  },
  
  /**
   * Format decrypted value for display
   */
  formatDecryptedValue: (encryptedValue, decimals = 18) => {
    const divisor = BigInt(10 ** decimals);
    const integerPart = encryptedValue / divisor;
    const fractionalPart = encryptedValue % divisor;
    
    if (fractionalPart === 0n) {
      return integerPart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return trimmedFractional.length > 0 
      ? `${integerPart}.${trimmedFractional}`
      : integerPart.toString();
  },
  
  /**
   * Validate encryption input
   */
  validateEncryptionInput: (value) => {
    const bigIntValue = BigInt(value);
    if (bigIntValue < 0n) {
      throw new Error('Encrypted values must be non-negative');
    }
    if (bigIntValue > FHE_CONFIG.PARAMS.MAX_ENCRYPTED_VALUE) {
      throw new Error('Value exceeds maximum encrypted value');
    }
    return true;
  }
};

// Error messages for FHE operations
export const FHE_ERRORS = {
  NETWORK_NOT_SUPPORTED: 'Current network does not support FHE operations',
  ENCRYPTION_FAILED: 'Failed to encrypt value',
  DECRYPTION_FAILED: 'Failed to decrypt value',
  INVALID_PROOF: 'Invalid encryption proof',
  VALUE_TOO_LARGE: 'Value exceeds maximum encrypted value',
  NEGATIVE_VALUE: 'Encrypted values must be non-negative',
  INSUFFICIENT_GAS: 'Insufficient gas for FHE operation',
  ORACLE_UNAVAILABLE: 'Decryption oracle is unavailable'
};

// Default export
export default FHE_CONFIG;
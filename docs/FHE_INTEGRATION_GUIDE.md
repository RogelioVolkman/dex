# Zama FHE Integration Guide for SecretLaunch

## 📋 Overview

SecretLaunch integrates with **Zama's Fully Homomorphic Encryption (FHE)** protocol on Sepolia testnet to provide complete privacy for investment amounts and trading activities.

## 🔧 Configuration

### Environment Variables

The following FHE contract addresses are configured for **Sepolia testnet**:

```env
# Zama FHE Protocol Configuration (Sepolia Testnet)
FHEVM_EXECUTOR_CONTRACT=0x848B0066793BcC60346Da1F49049357399B8D595
ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
HCU_LIMIT_CONTRACT=0x594BB474275918AF9609814E68C61B1587c5F838
KMS_VERIFIER_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
DECRYPTION_ORACLE_CONTRACT=0xa02Cda4Ca3a71D7C46997716F4283aa851C28812
DECRYPTION_ADDRESS=0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1
INPUT_VERIFICATION_ADDRESS=0x7048C39f048125eDa9d678AEbaDfB22F7900a29F
RELAYER_URL=https://relayer.testnet.zama.cloud
```

### Contract Integration

These addresses are integrated into our smart contracts for:
- **Encryption/Decryption**: Encrypting investment amounts and trading data
- **Access Control**: Managing who can decrypt specific data
- **Verification**: Validating encrypted inputs and proofs
- **Oracle Services**: Decrypting aggregated data when needed

## 🚀 Deployment with FHE

### Deploy to Sepolia with FHE Integration

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your Infura/Alchemy URL and private key

# 2. Deploy contracts with FHE integration
npm run deploy:sepolia:fhe

# 3. Verify contracts (optional)
npm run verify
```

### Local Development

```bash
# For local testing without FHE (simulated encryption)
npm run node
npm run deploy:local
npm run frontend
```

## 🔐 FHE Operations in SecretLaunch

### 1. Private Investment Flow

```solidity
// User invests with encrypted amount
function makeConfidentialInvestment(
    uint256 _campaignId,
    inEuint64 calldata _encryptedAmount,
    bytes calldata _inputProof,
    bytes calldata _signature
) external payable nonReentrant {
    // Decrypt only for validation, re-encrypt for storage
    euint64 investmentAmount = FHE.fromExternal(_encryptedAmount, _inputProof);
    
    // Validate encrypted amount matches ETH sent
    ebool amountMatches = FHE.eq(investmentAmount, FHE.asEuint64(msg.value));
    require(FHE.decrypt(amountMatches), "Amount mismatch");
    
    // Store encrypted amount
    campaign.encryptedTotalRaised = FHE.add(
        campaign.encryptedTotalRaised, 
        investmentAmount
    );
}
```

### 2. Confidential DEX Trading

```solidity
// Place encrypted buy order
function placeConfidentialBuyOrder(
    address _tokenAddress,
    inEuint64 calldata _encryptedETHAmount,
    inEuint64 calldata _encryptedMaxPrice,
    bytes calldata _inputProof
) external payable returns (uint256) {
    euint64 ethAmount = FHE.fromExternal(_encryptedETHAmount, _inputProof);
    euint64 maxPrice = FHE.fromExternal(_encryptedMaxPrice, _inputProof);
    
    // Create order with encrypted amounts
    orders[orderId] = ConfidentialOrder({
        encryptedAmount: ethAmount,
        encryptedPrice: maxPrice,
        // ... other fields
    });
}
```

### 3. Homomorphic Analytics

```solidity
// Compute aggregate statistics without revealing individual amounts
function computeHomomorphicSum(
    euint64[] calldata _encryptedValues
) external returns (euint64, bytes32) {
    euint64 sum = FHE.asEuint64(0);
    
    for (uint256 i = 0; i < _encryptedValues.length; i++) {
        sum = FHE.add(sum, _encryptedValues[i]);
    }
    
    return (sum, operationId);
}
```

## 🎯 Key FHE Features Used

### 1. **Encrypted Storage**
- Investment amounts stored as `euint64`
- Order prices and sizes encrypted
- User balances kept confidential

### 2. **Homomorphic Operations**
- Addition: `FHE.add(a, b)` for aggregating investments
- Comparison: `FHE.eq(a, b)` for validation
- Selection: `FHE.select(condition, a, b)` for conditional logic

### 3. **Controlled Decryption**
- Oracle-based decryption for campaign totals
- Time-locked decryption for completed campaigns
- Access-controlled decryption for authorized parties

### 4. **Proof System**
- Range proofs for investment limits
- Zero-knowledge proofs for compliance
- Input verification for encrypted data

## 📊 Frontend Integration

### FHE Configuration

```javascript
// Frontend FHE configuration
import { FHE_CONFIG } from './config/fhe.js';

// Check if FHE is supported
if (FHE_CONFIG.isFHESupported(chainId)) {
    // Initialize FHE client
    await initFHE();
}
```

### Encryption in Frontend

```javascript
// Encrypt investment amount before sending
const encryptedAmount = await fhevm.encrypt64(investmentAmount);

// Send encrypted investment
await contract.makeConfidentialInvestment(
    campaignId,
    encryptedAmount,
    proof,
    signature,
    { value: investmentAmount }
);
```

## 🛡️ Security Considerations

### 1. **Encryption Security**
- All sensitive values encrypted using Zama's TFHE scheme
- 64-bit encryption provides sufficient range for financial data
- Keys managed by Zama's key management system

### 2. **Access Control**
- ACL contract manages decryption permissions
- Only authorized parties can decrypt specific data
- Time-based access controls for campaign phases

### 3. **Proof Verification**
- All encrypted inputs verified with zero-knowledge proofs
- Range proofs ensure values within expected bounds
- Input verifier contract validates all proofs

### 4. **Oracle Security**
- Decryption oracle provides secure threshold decryption
- Multiple validators required for decryption
- Audit trail for all decryption requests

## 🔧 Development Tools

### Testing FHE Operations

```bash
# Run FHE-specific tests
npm run test:fhe

# Test with gas reporting
npm run test:gas
```

### Debugging FHE

```javascript
// Enable FHE debugging in frontend
const FHE_DEBUG = process.env.REACT_APP_DEBUG_MODE === 'true';

if (FHE_DEBUG) {
    console.log('FHE Operation:', operation, result);
}
```

## 📈 Performance Considerations

### Gas Costs
- **Encryption**: ~500K gas per operation
- **Homomorphic Add**: ~200K gas
- **Comparison**: ~250K gas
- **Decryption Request**: ~300K gas

### Optimization Tips
1. **Batch Operations**: Combine multiple FHE operations
2. **Cache Encrypted Values**: Avoid re-encryption
3. **Lazy Decryption**: Only decrypt when necessary
4. **Gas Estimation**: Use proper gas limits for FHE ops

## 🌐 Network Support

### Current Support
- ✅ **Sepolia Testnet**: Full FHE support with provided contracts
- ⏳ **Mainnet**: Coming soon with Zama mainnet launch
- 🔄 **Local Development**: Simulated FHE for testing

### Adding New Networks
1. Get FHE contract addresses for target network
2. Update `hardhat.config.js` with network FHE config
3. Update frontend `fhe.js` configuration
4. Test deployment with `deploy:sepolia:fhe` pattern

## 📚 Additional Resources

- **Zama Documentation**: https://docs.zama.ai/fhevm
- **TFHE Library**: https://github.com/zama-ai/tfhe-rs
- **FHE Examples**: https://github.com/zama-ai/fhevm-contracts
- **Sepolia Testnet**: https://sepolia.etherscan.io/

## 🆘 Troubleshooting

### Common Issues

1. **"Network not supported"**
   - Ensure you're connected to Sepolia (Chain ID: 11155111)
   - Verify FHE contract addresses in configuration

2. **"Encryption failed"**
   - Check input values are within valid range (0 to 2^64-1)
   - Verify FHE client initialization

3. **"Gas estimation failed"**
   - Use higher gas limits for FHE operations
   - Check network congestion and gas prices

4. **"Decryption timeout"**
   - Oracle operations can take 30-60 seconds
   - Implement proper loading states in frontend

### Getting Help

- **Discord**: Join Zama community for FHE support
- **GitHub Issues**: Report bugs in SecretLaunch repository
- **Documentation**: Check Zama FHE documentation for protocol details

---

**🔐 SecretLaunch with Zama FHE - Complete Privacy for Decentralized Fundraising**
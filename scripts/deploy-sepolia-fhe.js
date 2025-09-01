const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SecretLaunch to Sepolia with Zama FHE integration...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Verify we're on Sepolia
  if (network.chainId !== 11155111n) {
    throw new Error("This script is only for Sepolia testnet (Chain ID: 11155111)");
  }

  // FHE Contract addresses (from environment or defaults)
  const fheConfig = {
    executor: process.env.FHEVM_EXECUTOR_CONTRACT || "0x848B0066793BcCC60346Da1F49049357399B8D595",
    acl: process.env.ACL_CONTRACT || "0x687820221192C5B662b25367F70076A37bc79b6c",
    kmsVerifier: process.env.KMS_VERIFIER_CONTRACT || "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
    inputVerifier: process.env.INPUT_VERIFIER_CONTRACT || "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
    decryptionOracle: process.env.DECRYPTION_ORACLE_CONTRACT || "0xa02Cda4Ca3a71D7C46997716F4283aa851C28812",
    decryptionAddress: process.env.DECRYPTION_ADDRESS || "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
    relayerUrl: process.env.RELAYER_URL || "https://relayer.testnet.zama.cloud"
  };

  console.log("📋 Using Zama FHE Configuration:");
  console.log("  Executor:", fheConfig.executor);
  console.log("  ACL:", fheConfig.acl);
  console.log("  KMS Verifier:", fheConfig.kmsVerifier);
  console.log("  Input Verifier:", fheConfig.inputVerifier);
  console.log("  Decryption Oracle:", fheConfig.decryptionOracle);
  console.log("  Relayer URL:", fheConfig.relayerUrl);
  console.log();

  // Track deployment
  const deployments = {
    network: "sepolia",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    fheConfig: fheConfig,
    contracts: {}
  };

  try {
    // 1. Deploy FHEHelpers
    console.log("📦 Deploying FHEHelpers...");
    const FHEHelpers = await ethers.getContractFactory("FHEHelpers");
    const fheHelpers = await FHEHelpers.deploy();
    await fheHelpers.waitForDeployment();
    
    const fheHelpersAddress = await fheHelpers.getAddress();
    deployments.contracts.fheHelpers = {
      address: fheHelpersAddress,
      txHash: fheHelpers.deploymentTransaction().hash
    };
    console.log("✅ FHEHelpers deployed to:", fheHelpersAddress);

    // 2. Deploy MockToken
    console.log("\n📦 Deploying MockToken...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "SecretLaunch Test Token",
      "SLT",
      18,
      ethers.parseEther("1000000"), // 1M tokens
      deployer.address
    );
    await mockToken.waitForDeployment();
    
    const mockTokenAddress = await mockToken.getAddress();
    deployments.contracts.mockToken = {
      address: mockTokenAddress,
      txHash: mockToken.deploymentTransaction().hash,
      name: "SecretLaunch Test Token",
      symbol: "SLT"
    };
    console.log("✅ MockToken deployed to:", mockTokenAddress);

    // 3. Deploy SecretLaunchFHE
    console.log("\n📦 Deploying SecretLaunchFHE...");
    const SecretLaunchFHE = await ethers.getContractFactory("SecretLaunchFHE");
    const secretLaunchFHE = await SecretLaunchFHE.deploy(
      deployer.address, // treasury
      deployer.address  // emergency
    );
    await secretLaunchFHE.waitForDeployment();
    
    const secretLaunchAddress = await secretLaunchFHE.getAddress();
    deployments.contracts.secretLaunchFHE = {
      address: secretLaunchAddress,
      txHash: secretLaunchFHE.deploymentTransaction().hash
    };
    console.log("✅ SecretLaunchFHE deployed to:", secretLaunchAddress);

    // 4. Deploy ConfidentialDEX
    console.log("\n📦 Deploying ConfidentialDEX...");
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const confidentialDEX = await ConfidentialDEX.deploy(
      deployer.address, // fee collector
      deployer.address  // liquidity manager
    );
    await confidentialDEX.waitForDeployment();
    
    const dexAddress = await confidentialDEX.getAddress();
    deployments.contracts.confidentialDEX = {
      address: dexAddress,
      txHash: confidentialDEX.deploymentTransaction().hash
    };
    console.log("✅ ConfidentialDEX deployed to:", dexAddress);

    // 5. Setup initial configuration
    console.log("\n⚙️ Setting up initial configuration...");
    
    // Add MockToken to DEX
    console.log("Adding MockToken to DEX...");
    const addTokenTx = await confidentialDEX.addTradingPair(
      mockTokenAddress,
      30, // 0.3% trading fee
      25  // 0.25% liquidity fee
    );
    await addTokenTx.wait();
    console.log("✅ MockToken added to DEX");

    // 6. Save deployment information
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, "sepolia-deployment.json");
    fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
    console.log(`\n📝 Deployment info saved to: ${deploymentFile}`);

    // 7. Generate frontend configuration
    const frontendConfig = {
      networkId: Number(network.chainId),
      networkName: "Sepolia",
      fhe: fheConfig,
      contracts: {
        SecretLaunchFHE: {
          address: secretLaunchAddress,
          abi: "SecretLaunchFHE"
        },
        ConfidentialDEX: {
          address: dexAddress,
          abi: "ConfidentialDEX"
        },
        FHEHelpers: {
          address: fheHelpersAddress,
          abi: "FHEHelpers"
        },
        MockToken: {
          address: mockTokenAddress,
          abi: "MockToken"
        }
      }
    };

    // Ensure frontend config directory exists
    const frontendConfigDir = path.join(__dirname, "..", "frontend", "src", "config");
    if (!fs.existsSync(frontendConfigDir)) {
      fs.mkdirSync(frontendConfigDir, { recursive: true });
    }

    const frontendConfigFile = path.join(frontendConfigDir, "contracts.json");
    fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
    console.log(`📝 Frontend config saved to: ${frontendConfigFile}`);

    // 8. Display summary
    console.log("\n" + "=".repeat(80));
    console.log("🎉 SEPOLIA DEPLOYMENT COMPLETE!");
    console.log("=".repeat(80));
    console.log(`Network: Sepolia (${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Timestamp: ${deployments.timestamp}`);
    
    console.log("\n📋 Contract Addresses:");
    console.log(`SecretLaunchFHE: ${secretLaunchAddress}`);
    console.log(`ConfidentialDEX: ${dexAddress}`);
    console.log(`FHEHelpers: ${fheHelpersAddress}`);
    console.log(`MockToken (SLT): ${mockTokenAddress}`);
    
    console.log("\n🔗 Zama FHE Integration:");
    console.log(`Executor: ${fheConfig.executor}`);
    console.log(`ACL: ${fheConfig.acl}`);
    console.log(`Decryption Oracle: ${fheConfig.decryptionOracle}`);
    console.log(`Relayer: ${fheConfig.relayerUrl}`);
    
    console.log("\n✨ Next Steps:");
    console.log("1. Verify contracts: npm run verify");
    console.log("2. Test FHE operations on frontend");
    console.log("3. Create sample campaigns with encrypted data");
    console.log("4. Set up monitoring and alerts");
    
    console.log("\n🔐 SecretLaunch with FHE is ready on Sepolia!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    
    // Save partial deployment for debugging
    if (Object.keys(deployments.contracts).length > 0) {
      const failedFile = path.join(__dirname, "..", "deployments", "sepolia-failed-deployment.json");
      fs.writeFileSync(failedFile, JSON.stringify(deployments, null, 2));
      console.log(`📝 Partial deployment saved to: ${failedFile}`);
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SecretLaunch Ecosystem...\n");

  // Get signers
  const [deployer, treasury, emergency] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Track deployment addresses
  const deployments = {
    network: network.name,
    deployer: deployer.address,
    treasury: treasury.address,
    emergency: emergency.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy FHEHelpers
    console.log("📦 Deploying FHEHelpers...");
    const FHEHelpers = await ethers.getContractFactory("FHEHelpers");
    const fheHelpers = await FHEHelpers.deploy();
    await fheHelpers.waitForDeployment();
    
    deployments.contracts.fheHelpers = {
      address: await fheHelpers.getAddress(),
      txHash: fheHelpers.deploymentTransaction().hash
    };
    console.log("✅ FHEHelpers deployed to:", await fheHelpers.getAddress());

    // 2. Deploy MockToken for testing
    console.log("\n📦 Deploying MockToken...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "SecretLaunch Test Token",
      "SLT",
      18,
      ethers.parseEther("1000000"), // 1M tokens
      treasury.address
    );
    await mockToken.waitForDeployment();
    
    deployments.contracts.mockToken = {
      address: await mockToken.getAddress(),
      txHash: mockToken.deploymentTransaction().hash,
      name: "SecretLaunch Test Token",
      symbol: "SLT"
    };
    console.log("✅ MockToken deployed to:", await mockToken.getAddress());

    // 3. Deploy SecretLaunchFHE
    console.log("\n📦 Deploying SecretLaunchFHE...");
    const SecretLaunchFHE = await ethers.getContractFactory("SecretLaunchFHE");
    const secretLaunchFHE = await SecretLaunchFHE.deploy(
      treasury.address,
      emergency.address
    );
    await secretLaunchFHE.waitForDeployment();
    
    deployments.contracts.secretLaunchFHE = {
      address: await secretLaunchFHE.getAddress(),
      txHash: secretLaunchFHE.deploymentTransaction().hash
    };
    console.log("✅ SecretLaunchFHE deployed to:", await secretLaunchFHE.getAddress());

    // 4. Deploy ConfidentialDEX
    console.log("\n📦 Deploying ConfidentialDEX...");
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const confidentialDEX = await ConfidentialDEX.deploy(
      treasury.address, // fee collector
      treasury.address  // liquidity manager
    );
    await confidentialDEX.waitForDeployment();
    
    deployments.contracts.confidentialDEX = {
      address: await confidentialDEX.getAddress(),
      txHash: confidentialDEX.deploymentTransaction().hash
    };
    console.log("✅ ConfidentialDEX deployed to:", await confidentialDEX.getAddress());

    // 5. Setup initial configuration
    console.log("\n⚙️  Setting up initial configuration...");
    
    // Add MockToken to DEX
    console.log("Adding MockToken to DEX trading pairs...");
    const addTokenTx = await confidentialDEX.addTradingPair(
      await mockToken.getAddress(),
      30,  // 0.3% trading fee
      25   // 0.25% liquidity fee
    );
    await addTokenTx.wait();
    console.log("✅ MockToken added to DEX");

    // Mint additional tokens for testing
    console.log("Minting additional test tokens...");
    const mintTx = await mockToken.connect(treasury).mint(
      deployer.address,
      ethers.parseEther("100000") // 100K tokens for deployer
    );
    await mintTx.wait();
    console.log("✅ Additional tokens minted");

    // 6. Save deployment information
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
    console.log(`\n📝 Deployment info saved to: ${deploymentFile}`);

    // 7. Generate frontend config
    const frontendConfig = {
      networkId: network.config.chainId,
      networkName: network.name,
      contracts: {
        SecretLaunchFHE: {
          address: await secretLaunchFHE.getAddress(),
          abi: "SecretLaunchFHE" // Reference to ABI file
        },
        ConfidentialDEX: {
          address: await confidentialDEX.getAddress(),
          abi: "ConfidentialDEX"
        },
        FHEHelpers: {
          address: await fheHelpers.getAddress(),
          abi: "FHEHelpers"
        },
        MockToken: {
          address: await mockToken.getAddress(),
          abi: "MockToken"
        }
      }
    };

    const frontendConfigFile = path.join(__dirname, "..", "frontend", "src", "config", "contracts.json");
    const configDir = path.dirname(frontendConfigFile);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
    console.log(`📝 Frontend config saved to: ${frontendConfigFile}`);

    // 8. Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`Network: ${network.name}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Treasury: ${treasury.address}`);
    console.log(`Emergency: ${emergency.address}`);
    console.log("\n📋 Contract Addresses:");
    console.log(`FHEHelpers: ${await fheHelpers.getAddress()}`);
    console.log(`MockToken: ${await mockToken.getAddress()}`);
    console.log(`SecretLaunchFHE: ${await secretLaunchFHE.getAddress()}`);
    console.log(`ConfidentialDEX: ${await confidentialDEX.getAddress()}`);
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend with contract addresses");
    console.log("2. Verify contracts on block explorer (if on testnet/mainnet)");
    console.log("3. Set up monitoring and alerting");
    console.log("4. Configure multisig for treasury operations");
    console.log("\n✨ SecretLaunch ecosystem is ready!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    
    // Save partial deployment info for debugging
    if (Object.keys(deployments.contracts).length > 0) {
      const failedDeploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-failed-deployment.json`);
      fs.writeFileSync(failedDeploymentFile, JSON.stringify(deployments, null, 2));
      console.log(`📝 Partial deployment info saved to: ${failedDeploymentFile}`);
    }
    
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
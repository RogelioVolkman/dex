const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SecretLaunchFHEModule", (m) => {
  // Parameters
  const treasuryAddress = m.getParameter("treasuryAddress", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const emergencyAddress = m.getParameter("emergencyAddress", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  // Deploy FHE Helpers first
  const fheHelpers = m.contract("FHEHelpers");

  // Deploy Mock Token for testing
  const mockToken = m.contract("MockToken", [
    "SecretLaunch Test Token",
    "SLT",
    18,
    m.getParameter("initialSupply", "1000000000000000000000000"), // 1M tokens
    treasuryAddress
  ]);

  // Deploy main SecretLaunchFHE contract
  const secretLaunchFHE = m.contract("SecretLaunchFHE", [
    treasuryAddress,
    emergencyAddress
  ]);

  // Deploy Confidential DEX
  const confidentialDEX = m.contract("ConfidentialDEX", [
    treasuryAddress, // fee collector
    treasuryAddress  // liquidity manager
  ]);

  // Return deployed contracts
  return {
    fheHelpers,
    mockToken,
    secretLaunchFHE,
    confidentialDEX,
    treasuryAddress,
    emergencyAddress
  };
});
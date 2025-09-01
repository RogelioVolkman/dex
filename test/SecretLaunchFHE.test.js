const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SecretLaunchFHE", function () {
  // Deployment fixture
  async function deploySecretLaunchFHEFixture() {
    const [owner, treasury, emergency, user1, user2] = await ethers.getSigners();

    // Deploy FHE Helpers
    const FHEHelpers = await ethers.getContractFactory("FHEHelpers");
    const fheHelpers = await FHEHelpers.deploy();

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "Test Token",
      "TEST",
      18,
      ethers.parseEther("1000000"),
      owner.address
    );

    // Deploy SecretLaunchFHE
    const SecretLaunchFHE = await ethers.getContractFactory("SecretLaunchFHE");
    const secretLaunchFHE = await SecretLaunchFHE.deploy(
      treasury.address,
      emergency.address
    );

    return {
      secretLaunchFHE,
      mockToken,
      fheHelpers,
      owner,
      treasury,
      emergency,
      user1,
      user2
    };
  }

  describe("Deployment", function () {
    it("Should set the correct treasury and emergency addresses", async function () {
      const { secretLaunchFHE, treasury, emergency } = await loadFixture(deploySecretLaunchFHEFixture);

      expect(await secretLaunchFHE.treasuryAddress()).to.equal(treasury.address);
      expect(await secretLaunchFHE.emergencyAddress()).to.equal(emergency.address);
    });

    it("Should set the correct platform fee", async function () {
      const { secretLaunchFHE } = await loadFixture(deploySecretLaunchFHEFixture);

      expect(await secretLaunchFHE.platformFeeBasisPoints()).to.equal(300); // 3%
    });

    it("Should initialize nextCampaignId to 1", async function () {
      const { secretLaunchFHE } = await loadFixture(deploySecretLaunchFHEFixture);

      expect(await secretLaunchFHE.nextCampaignId()).to.equal(1);
    });
  });

  describe("Campaign Creation", function () {
    it("Should create a new campaign successfully", async function () {
      const { secretLaunchFHE, mockToken, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      // Approve tokens for the campaign
      const totalSupply = ethers.parseEther("100000");
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply);

      const campaignParams = [
        await mockToken.getAddress(), // tokenContract
        "Test Project",               // projectName
        "TEST",                      // projectSymbol
        totalSupply,                 // totalTokenSupply
        ethers.parseEther("50000"),  // privateSaleTarget
        ethers.parseEther("100000"), // publicSaleTarget
        ethers.parseEther("0.05"),   // privateSalePrice
        ethers.parseEther("0.08"),   // publicSalePrice
        7 * 24 * 3600,              // privateDuration (7 days)
        14 * 24 * 3600,             // publicDuration (14 days)
        ethers.parseEther("100"),    // minPrivateInvestment
        ethers.parseEther("10000"),  // maxPrivateInvestment
        ethers.parseEther("50"),     // minPublicInvestment
        ethers.parseEther("5000"),   // maxPublicInvestment
        25,                         // dexLiquidityPercentage
        "QmTestHash"                // metadataHash
      ];

      await expect(secretLaunchFHE.launchCampaign(...campaignParams))
        .to.emit(secretLaunchFHE, "CampaignLaunched")
        .withArgs(1, owner.address, "Test Project", ethers.parseEther("50000"), ethers.parseEther("100000"));

      // Check campaign details
      const campaign = await secretLaunchFHE.getCampaign(1);
      expect(campaign.campaignId).to.equal(1);
      expect(campaign.creator).to.equal(owner.address);
      expect(campaign.projectName).to.equal("Test Project");
    });

    it("Should fail with invalid parameters", async function () {
      const { secretLaunchFHE, mockToken } = await loadFixture(deploySecretLaunchFHEFixture);

      // Test with zero address
      await expect(
        secretLaunchFHE.launchCampaign(
          ethers.ZeroAddress, // invalid token address
          "Test Project",
          "TEST",
          ethers.parseEther("100000"),
          ethers.parseEther("50000"),
          ethers.parseEther("100000"),
          ethers.parseEther("0.05"),
          ethers.parseEther("0.08"),
          7 * 24 * 3600,
          14 * 24 * 3600,
          ethers.parseEther("100"),
          ethers.parseEther("10000"),
          ethers.parseEther("50"),
          ethers.parseEther("5000"),
          25,
          "QmTestHash"
        )
      ).to.be.revertedWith("SecretLaunch: Invalid token contract");
    });

    it("Should increment campaign ID for multiple campaigns", async function () {
      const { secretLaunchFHE, mockToken, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      const totalSupply = ethers.parseEther("100000");
      await mockToken.mint(owner.address, totalSupply); // Mint additional tokens
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply * 2n);

      const campaignParams = [
        await mockToken.getAddress(),
        "Test Project",
        "TEST",
        totalSupply,
        ethers.parseEther("50000"),
        ethers.parseEther("100000"),
        ethers.parseEther("0.05"),
        ethers.parseEther("0.08"),
        7 * 24 * 3600,
        14 * 24 * 3600,
        ethers.parseEther("100"),
        ethers.parseEther("10000"),
        ethers.parseEther("50"),
        ethers.parseEther("5000"),
        25,
        "QmTestHash"
      ];

      // Create first campaign
      await secretLaunchFHE.launchCampaign(...campaignParams);
      expect(await secretLaunchFHE.nextCampaignId()).to.equal(2);

      // Create second campaign
      campaignParams[1] = "Test Project 2"; // Change project name
      await secretLaunchFHE.launchCampaign(...campaignParams);
      expect(await secretLaunchFHE.nextCampaignId()).to.equal(3);
    });
  });

  describe("Active Campaigns", function () {
    it("Should return active campaigns", async function () {
      const { secretLaunchFHE, mockToken, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      // Create a campaign first
      const totalSupply = ethers.parseEther("100000");
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply);

      const campaignParams = [
        await mockToken.getAddress(),
        "Test Project",
        "TEST",
        totalSupply,
        ethers.parseEther("50000"),
        ethers.parseEther("100000"),
        ethers.parseEther("0.05"),
        ethers.parseEther("0.08"),
        7 * 24 * 3600,
        14 * 24 * 3600,
        ethers.parseEther("100"),
        ethers.parseEther("10000"),
        ethers.parseEther("50"),
        ethers.parseEther("5000"),
        25,
        "QmTestHash"
      ];

      await secretLaunchFHE.launchCampaign(...campaignParams);

      const activeCampaigns = await secretLaunchFHE.getActiveCampaigns();
      expect(activeCampaigns.length).to.equal(1);
      expect(activeCampaigns[0]).to.equal(1);
    });
  });

  describe("Phase Transitions", function () {
    it("Should transition campaign phases correctly", async function () {
      const { secretLaunchFHE, mockToken, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      // Create campaign
      const totalSupply = ethers.parseEther("100000");
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply);

      const campaignParams = [
        await mockToken.getAddress(),
        "Test Project",
        "TEST",
        totalSupply,
        ethers.parseEther("50000"),
        ethers.parseEther("100000"),
        ethers.parseEther("0.05"),
        ethers.parseEther("0.08"),
        7 * 24 * 3600,
        14 * 24 * 3600,
        ethers.parseEther("100"),
        ethers.parseEther("10000"),
        ethers.parseEther("50"),
        ethers.parseEther("5000"),
        25,
        "QmTestHash"
      ];

      await secretLaunchFHE.launchCampaign(...campaignParams);

      // Initial phase should be Preparation (0)
      const initialCampaign = await secretLaunchFHE.getCampaign(1);
      expect(initialCampaign.currentPhase).to.equal(0); // CampaignPhase.Preparation
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency cancel campaign", async function () {
      const { secretLaunchFHE, mockToken, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      // Create campaign
      const totalSupply = ethers.parseEther("100000");
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply);

      const campaignParams = [
        await mockToken.getAddress(),
        "Test Project",
        "TEST",
        totalSupply,
        ethers.parseEther("50000"),
        ethers.parseEther("100000"),
        ethers.parseEther("0.05"),
        ethers.parseEther("0.08"),
        7 * 24 * 3600,
        14 * 24 * 3600,
        ethers.parseEther("100"),
        ethers.parseEther("10000"),
        ethers.parseEther("50"),
        ethers.parseEther("5000"),
        25,
        "QmTestHash"
      ];

      await secretLaunchFHE.launchCampaign(...campaignParams);

      // Emergency cancel
      await expect(secretLaunchFHE.emergencyCancelCampaign(1))
        .to.emit(secretLaunchFHE, "PhaseTransitioned");

      const campaign = await secretLaunchFHE.getCampaign(1);
      expect(campaign.isActive).to.equal(false);
    });

    it("Should not allow non-owner to emergency cancel", async function () {
      const { secretLaunchFHE, mockToken, user1, owner } = await loadFixture(deploySecretLaunchFHEFixture);

      // Create campaign
      const totalSupply = ethers.parseEther("100000");
      await mockToken.approve(await secretLaunchFHE.getAddress(), totalSupply);

      const campaignParams = [
        await mockToken.getAddress(),
        "Test Project",
        "TEST",
        totalSupply,
        ethers.parseEther("50000"),
        ethers.parseEther("100000"),
        ethers.parseEther("0.05"),
        ethers.parseEther("0.08"),
        7 * 24 * 3600,
        14 * 24 * 3600,
        ethers.parseEther("100"),
        ethers.parseEther("10000"),
        ethers.parseEther("50"),
        ethers.parseEther("5000"),
        25,
        "QmTestHash"
      ];

      await secretLaunchFHE.launchCampaign(...campaignParams);

      // Try to emergency cancel from non-owner
      await expect(secretLaunchFHE.connect(user1).emergencyCancelCampaign(1))
        .to.be.revertedWithCustomError(secretLaunchFHE, "OwnableUnauthorizedAccount");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const { secretLaunchFHE } = await loadFixture(deploySecretLaunchFHEFixture);

      const newFee = 500; // 5%
      await secretLaunchFHE.updatePlatformFee(newFee);
      expect(await secretLaunchFHE.platformFeeBasisPoints()).to.equal(newFee);
    });

    it("Should not allow fee above maximum", async function () {
      const { secretLaunchFHE } = await loadFixture(deploySecretLaunchFHEFixture);

      const maxFee = 1600; // 16% (above MAX_FEE_BASIS_POINTS = 15%)
      await expect(secretLaunchFHE.updatePlatformFee(maxFee))
        .to.be.revertedWith("SecretLaunch: Fee too high");
    });

    it("Should not allow non-owner to update fee", async function () {
      const { secretLaunchFHE, user1 } = await loadFixture(deploySecretLaunchFHEFixture);

      await expect(secretLaunchFHE.connect(user1).updatePlatformFee(400))
        .to.be.revertedWithCustomError(secretLaunchFHE, "OwnableUnauthorizedAccount");
    });
  });

  describe("Treasury Management", function () {
    it("Should allow owner to update treasury address", async function () {
      const { secretLaunchFHE, user1 } = await loadFixture(deploySecretLaunchFHEFixture);

      await secretLaunchFHE.updateTreasuryAddress(user1.address);
      expect(await secretLaunchFHE.treasuryAddress()).to.equal(user1.address);
    });

    it("Should not allow zero address as treasury", async function () {
      const { secretLaunchFHE } = await loadFixture(deploySecretLaunchFHEFixture);

      await expect(secretLaunchFHE.updateTreasuryAddress(ethers.ZeroAddress))
        .to.be.revertedWith("SecretLaunch: Invalid address");
    });
  });
});
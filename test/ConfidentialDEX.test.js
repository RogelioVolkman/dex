const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ConfidentialDEX", function () {
  // Deployment fixture
  async function deployConfidentialDEXFixture() {
    const [owner, feeCollector, liquidityManager, trader1, trader2] = await ethers.getSigners();

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "Test Token",
      "TEST",
      18,
      ethers.parseEther("1000000"),
      owner.address
    );

    // Deploy ConfidentialDEX
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const confidentialDEX = await ConfidentialDEX.deploy(
      feeCollector.address,
      liquidityManager.address
    );

    return {
      confidentialDEX,
      mockToken,
      owner,
      feeCollector,
      liquidityManager,
      trader1,
      trader2
    };
  }

  describe("Deployment", function () {
    it("Should set the correct fee collector and liquidity manager", async function () {
      const { confidentialDEX, feeCollector, liquidityManager } = await loadFixture(deployConfidentialDEXFixture);

      expect(await confidentialDEX.feeCollector()).to.equal(feeCollector.address);
      expect(await confidentialDEX.liquidityManager()).to.equal(liquidityManager.address);
    });

    it("Should set the correct default fees", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      expect(await confidentialDEX.defaultTradingFeeBasisPoints()).to.equal(30); // 0.3%
      expect(await confidentialDEX.defaultLiquidityFeeBasisPoints()).to.equal(25); // 0.25%
    });

    it("Should initialize nextOrderId to 1", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      expect(await confidentialDEX.nextOrderId()).to.equal(1);
    });
  });

  describe("Trading Pair Management", function () {
    it("Should add a new trading pair successfully", async function () {
      const { confidentialDEX, mockToken, owner } = await loadFixture(deployConfidentialDEXFixture);

      await expect(confidentialDEX.addTradingPair(
        await mockToken.getAddress(),
        30, // 0.3% trading fee
        25  // 0.25% liquidity fee
      ))
        .to.emit(confidentialDEX, "TradingPairAdded")
        .withArgs(await mockToken.getAddress(), 30, 25);

      // Check if token is in supported tokens
      const supportedTokens = await confidentialDEX.getSupportedTokens();
      expect(supportedTokens.length).to.equal(1);
      expect(supportedTokens[0]).to.equal(await mockToken.getAddress());
    });

    it("Should fail to add trading pair with invalid parameters", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      // Test with zero address
      await expect(
        confidentialDEX.addTradingPair(ethers.ZeroAddress, 30, 25)
      ).to.be.revertedWith("ConfidentialDEX: Invalid token address");

      // Test with fees too high
      await expect(
        confidentialDEX.addTradingPair(
          "0x1234567890123456789012345678901234567890",
          150, // 1.5% (above MAX_FEE_BASIS_POINTS = 1%)
          25
        )
      ).to.be.revertedWith("ConfidentialDEX: Fees too high");
    });

    it("Should not allow duplicate trading pairs", async function () {
      const { confidentialDEX, mockToken } = await loadFixture(deployConfidentialDEXFixture);

      // Add first pair
      await confidentialDEX.addTradingPair(await mockToken.getAddress(), 30, 25);

      // Try to add same pair again
      await expect(
        confidentialDEX.addTradingPair(await mockToken.getAddress(), 30, 25)
      ).to.be.revertedWith("ConfidentialDEX: Pair already exists");
    });
  });

  describe("Token Deposits", function () {
    it("Should allow users to deposit tokens", async function () {
      const { confidentialDEX, mockToken, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      // Add trading pair first
      await confidentialDEX.addTradingPair(await mockToken.getAddress(), 30, 25);

      // Mint tokens to trader and approve
      const depositAmount = ethers.parseEther("1000");
      await mockToken.mint(trader1.address, depositAmount);
      await mockToken.connect(trader1).approve(await confidentialDEX.getAddress(), depositAmount);

      // Deposit tokens
      await confidentialDEX.connect(trader1).depositTokens(await mockToken.getAddress(), depositAmount);

      // Check token transfer happened
      expect(await mockToken.balanceOf(await confidentialDEX.getAddress())).to.equal(depositAmount);
    });

    it("Should fail to deposit tokens for unsupported token", async function () {
      const { confidentialDEX, mockToken, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      const depositAmount = ethers.parseEther("1000");
      await mockToken.mint(trader1.address, depositAmount);
      await mockToken.connect(trader1).approve(await confidentialDEX.getAddress(), depositAmount);

      // Try to deposit without adding trading pair
      await expect(
        confidentialDEX.connect(trader1).depositTokens(await mockToken.getAddress(), depositAmount)
      ).to.be.revertedWith("ConfidentialDEX: Token not supported");
    });

    it("Should fail to deposit zero amount", async function () {
      const { confidentialDEX, mockToken, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      // Add trading pair first
      await confidentialDEX.addTradingPair(await mockToken.getAddress(), 30, 25);

      await expect(
        confidentialDEX.connect(trader1).depositTokens(await mockToken.getAddress(), 0)
      ).to.be.revertedWith("ConfidentialDEX: Invalid amount");
    });
  });

  describe("Order Management", function () {
    it("Should return user orders", async function () {
      const { confidentialDEX, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      // Initially should return empty array
      const userOrders = await confidentialDEX.getUserOrders(trader1.address);
      expect(userOrders.length).to.equal(0);
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update fee collector", async function () {
      const { confidentialDEX, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      await confidentialDEX.updateFeeCollector(trader1.address);
      expect(await confidentialDEX.feeCollector()).to.equal(trader1.address);
    });

    it("Should not allow zero address as fee collector", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      await expect(confidentialDEX.updateFeeCollector(ethers.ZeroAddress))
        .to.be.revertedWith("ConfidentialDEX: Invalid address");
    });

    it("Should allow owner to update default fees", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      const newTradingFee = 50; // 0.5%
      const newLiquidityFee = 40; // 0.4%

      await confidentialDEX.updateDefaultFees(newTradingFee, newLiquidityFee);

      expect(await confidentialDEX.defaultTradingFeeBasisPoints()).to.equal(newTradingFee);
      expect(await confidentialDEX.defaultLiquidityFeeBasisPoints()).to.equal(newLiquidityFee);
    });

    it("Should not allow fees above maximum", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      await expect(confidentialDEX.updateDefaultFees(150, 25)) // 1.5% trading fee (above 1% max)
        .to.be.revertedWith("ConfidentialDEX: Fees too high");

      await expect(confidentialDEX.updateDefaultFees(50, 150)) // 1.5% liquidity fee (above 1% max)
        .to.be.revertedWith("ConfidentialDEX: Fees too high");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add trading pairs", async function () {
      const { confidentialDEX, mockToken, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      await expect(
        confidentialDEX.connect(trader1).addTradingPair(await mockToken.getAddress(), 30, 25)
      ).to.be.revertedWithCustomError(confidentialDEX, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update fee collector", async function () {
      const { confidentialDEX, trader1, trader2 } = await loadFixture(deployConfidentialDEXFixture);

      await expect(
        confidentialDEX.connect(trader1).updateFeeCollector(trader2.address)
      ).to.be.revertedWithCustomError(confidentialDEX, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to update default fees", async function () {
      const { confidentialDEX, trader1 } = await loadFixture(deployConfidentialDEXFixture);

      await expect(
        confidentialDEX.connect(trader1).updateDefaultFees(50, 40)
      ).to.be.revertedWithCustomError(confidentialDEX, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return empty supported tokens initially", async function () {
      const { confidentialDEX } = await loadFixture(deployConfidentialDEXFixture);

      const supportedTokens = await confidentialDEX.getSupportedTokens();
      expect(supportedTokens.length).to.equal(0);
    });

    it("Should return supported tokens after adding", async function () {
      const { confidentialDEX, mockToken } = await loadFixture(deployConfidentialDEXFixture);

      await confidentialDEX.addTradingPair(await mockToken.getAddress(), 30, 25);

      const supportedTokens = await confidentialDEX.getSupportedTokens();
      expect(supportedTokens.length).to.equal(1);
      expect(supportedTokens[0]).to.equal(await mockToken.getAddress());
    });
  });
});
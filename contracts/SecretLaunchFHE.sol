// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SecretLaunchFHE
 * @dev Advanced confidential launchpad with integrated DEX using Zama FHE
 * @notice Enables fully anonymous fundraising and trading with encrypted balances
 */
contract SecretLaunchFHE is SepoliaConfig, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    enum CampaignPhase { 
        Preparation,
        PrivateSale, 
        PublicSale, 
        TradingActive,
        Completed, 
        Cancelled 
    }

    enum InvestmentType {
        PrivateSale,
        PublicSale,
        DEXPurchase
    }

    struct FundraisingCampaign {
        uint256 campaignId;
        address creator;
        address tokenContract;
        string projectName;
        string projectSymbol;
        uint256 totalTokenSupply;
        uint256 privateSaleTarget;
        uint256 publicSaleTarget;
        uint256 privateSalePrice;
        uint256 publicSalePrice;
        uint256 privateStartTime;
        uint256 privateEndTime;
        uint256 publicStartTime;
        uint256 publicEndTime;
        uint256 minPrivateInvestment;
        uint256 maxPrivateInvestment;
        uint256 minPublicInvestment;
        uint256 maxPublicInvestment;
        CampaignPhase currentPhase;
        bool isActive;
        string metadataHash;
        
        // FHE encrypted aggregated amounts
        euint64 encryptedPrivateRaised;
        euint64 encryptedPublicRaised;
        euint64 encryptedTotalTokensAllocated;
        
        // Decrypted values (available after oracle decryption)
        uint64 decryptedPrivateRaised;
        uint64 decryptedPublicRaised;
        uint64 decryptedTotalTokensAllocated;
        
        bool isDecryptionComplete;
        uint256 dexLiquidityPercentage; // Percentage of funds for DEX liquidity
    }

    struct ConfidentialInvestment {
        address investor;
        uint256 campaignId;
        InvestmentType investmentType;
        uint256 timestamp;
        // Encrypted investment amount and token allocation
        euint64 encryptedAmount;
        euint64 encryptedTokenAllocation;
        // Plain amounts for refund/verification purposes
        uint256 actualAmount;
        bool hasClaimedTokens;
        bool hasClaimedRefund;
        // Investment signature for verification
        bytes investmentSignature;
    }

    struct DEXPool {
        uint256 campaignId;
        address tokenAddress;
        euint64 encryptedTokenReserve;
        euint64 encryptedETHReserve;
        uint64 decryptedTokenReserve;
        uint64 decryptedETHReserve;
        uint256 totalShares;
        mapping(address => euint64) encryptedUserShares;
        mapping(address => uint64) decryptedUserShares;
        bool isActive;
        uint256 creationTime;
    }

    // State variables
    mapping(uint256 => FundraisingCampaign) public campaigns;
    mapping(uint256 => ConfidentialInvestment[]) public campaignInvestments;
    mapping(address => uint256[]) public userCampaigns;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => uint256)) public userTotalInvestment;
    mapping(uint256 => DEXPool) public dexPools;
    
    uint256 public nextCampaignId = 1;
    uint16 public platformFeeBasisPoints = 300; // 3% - use smaller type
    uint16 public constant MAX_FEE_BASIS_POINTS = 1500; // 15%
    uint8 public constant MIN_LIQUIDITY_PERCENTAGE = 10; // 10%
    uint8 public constant MAX_LIQUIDITY_PERCENTAGE = 80; // 80%
    
    address public treasuryAddress;
    address public emergencyAddress;

    // Events
    event CampaignLaunched(
        uint256 indexed campaignId,
        address indexed creator,
        string projectName,
        uint256 privateSaleTarget,
        uint256 publicSaleTarget
    );

    event ConfidentialInvestmentMade(
        uint256 indexed campaignId,
        address indexed investor,
        InvestmentType investmentType,
        uint256 timestamp,
        bytes32 commitmentHash
    );

    event PhaseTransitioned(
        uint256 indexed campaignId,
        CampaignPhase from,
        CampaignPhase to,
        uint256 timestamp
    );

    event DEXPoolCreated(
        uint256 indexed campaignId,
        address indexed tokenAddress,
        uint256 timestamp
    );

    event ConfidentialSwapExecuted(
        uint256 indexed campaignId,
        address indexed trader,
        bool isETHToToken,
        uint256 timestamp
    );

    event TokensClaimed(
        uint256 indexed campaignId,
        address indexed investor,
        uint256 timestamp
    );

    event LiquidityAdded(
        uint256 indexed campaignId,
        address indexed provider,
        uint256 timestamp
    );

    event DecryptionTriggered(
        uint256 indexed campaignId,
        uint256 requestId,
        string decryptionType
    );

    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(
            campaigns[_campaignId].creator == msg.sender,
            "SecretLaunch: Not campaign creator"
        );
        _;
    }

    modifier campaignExists(uint256 _campaignId) {
        require(campaigns[_campaignId].campaignId != 0, "SecretLaunch: Campaign does not exist");
        _;
    }

    modifier onlyInPhase(uint256 _campaignId, CampaignPhase _phase) {
        require(
            campaigns[_campaignId].currentPhase == _phase,
            "SecretLaunch: Invalid campaign phase"
        );
        _;
    }

    constructor(
        address _treasuryAddress,
        address _emergencyAddress
    ) Ownable(msg.sender) {
        require(_treasuryAddress != address(0), "SecretLaunch: Invalid treasury address");
        require(_emergencyAddress != address(0), "SecretLaunch: Invalid emergency address");
        
        treasuryAddress = _treasuryAddress;
        emergencyAddress = _emergencyAddress;
    }

    /**
     * @dev Launch a new confidential fundraising campaign
     */
    function launchCampaign(
        address _tokenContract,
        string calldata _projectName,
        string calldata _projectSymbol,
        uint256 _totalTokenSupply,
        uint256 _privateSaleTarget,
        uint256 _publicSaleTarget,
        uint256 _privateSalePrice,
        uint256 _publicSalePrice,
        uint256 _privateDuration,
        uint256 _publicDuration,
        uint256 _minPrivateInvestment,
        uint256 _maxPrivateInvestment,
        uint256 _minPublicInvestment,
        uint256 _maxPublicInvestment,
        uint256 _dexLiquidityPercentage,
        string calldata _metadataHash
    ) external nonReentrant returns (uint256) {
        require(_tokenContract != address(0), "SecretLaunch: Invalid token contract");
        require(bytes(_projectName).length > 0, "SecretLaunch: Invalid project name");
        require(_totalTokenSupply > 0, "SecretLaunch: Invalid token supply");
        require(_privateSaleTarget > 0, "SecretLaunch: Invalid private sale target");
        require(_publicSaleTarget > 0, "SecretLaunch: Invalid public sale target");
        require(_privateSalePrice > 0 && _publicSalePrice > 0, "SecretLaunch: Invalid prices");
        require(_privateDuration > 0 && _publicDuration > 0, "SecretLaunch: Invalid durations");
        require(
            _dexLiquidityPercentage >= MIN_LIQUIDITY_PERCENTAGE && 
            _dexLiquidityPercentage <= MAX_LIQUIDITY_PERCENTAGE,
            "SecretLaunch: Invalid liquidity percentage"
        );

        uint256 campaignId = nextCampaignId++;
        uint256 currentTime = block.timestamp;
        uint256 privateStartTime = currentTime + 3600; // 1 hour delay
        uint256 privateEndTime = privateStartTime + _privateDuration;
        uint256 publicStartTime = privateEndTime + 1800; // 30 min gap
        uint256 publicEndTime = publicStartTime + _publicDuration;

        // Initialize encrypted zero values
        euint64 encryptedZero = FHE.asEuint64(0);
        FHE.allowThis(encryptedZero);

        campaigns[campaignId] = FundraisingCampaign({
            campaignId: campaignId,
            creator: msg.sender,
            tokenContract: _tokenContract,
            projectName: _projectName,
            projectSymbol: _projectSymbol,
            totalTokenSupply: _totalTokenSupply,
            privateSaleTarget: _privateSaleTarget,
            publicSaleTarget: _publicSaleTarget,
            privateSalePrice: _privateSalePrice,
            publicSalePrice: _publicSalePrice,
            privateStartTime: privateStartTime,
            privateEndTime: privateEndTime,
            publicStartTime: publicStartTime,
            publicEndTime: publicEndTime,
            minPrivateInvestment: _minPrivateInvestment,
            maxPrivateInvestment: _maxPrivateInvestment,
            minPublicInvestment: _minPublicInvestment,
            maxPublicInvestment: _maxPublicInvestment,
            currentPhase: CampaignPhase.Preparation,
            isActive: true,
            metadataHash: _metadataHash,
            encryptedPrivateRaised: encryptedZero,
            encryptedPublicRaised: encryptedZero,
            encryptedTotalTokensAllocated: encryptedZero,
            decryptedPrivateRaised: 0,
            decryptedPublicRaised: 0,
            decryptedTotalTokensAllocated: 0,
            isDecryptionComplete: false,
            dexLiquidityPercentage: _dexLiquidityPercentage
        });

        // Transfer tokens to contract
        IERC20(_tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            _totalTokenSupply
        );

        emit CampaignLaunched(
            campaignId,
            msg.sender,
            _projectName,
            _privateSaleTarget,
            _publicSaleTarget
        );

        return campaignId;
    }

    /**
     * @dev Make a confidential investment during private or public sale
     */
    function makeConfidentialInvestment(
        uint256 _campaignId,
        inEuint64 calldata _encryptedAmount,
        bytes calldata _inputProof,
        bytes calldata _signature
    ) external payable nonReentrant campaignExists(_campaignId) {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "SecretLaunch: Campaign not active");

        InvestmentType investmentType;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 tokenPrice;

        // Determine investment phase and parameters
        if (campaign.currentPhase == CampaignPhase.PrivateSale) {
            require(
                block.timestamp >= campaign.privateStartTime && 
                block.timestamp <= campaign.privateEndTime,
                "SecretLaunch: Private sale not active"
            );
            investmentType = InvestmentType.PrivateSale;
            minInvestment = campaign.minPrivateInvestment;
            maxInvestment = campaign.maxPrivateInvestment;
            tokenPrice = campaign.privateSalePrice;
        } else if (campaign.currentPhase == CampaignPhase.PublicSale) {
            require(
                block.timestamp >= campaign.publicStartTime && 
                block.timestamp <= campaign.publicEndTime,
                "SecretLaunch: Public sale not active"
            );
            investmentType = InvestmentType.PublicSale;
            minInvestment = campaign.minPublicInvestment;
            maxInvestment = campaign.maxPublicInvestment;
            tokenPrice = campaign.publicSalePrice;
        } else {
            revert("SecretLaunch: No active sale phase");
        }

        require(msg.value >= minInvestment, "SecretLaunch: Below minimum investment");
        require(msg.value <= maxInvestment, "SecretLaunch: Above maximum investment");

        // Decrypt and verify encrypted amount matches actual ETH sent
        euint64 investmentAmount = FHE.fromExternal(_encryptedAmount, _inputProof);
        ebool amountMatches = FHE.eq(investmentAmount, FHE.asEuint64(msg.value));
        require(FHE.decrypt(amountMatches), "SecretLaunch: Encrypted amount mismatch");

        // Verify user total investment doesn't exceed maximum
        uint256 newUserTotal = userTotalInvestment[_campaignId][msg.sender] + msg.value;
        require(newUserTotal <= maxInvestment, "SecretLaunch: Would exceed max investment");

        // Calculate encrypted token allocation
        euint64 tokenAllocation = FHE.div(
            FHE.mul(investmentAmount, FHE.asEuint64(1e18)),
            FHE.asEuint64(tokenPrice)
        );
        FHE.allowThis(tokenAllocation);

        // Record confidential investment
        campaignInvestments[_campaignId].push(ConfidentialInvestment({
            investor: msg.sender,
            campaignId: _campaignId,
            investmentType: investmentType,
            timestamp: block.timestamp,
            encryptedAmount: investmentAmount,
            encryptedTokenAllocation: tokenAllocation,
            actualAmount: msg.value,
            hasClaimedTokens: false,
            hasClaimedRefund: false,
            investmentSignature: _signature
        }));

        // Update campaign totals
        if (investmentType == InvestmentType.PrivateSale) {
            campaign.encryptedPrivateRaised = FHE.add(
                campaign.encryptedPrivateRaised, 
                investmentAmount
            );
        } else {
            campaign.encryptedPublicRaised = FHE.add(
                campaign.encryptedPublicRaised, 
                investmentAmount
            );
        }
        
        campaign.encryptedTotalTokensAllocated = FHE.add(
            campaign.encryptedTotalTokensAllocated,
            tokenAllocation
        );

        FHE.allowThis(campaign.encryptedPrivateRaised);
        FHE.allowThis(campaign.encryptedPublicRaised);
        FHE.allowThis(campaign.encryptedTotalTokensAllocated);

        // Update user tracking
        if (!hasParticipated[_campaignId][msg.sender]) {
            userCampaigns[msg.sender].push(_campaignId);
            hasParticipated[_campaignId][msg.sender] = true;
        }
        userTotalInvestment[_campaignId][msg.sender] = newUserTotal;

        // Create commitment hash for privacy
        bytes32 commitmentHash = keccak256(
            abi.encodePacked(
                _campaignId,
                msg.sender,
                block.timestamp,
                block.number
            )
        );

        emit ConfidentialInvestmentMade(
            _campaignId,
            msg.sender,
            investmentType,
            block.timestamp,
            commitmentHash
        );
    }

    /**
     * @dev Transition campaign to next phase (automated by time or manual trigger)
     */
    function transitionCampaignPhase(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
    {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        require(campaign.isActive, "SecretLaunch: Campaign not active");

        CampaignPhase oldPhase = campaign.currentPhase;
        CampaignPhase newPhase = oldPhase;

        if (oldPhase == CampaignPhase.Preparation) {
            require(
                block.timestamp >= campaign.privateStartTime,
                "SecretLaunch: Private sale not ready"
            );
            newPhase = CampaignPhase.PrivateSale;
        } else if (oldPhase == CampaignPhase.PrivateSale) {
            require(
                block.timestamp > campaign.privateEndTime,
                "SecretLaunch: Private sale still active"
            );
            newPhase = CampaignPhase.PublicSale;
        } else if (oldPhase == CampaignPhase.PublicSale) {
            require(
                block.timestamp > campaign.publicEndTime,
                "SecretLaunch: Public sale still active"
            );
            newPhase = CampaignPhase.TradingActive;
            _initializeDEXPool(_campaignId);
        }

        if (newPhase != oldPhase) {
            campaign.currentPhase = newPhase;
            emit PhaseTransitioned(_campaignId, oldPhase, newPhase, block.timestamp);
        }
    }

    /**
     * @dev Initialize DEX pool after successful fundraising
     */
    function _initializeDEXPool(uint256 _campaignId) internal {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        
        // Create DEX pool
        DEXPool storage pool = dexPools[_campaignId];
        pool.campaignId = _campaignId;
        pool.tokenAddress = campaign.tokenContract;
        pool.isActive = true;
        pool.creationTime = block.timestamp;
        
        // Initialize with encrypted zero reserves (will be updated when liquidity is added)
        euint64 encryptedZero = FHE.asEuint64(0);
        FHE.allowThis(encryptedZero);
        pool.encryptedTokenReserve = encryptedZero;
        pool.encryptedETHReserve = encryptedZero;

        emit DEXPoolCreated(_campaignId, campaign.tokenContract, block.timestamp);
    }

    /**
     * @dev Execute confidential swap in DEX pool
     */
    function executeConfidentialSwap(
        uint256 _campaignId,
        inEuint64 calldata _encryptedAmountIn,
        bytes calldata _inputProof,
        bool _isETHToToken
    ) external payable nonReentrant campaignExists(_campaignId) {
        require(
            campaigns[_campaignId].currentPhase == CampaignPhase.TradingActive,
            "SecretLaunch: Trading not active"
        );
        
        DEXPool storage pool = dexPools[_campaignId];
        require(pool.isActive, "SecretLaunch: Pool not active");

        euint64 amountIn = FHE.fromExternal(_encryptedAmountIn, _inputProof);
        
        if (_isETHToToken) {
            require(msg.value > 0, "SecretLaunch: No ETH sent");
            ebool amountMatches = FHE.eq(amountIn, FHE.asEuint64(msg.value));
            require(FHE.decrypt(amountMatches), "SecretLaunch: Amount mismatch");
            
            _swapETHForTokens(_campaignId, amountIn);
        } else {
            _swapTokensForETH(_campaignId, amountIn);
        }

        emit ConfidentialSwapExecuted(
            _campaignId,
            msg.sender,
            _isETHToToken,
            block.timestamp
        );
    }

    /**
     * @dev Internal function to swap ETH for tokens
     */
    function _swapETHForTokens(uint256 _campaignId, euint64 _ethAmount) internal {
        DEXPool storage pool = dexPools[_campaignId];
        
        // Simplified AMM calculation with encrypted values
        euint64 tokenAmountOut = FHE.div(
            FHE.mul(_ethAmount, pool.encryptedTokenReserve),
            FHE.add(pool.encryptedETHReserve, _ethAmount)
        );
        
        // Update reserves
        pool.encryptedETHReserve = FHE.add(pool.encryptedETHReserve, _ethAmount);
        pool.encryptedTokenReserve = FHE.sub(pool.encryptedTokenReserve, tokenAmountOut);
        
        FHE.allowThis(pool.encryptedETHReserve);
        FHE.allowThis(pool.encryptedTokenReserve);
        FHE.allowThis(tokenAmountOut);
        
        // Transfer tokens to user (this would need additional logic for encrypted transfers)
        // For demo purposes, we'll emit event and handle transfers separately
    }

    /**
     * @dev Internal function to swap tokens for ETH
     */
    function _swapTokensForETH(uint256 _campaignId, euint64 _tokenAmount) internal {
        DEXPool storage pool = dexPools[_campaignId];
        
        // Simplified AMM calculation with encrypted values
        euint64 ethAmountOut = FHE.div(
            FHE.mul(_tokenAmount, pool.encryptedETHReserve),
            FHE.add(pool.encryptedTokenReserve, _tokenAmount)
        );
        
        // Update reserves
        pool.encryptedTokenReserve = FHE.add(pool.encryptedTokenReserve, _tokenAmount);
        pool.encryptedETHReserve = FHE.sub(pool.encryptedETHReserve, ethAmountOut);
        
        FHE.allowThis(pool.encryptedTokenReserve);
        FHE.allowThis(pool.encryptedETHReserve);
        FHE.allowThis(ethAmountOut);
        
        // Transfer ETH to user (this would need decryption for actual transfer)
    }

    /**
     * @dev Request decryption of campaign totals
     */
    function requestCampaignDecryption(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
        returns (uint256) 
    {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        require(
            campaign.currentPhase >= CampaignPhase.TradingActive || 
            msg.sender == campaign.creator ||
            msg.sender == owner(),
            "SecretLaunch: Not authorized for decryption"
        );
        require(!campaign.isDecryptionComplete, "SecretLaunch: Already decrypted");

        // Request decryption of all encrypted values
        bytes32[] memory cts = new bytes32[](3);
        cts[0] = FHE.toBytes32(campaign.encryptedPrivateRaised);
        cts[1] = FHE.toBytes32(campaign.encryptedPublicRaised);
        cts[2] = FHE.toBytes32(campaign.encryptedTotalTokensAllocated);
        
        uint256 requestId = FHE.requestDecryption(
            cts,
            this.callbackCampaignDecryption.selector
        );

        emit DecryptionTriggered(_campaignId, requestId, "campaign_totals");
        return requestId;
    }

    /**
     * @dev Callback function for campaign decryption
     */
    function callbackCampaignDecryption(
        uint256 _requestId,
        uint64 _decryptedPrivateRaised,
        uint64 _decryptedPublicRaised,
        uint64 _decryptedTotalTokensAllocated,
        bytes[] memory _signatures
    ) public {
        FHE.checkSignatures(_requestId, _signatures);

        // Find campaign for this decryption (simplified, in production use mapping)
        uint256 totalCampaigns = nextCampaignId;
        unchecked {
            for (uint256 campaignId = 1; campaignId < totalCampaigns; ++campaignId) {
                FundraisingCampaign storage campaign = campaigns[campaignId];
                if (!campaign.isDecryptionComplete) {
                    campaign.decryptedPrivateRaised = _decryptedPrivateRaised;
                    campaign.decryptedPublicRaised = _decryptedPublicRaised;
                    campaign.decryptedTotalTokensAllocated = _decryptedTotalTokensAllocated;
                    campaign.isDecryptionComplete = true;

                    _processCampaignCompletion(campaignId);
                    break;
                }
            }
        }
    }

    /**
     * @dev Process campaign completion after decryption
     */
    function _processCampaignCompletion(uint256 _campaignId) internal {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        
        uint256 totalRaised = campaign.decryptedPrivateRaised + campaign.decryptedPublicRaised;
        uint256 minTarget = campaign.privateSaleTarget + campaign.publicSaleTarget;
        
        if (totalRaised >= minTarget) {
            // Successful campaign
            campaign.currentPhase = CampaignPhase.Completed;
            
            // Calculate fees and distributions
            unchecked {
                uint256 platformFee = (totalRaised * platformFeeBasisPoints) / 10000;
                uint256 liquidityAmount = (totalRaised * campaign.dexLiquidityPercentage) / 100;
                uint256 creatorAmount = totalRaised - platformFee - liquidityAmount;
            
                // Transfer funds
                payable(treasuryAddress).transfer(platformFee);
                payable(campaign.creator).transfer(creatorAmount);
                
                // Initialize liquidity (ETH portion held in contract for DEX)
                _addInitialLiquidity(_campaignId, liquidityAmount);
            }
        } else {
            // Failed campaign
            campaign.currentPhase = CampaignPhase.Cancelled;
            campaign.isActive = false;
        }
    }

    /**
     * @dev Add initial liquidity to DEX pool
     */
    function _addInitialLiquidity(uint256 _campaignId, uint256 _ethAmount) internal {
        DEXPool storage pool = dexPools[_campaignId];
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        
        // Calculate token amount for liquidity (typically 20-30% of total supply)
        uint256 liquidityTokens = (campaign.totalTokenSupply * 25) / 100;
        
        // Set encrypted reserves
        pool.encryptedETHReserve = FHE.asEuint64(_ethAmount);
        pool.encryptedTokenReserve = FHE.asEuint64(liquidityTokens);
        FHE.allowThis(pool.encryptedETHReserve);
        FHE.allowThis(pool.encryptedTokenReserve);
        
        // Set initial share supply
        pool.totalShares = _ethAmount * liquidityTokens;
    }

    /**
     * @dev Claim tokens after successful campaign
     */
    function claimTokens(uint256 _campaignId) 
        external 
        nonReentrant 
        campaignExists(_campaignId) 
    {
        require(
            campaigns[_campaignId].currentPhase == CampaignPhase.Completed,
            "SecretLaunch: Campaign not completed"
        );
        require(hasParticipated[_campaignId][msg.sender], "SecretLaunch: No investment found");

        ConfidentialInvestment[] storage investments = campaignInvestments[_campaignId];
        uint256 totalTokensToTransfer = 0;
        uint256 investmentsLength = investments.length;
        
        FundraisingCampaign storage campaign = campaigns[_campaignId];

        unchecked {
            for (uint256 i = 0; i < investmentsLength; ++i) {
                ConfidentialInvestment storage investment = investments[i];
                if (investment.investor == msg.sender && !investment.hasClaimedTokens) {
                    // For demo purposes, use actual amount to calculate tokens
                    // In production, would use decrypted encrypted values
                    uint256 tokenPrice = investment.investmentType == InvestmentType.PrivateSale
                        ? campaign.privateSalePrice
                        : campaign.publicSalePrice;
                    
                    uint256 tokenAmount = (investment.actualAmount * 1e18) / tokenPrice;
                    totalTokensToTransfer += tokenAmount;
                    investment.hasClaimedTokens = true;
                }
            }
        }

        require(totalTokensToTransfer > 0, "SecretLaunch: No tokens to claim");
        
        IERC20(campaigns[_campaignId].tokenContract).safeTransfer(
            msg.sender,
            totalTokensToTransfer
        );

        emit TokensClaimed(_campaignId, msg.sender, block.timestamp);
    }

    /**
     * @dev Emergency cancel campaign (owner only)
     */
    function emergencyCancelCampaign(uint256 _campaignId) 
        external 
        onlyOwner 
        campaignExists(_campaignId) 
    {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        campaign.isActive = false;
        campaign.currentPhase = CampaignPhase.Cancelled;

        emit PhaseTransitioned(
            _campaignId,
            campaign.currentPhase,
            CampaignPhase.Cancelled,
            block.timestamp
        );
    }

    /**
     * @dev Get campaign details
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (
            uint256 campaignId,
            address creator,
            string memory projectName,
            uint256 privateSaleTarget,
            uint256 publicSaleTarget,
            CampaignPhase currentPhase,
            bool isActive,
            uint64 decryptedPrivateRaised,
            uint64 decryptedPublicRaised,
            bool isDecryptionComplete
        )
    {
        FundraisingCampaign storage campaign = campaigns[_campaignId];
        return (
            campaign.campaignId,
            campaign.creator,
            campaign.projectName,
            campaign.privateSaleTarget,
            campaign.publicSaleTarget,
            campaign.currentPhase,
            campaign.isActive,
            campaign.decryptedPrivateRaised,
            campaign.decryptedPublicRaised,
            campaign.isDecryptionComplete
        );
    }

    /**
     * @dev Get active campaigns
     */
    function getActiveCampaigns() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 campaignId = nextCampaignId;
        
        // First pass: count active campaigns
        unchecked {
            for (uint256 i = 1; i < campaignId; ++i) {
                if (campaigns[i].isActive) {
                    ++count;
                }
            }
        }

        uint256[] memory activeCampaigns = new uint256[](count);
        uint256 index = 0;
        
        // Second pass: populate array
        unchecked {
            for (uint256 i = 1; i < campaignId; ++i) {
                if (campaigns[i].isActive) {
                    activeCampaigns[index] = i;
                    ++index;
                }
            }
        }

        return activeCampaigns;
    }

    /**
     * @dev Update platform fee (owner only)
     */
    function updatePlatformFee(uint16 _newFeeBasisPoints) external onlyOwner {
        require(
            _newFeeBasisPoints <= MAX_FEE_BASIS_POINTS,
            "SecretLaunch: Fee too high"
        );
        platformFeeBasisPoints = _newFeeBasisPoints;
    }

    /**
     * @dev Update treasury address (owner only)
     */
    function updateTreasuryAddress(address _newTreasuryAddress) external onlyOwner {
        require(_newTreasuryAddress != address(0), "SecretLaunch: Invalid address");
        treasuryAddress = _newTreasuryAddress;
    }

    /**
     * @dev Get user's participated campaigns
     */
    function getUserCampaigns(address _user) external view returns (uint256[] memory) {
        return userCampaigns[_user];
    }
}
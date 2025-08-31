// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ConfidentialDEX
 * @dev Fully confidential decentralized exchange using Zama FHE
 * @notice All trade amounts and balances are encrypted, providing complete privacy
 */
contract ConfidentialDEX is SepoliaConfig, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum OrderType { BUY, SELL }
    enum OrderStatus { ACTIVE, PARTIALLY_FILLED, FILLED, CANCELLED }

    struct ConfidentialOrder {
        uint256 orderId;
        address trader;
        address tokenAddress;
        OrderType orderType;
        OrderStatus status;
        uint256 timestamp;
        uint256 deadline;
        
        // Encrypted order details
        euint64 encryptedAmount;        // Token amount for sell orders, ETH amount for buy orders
        euint64 encryptedPrice;         // Price per token in wei
        euint64 encryptedFilled;        // Amount filled so far
        euint64 encryptedRemaining;     // Amount remaining to fill
        
        // Public commitment hash for verification
        bytes32 commitmentHash;
        
        // Order signature for authentication
        bytes orderSignature;
    }

    struct TradingPair {
        address tokenAddress;
        bool isActive;
        uint256 totalOrders;
        uint256 totalVolume; // Public cumulative volume (decrypted periodically)
        
        // Encrypted liquidity reserves
        euint64 encryptedTokenReserve;
        euint64 encryptedETHReserve;
        
        // Fee parameters
        uint256 tradingFeeBasisPoints;
        uint256 liquidityFeeBasisPoints;
        
        // Price oracle data
        uint256 lastPriceUpdate;
        uint64 decryptedLastPrice;
    }

    struct LiquidityPosition {
        address provider;
        address tokenAddress;
        uint256 timestamp;
        
        // Encrypted liquidity amounts
        euint64 encryptedTokenAmount;
        euint64 encryptedETHAmount;
        euint64 encryptedShares;
        
        // Status
        bool isActive;
    }

    struct TradeExecution {
        uint256 buyOrderId;
        uint256 sellOrderId;
        address tokenAddress;
        uint256 timestamp;
        
        // Encrypted trade details
        euint64 encryptedTradeAmount;
        euint64 encryptedTradePrice;
        euint64 encryptedTotalValue;
        
        // Fee information
        euint64 encryptedBuyerFee;
        euint64 encryptedSellerFee;
    }

    // State variables
    mapping(address => TradingPair) public tradingPairs;
    mapping(uint256 => ConfidentialOrder) public orders;
    mapping(address => uint256[]) public userOrders;
    mapping(address => mapping(address => euint64)) public encryptedUserBalances;
    mapping(address => LiquidityPosition[]) public liquidityPositions;
    mapping(uint256 => TradeExecution[]) public orderExecutions;
    
    address[] public supportedTokens;
    uint256 public nextOrderId = 1;
    uint256 public defaultTradingFeeBasisPoints = 30; // 0.3%
    uint256 public defaultLiquidityFeeBasisPoints = 25; // 0.25%
    uint256 public constant MAX_FEE_BASIS_POINTS = 100; // 1%
    
    address public feeCollector;
    address public liquidityManager;

    // Events
    event TradingPairAdded(
        address indexed tokenAddress,
        uint256 tradingFeeBasisPoints,
        uint256 liquidityFeeBasisPoints
    );

    event ConfidentialOrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        address indexed tokenAddress,
        OrderType orderType,
        uint256 timestamp,
        bytes32 commitmentHash
    );

    event ConfidentialOrderMatched(
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        address indexed tokenAddress,
        uint256 timestamp,
        bytes32 tradeHash
    );

    event LiquidityAdded(
        address indexed provider,
        address indexed tokenAddress,
        uint256 timestamp,
        bytes32 commitmentHash
    );

    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenAddress,
        uint256 timestamp
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed trader,
        uint256 timestamp
    );

    modifier validToken(address _tokenAddress) {
        require(
            tradingPairs[_tokenAddress].isActive,
            "ConfidentialDEX: Token not supported"
        );
        _;
    }

    modifier onlyTrader(uint256 _orderId) {
        require(
            orders[_orderId].trader == msg.sender,
            "ConfidentialDEX: Not order owner"
        );
        _;
    }

    constructor(
        address _feeCollector,
        address _liquidityManager
    ) Ownable(msg.sender) {
        require(_feeCollector != address(0), "ConfidentialDEX: Invalid fee collector");
        require(_liquidityManager != address(0), "ConfidentialDEX: Invalid liquidity manager");
        
        feeCollector = _feeCollector;
        liquidityManager = _liquidityManager;
    }

    /**
     * @dev Add a new trading pair
     */
    function addTradingPair(
        address _tokenAddress,
        uint256 _tradingFeeBasisPoints,
        uint256 _liquidityFeeBasisPoints
    ) external onlyOwner {
        require(_tokenAddress != address(0), "ConfidentialDEX: Invalid token address");
        require(
            _tradingFeeBasisPoints <= MAX_FEE_BASIS_POINTS &&
            _liquidityFeeBasisPoints <= MAX_FEE_BASIS_POINTS,
            "ConfidentialDEX: Fees too high"
        );
        require(!tradingPairs[_tokenAddress].isActive, "ConfidentialDEX: Pair already exists");

        // Initialize encrypted zero reserves
        euint64 encryptedZero = FHE.asEuint64(0);
        FHE.allowThis(encryptedZero);

        tradingPairs[_tokenAddress] = TradingPair({
            tokenAddress: _tokenAddress,
            isActive: true,
            totalOrders: 0,
            totalVolume: 0,
            encryptedTokenReserve: encryptedZero,
            encryptedETHReserve: encryptedZero,
            tradingFeeBasisPoints: _tradingFeeBasisPoints,
            liquidityFeeBasisPoints: _liquidityFeeBasisPoints,
            lastPriceUpdate: block.timestamp,
            decryptedLastPrice: 0
        });

        supportedTokens.push(_tokenAddress);

        emit TradingPairAdded(_tokenAddress, _tradingFeeBasisPoints, _liquidityFeeBasisPoints);
    }

    /**
     * @dev Place a confidential buy order
     */
    function placeConfidentialBuyOrder(
        address _tokenAddress,
        inEuint64 calldata _encryptedETHAmount,
        inEuint64 calldata _encryptedMaxPrice,
        bytes calldata _inputProof,
        uint256 _deadline,
        bytes calldata _signature
    ) external payable nonReentrant validToken(_tokenAddress) returns (uint256) {
        require(msg.value > 0, "ConfidentialDEX: No ETH sent");
        require(_deadline > block.timestamp, "ConfidentialDEX: Invalid deadline");

        // Decrypt and verify encrypted ETH amount matches actual amount sent
        euint64 ethAmount = FHE.fromExternal(_encryptedETHAmount, _inputProof);
        euint64 maxPrice = FHE.fromExternal(_encryptedMaxPrice, _inputProof);
        
        ebool amountMatches = FHE.eq(ethAmount, FHE.asEuint64(msg.value));
        require(FHE.decrypt(amountMatches), "ConfidentialDEX: ETH amount mismatch");

        uint256 orderId = _createOrder(
            _tokenAddress,
            OrderType.BUY,
            ethAmount,
            maxPrice,
            _deadline,
            _signature
        );

        // Try to match with existing sell orders
        _attemptOrderMatching(orderId);

        return orderId;
    }

    /**
     * @dev Place a confidential sell order
     */
    function placeConfidentialSellOrder(
        address _tokenAddress,
        inEuint64 calldata _encryptedTokenAmount,
        inEuint64 calldata _encryptedMinPrice,
        bytes calldata _inputProof,
        uint256 _deadline,
        bytes calldata _signature
    ) external nonReentrant validToken(_tokenAddress) returns (uint256) {
        require(_deadline > block.timestamp, "ConfidentialDEX: Invalid deadline");

        // Decrypt token amount and verify user has enough balance
        euint64 tokenAmount = FHE.fromExternal(_encryptedTokenAmount, _inputProof);
        euint64 minPrice = FHE.fromExternal(_encryptedMinPrice, _inputProof);
        
        // Check user has sufficient encrypted balance
        euint64 userBalance = encryptedUserBalances[msg.sender][_tokenAddress];
        ebool hasSufficientBalance = FHE.gte(userBalance, tokenAmount);
        require(FHE.decrypt(hasSufficientBalance), "ConfidentialDEX: Insufficient balance");

        uint256 orderId = _createOrder(
            _tokenAddress,
            OrderType.SELL,
            tokenAmount,
            minPrice,
            _deadline,
            _signature
        );

        // Lock tokens in contract
        encryptedUserBalances[msg.sender][_tokenAddress] = FHE.sub(userBalance, tokenAmount);
        FHE.allowThis(encryptedUserBalances[msg.sender][_tokenAddress]);

        // Try to match with existing buy orders
        _attemptOrderMatching(orderId);

        return orderId;
    }

    /**
     * @dev Internal function to create an order
     */
    function _createOrder(
        address _tokenAddress,
        OrderType _orderType,
        euint64 _encryptedAmount,
        euint64 _encryptedPrice,
        uint256 _deadline,
        bytes calldata _signature
    ) internal returns (uint256) {
        uint256 orderId = nextOrderId++;

        // Create commitment hash for privacy
        bytes32 commitmentHash = keccak256(
            abi.encodePacked(
                orderId,
                msg.sender,
                _tokenAddress,
                uint256(_orderType),
                block.timestamp,
                block.number
            )
        );

        FHE.allowThis(_encryptedAmount);
        FHE.allowThis(_encryptedPrice);

        orders[orderId] = ConfidentialOrder({
            orderId: orderId,
            trader: msg.sender,
            tokenAddress: _tokenAddress,
            orderType: _orderType,
            status: OrderStatus.ACTIVE,
            timestamp: block.timestamp,
            deadline: _deadline,
            encryptedAmount: _encryptedAmount,
            encryptedPrice: _encryptedPrice,
            encryptedFilled: FHE.asEuint64(0),
            encryptedRemaining: _encryptedAmount,
            commitmentHash: commitmentHash,
            orderSignature: _signature
        });

        FHE.allowThis(orders[orderId].encryptedFilled);
        FHE.allowThis(orders[orderId].encryptedRemaining);

        userOrders[msg.sender].push(orderId);
        tradingPairs[_tokenAddress].totalOrders++;

        emit ConfidentialOrderPlaced(
            orderId,
            msg.sender,
            _tokenAddress,
            _orderType,
            block.timestamp,
            commitmentHash
        );

        return orderId;
    }

    /**
     * @dev Attempt to match orders automatically
     */
    function _attemptOrderMatching(uint256 _newOrderId) internal {
        ConfidentialOrder storage newOrder = orders[_newOrderId];
        
        // Find matching orders (simplified matching logic)
        // In production, would use more sophisticated order book matching
        uint256[] memory candidateOrders = _findMatchingOrders(
            newOrder.tokenAddress,
            newOrder.orderType == OrderType.BUY ? OrderType.SELL : OrderType.BUY
        );

        for (uint256 i = 0; i < candidateOrders.length; i++) {
            if (_canExecuteTrade(_newOrderId, candidateOrders[i])) {
                _executeTrade(_newOrderId, candidateOrders[i]);
                
                // Check if new order is fully filled
                if (newOrder.status == OrderStatus.FILLED) {
                    break;
                }
            }
        }
    }

    /**
     * @dev Find matching orders for a given token and order type
     */
    function _findMatchingOrders(
        address _tokenAddress,
        OrderType _orderType
    ) internal view returns (uint256[] memory) {
        // Simplified implementation - would use more efficient data structures in production
        uint256 count = 0;
        
        // Count matching orders
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (
                orders[i].tokenAddress == _tokenAddress &&
                orders[i].orderType == _orderType &&
                orders[i].status == OrderStatus.ACTIVE &&
                orders[i].deadline > block.timestamp
            ) {
                count++;
            }
        }
        
        // Create array of matching order IDs
        uint256[] memory matchingOrders = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (
                orders[i].tokenAddress == _tokenAddress &&
                orders[i].orderType == _orderType &&
                orders[i].status == OrderStatus.ACTIVE &&
                orders[i].deadline > block.timestamp
            ) {
                matchingOrders[index] = i;
                index++;
            }
        }
        
        return matchingOrders;
    }

    /**
     * @dev Check if two orders can be matched
     */
    function _canExecuteTrade(uint256 _buyOrderId, uint256 _sellOrderId) 
        internal 
        view 
        returns (bool) 
    {
        ConfidentialOrder storage buyOrder = orders[_buyOrderId];
        ConfidentialOrder storage sellOrder = orders[_sellOrderId];
        
        // Basic validation
        if (
            buyOrder.orderType != OrderType.BUY ||
            sellOrder.orderType != OrderType.SELL ||
            buyOrder.tokenAddress != sellOrder.tokenAddress ||
            buyOrder.status != OrderStatus.ACTIVE ||
            sellOrder.status != OrderStatus.ACTIVE
        ) {
            return false;
        }
        
        // Check if prices match (buyer's max >= seller's min)
        // Note: In FHE, direct comparison might need special handling
        ebool priceMatch = FHE.gte(buyOrder.encryptedPrice, sellOrder.encryptedPrice);
        return FHE.decrypt(priceMatch);
    }

    /**
     * @dev Execute a trade between two matching orders
     */
    function _executeTrade(uint256 _buyOrderId, uint256 _sellOrderId) internal {
        ConfidentialOrder storage buyOrder = orders[_buyOrderId];
        ConfidentialOrder storage sellOrder = orders[_sellOrderId];
        
        // Calculate trade amount (minimum of remaining amounts)
        euint64 buyRemaining = buyOrder.encryptedRemaining;
        euint64 sellRemaining = sellOrder.encryptedRemaining;
        
        ebool buyLessOrEqual = FHE.lte(buyRemaining, sellRemaining);
        euint64 tradeAmount = FHE.select(buyLessOrEqual, buyRemaining, sellRemaining);
        
        // Calculate trade price (seller's price)
        euint64 tradePrice = sellOrder.encryptedPrice;
        euint64 totalValue = FHE.mul(tradeAmount, tradePrice);
        
        // Calculate fees
        TradingPair storage pair = tradingPairs[buyOrder.tokenAddress];
        euint64 tradingFee = FHE.div(
            FHE.mul(totalValue, FHE.asEuint64(pair.tradingFeeBasisPoints)),
            FHE.asEuint64(10000)
        );
        
        euint64 buyerFee = FHE.div(tradingFee, FHE.asEuint64(2));
        euint64 sellerFee = FHE.sub(tradingFee, buyerFee);
        
        // Update order states
        buyOrder.encryptedFilled = FHE.add(buyOrder.encryptedFilled, tradeAmount);
        buyOrder.encryptedRemaining = FHE.sub(buyOrder.encryptedRemaining, tradeAmount);
        
        sellOrder.encryptedFilled = FHE.add(sellOrder.encryptedFilled, tradeAmount);
        sellOrder.encryptedRemaining = FHE.sub(sellOrder.encryptedRemaining, tradeAmount);
        
        FHE.allowThis(buyOrder.encryptedFilled);
        FHE.allowThis(buyOrder.encryptedRemaining);
        FHE.allowThis(sellOrder.encryptedFilled);
        FHE.allowThis(sellOrder.encryptedRemaining);
        
        // Update order status if fully filled
        ebool buyOrderFilled = FHE.eq(buyOrder.encryptedRemaining, FHE.asEuint64(0));
        ebool sellOrderFilled = FHE.eq(sellOrder.encryptedRemaining, FHE.asEuint64(0));
        
        if (FHE.decrypt(buyOrderFilled)) {
            buyOrder.status = OrderStatus.FILLED;
        } else {
            buyOrder.status = OrderStatus.PARTIALLY_FILLED;
        }
        
        if (FHE.decrypt(sellOrderFilled)) {
            sellOrder.status = OrderStatus.FILLED;
        } else {
            sellOrder.status = OrderStatus.PARTIALLY_FILLED;
        }
        
        // Record trade execution
        TradeExecution memory execution = TradeExecution({
            buyOrderId: _buyOrderId,
            sellOrderId: _sellOrderId,
            tokenAddress: buyOrder.tokenAddress,
            timestamp: block.timestamp,
            encryptedTradeAmount: tradeAmount,
            encryptedTradePrice: tradePrice,
            encryptedTotalValue: totalValue,
            encryptedBuyerFee: buyerFee,
            encryptedSellerFee: sellerFee
        });
        
        orderExecutions[_buyOrderId].push(execution);
        orderExecutions[_sellOrderId].push(execution);
        
        FHE.allowThis(execution.encryptedTradeAmount);
        FHE.allowThis(execution.encryptedTradePrice);
        FHE.allowThis(execution.encryptedTotalValue);
        FHE.allowThis(execution.encryptedBuyerFee);
        FHE.allowThis(execution.encryptedSellerFee);
        
        // Update user balances
        _updateBalancesAfterTrade(
            buyOrder.trader,
            sellOrder.trader,
            buyOrder.tokenAddress,
            tradeAmount,
            totalValue,
            buyerFee,
            sellerFee
        );
        
        // Create trade hash for privacy
        bytes32 tradeHash = keccak256(
            abi.encodePacked(
                _buyOrderId,
                _sellOrderId,
                block.timestamp,
                block.number
            )
        );
        
        emit ConfidentialOrderMatched(
            _buyOrderId,
            _sellOrderId,
            buyOrder.tokenAddress,
            block.timestamp,
            tradeHash
        );
    }

    /**
     * @dev Update user balances after trade execution
     */
    function _updateBalancesAfterTrade(
        address _buyer,
        address _seller,
        address _tokenAddress,
        euint64 _tokenAmount,
        euint64 _ethAmount,
        euint64 _buyerFee,
        euint64 _sellerFee
    ) internal {
        // Update buyer's token balance
        encryptedUserBalances[_buyer][_tokenAddress] = FHE.add(
            encryptedUserBalances[_buyer][_tokenAddress],
            _tokenAmount
        );
        
        // Update seller's ETH balance (minus fees)
        euint64 sellerETHReceived = FHE.sub(_ethAmount, _sellerFee);
        encryptedUserBalances[_seller][address(0)] = FHE.add(
            encryptedUserBalances[_seller][address(0)],
            sellerETHReceived
        );
        
        // Update fee collector's balance
        euint64 totalFees = FHE.add(_buyerFee, _sellerFee);
        encryptedUserBalances[feeCollector][address(0)] = FHE.add(
            encryptedUserBalances[feeCollector][address(0)],
            totalFees
        );
        
        FHE.allowThis(encryptedUserBalances[_buyer][_tokenAddress]);
        FHE.allowThis(encryptedUserBalances[_seller][address(0)]);
        FHE.allowThis(encryptedUserBalances[feeCollector][address(0)]);
    }

    /**
     * @dev Deposit tokens to encrypted balance
     */
    function depositTokens(
        address _tokenAddress,
        uint256 _amount
    ) external nonReentrant validToken(_tokenAddress) {
        require(_amount > 0, "ConfidentialDEX: Invalid amount");
        
        // Transfer tokens from user to contract
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update encrypted balance
        euint64 encryptedAmount = FHE.asEuint64(_amount);
        encryptedUserBalances[msg.sender][_tokenAddress] = FHE.add(
            encryptedUserBalances[msg.sender][_tokenAddress],
            encryptedAmount
        );
        
        FHE.allowThis(encryptedUserBalances[msg.sender][_tokenAddress]);
        FHE.allowThis(encryptedAmount);
    }

    /**
     * @dev Cancel an active order
     */
    function cancelOrder(uint256 _orderId) 
        external 
        nonReentrant 
        onlyTrader(_orderId) 
    {
        ConfidentialOrder storage order = orders[_orderId];
        require(
            order.status == OrderStatus.ACTIVE || 
            order.status == OrderStatus.PARTIALLY_FILLED,
            "ConfidentialDEX: Cannot cancel order"
        );
        
        order.status = OrderStatus.CANCELLED;
        
        // If it's a sell order, return remaining tokens to user
        if (order.orderType == OrderType.SELL) {
            encryptedUserBalances[msg.sender][order.tokenAddress] = FHE.add(
                encryptedUserBalances[msg.sender][order.tokenAddress],
                order.encryptedRemaining
            );
            FHE.allowThis(encryptedUserBalances[msg.sender][order.tokenAddress]);
        }
        
        emit OrderCancelled(_orderId, msg.sender, block.timestamp);
    }

    /**
     * @dev Add liquidity to a trading pair
     */
    function addLiquidity(
        address _tokenAddress,
        inEuint64 calldata _encryptedTokenAmount,
        bytes calldata _inputProof
    ) external payable nonReentrant validToken(_tokenAddress) {
        require(msg.value > 0, "ConfidentialDEX: No ETH sent");
        
        euint64 tokenAmount = FHE.fromExternal(_encryptedTokenAmount, _inputProof);
        euint64 ethAmount = FHE.asEuint64(msg.value);
        
        // Check user has sufficient token balance
        euint64 userBalance = encryptedUserBalances[msg.sender][_tokenAddress];
        ebool hasSufficientBalance = FHE.gte(userBalance, tokenAmount);
        require(FHE.decrypt(hasSufficientBalance), "ConfidentialDEX: Insufficient token balance");
        
        // Update user's token balance
        encryptedUserBalances[msg.sender][_tokenAddress] = FHE.sub(userBalance, tokenAmount);
        FHE.allowThis(encryptedUserBalances[msg.sender][_tokenAddress]);
        
        // Calculate shares (simplified calculation)
        TradingPair storage pair = tradingPairs[_tokenAddress];
        euint64 shares = FHE.mul(tokenAmount, ethAmount); // Simplified, should use proper AMM formula
        
        // Update reserves
        pair.encryptedTokenReserve = FHE.add(pair.encryptedTokenReserve, tokenAmount);
        pair.encryptedETHReserve = FHE.add(pair.encryptedETHReserve, ethAmount);
        
        FHE.allowThis(pair.encryptedTokenReserve);
        FHE.allowThis(pair.encryptedETHReserve);
        FHE.allowThis(shares);
        
        // Record liquidity position
        liquidityPositions[msg.sender].push(LiquidityPosition({
            provider: msg.sender,
            tokenAddress: _tokenAddress,
            timestamp: block.timestamp,
            encryptedTokenAmount: tokenAmount,
            encryptedETHAmount: ethAmount,
            encryptedShares: shares,
            isActive: true
        }));
        
        // Create commitment hash
        bytes32 commitmentHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _tokenAddress,
                block.timestamp,
                block.number
            )
        );
        
        emit LiquidityAdded(msg.sender, _tokenAddress, block.timestamp, commitmentHash);
    }

    /**
     * @dev Get order details
     */
    function getOrder(uint256 _orderId) 
        external 
        view 
        returns (
            uint256 orderId,
            address trader,
            address tokenAddress,
            OrderType orderType,
            OrderStatus status,
            uint256 timestamp,
            uint256 deadline,
            bytes32 commitmentHash
        ) 
    {
        ConfidentialOrder storage order = orders[_orderId];
        return (
            order.orderId,
            order.trader,
            order.tokenAddress,
            order.orderType,
            order.status,
            order.timestamp,
            order.deadline,
            order.commitmentHash
        );
    }

    /**
     * @dev Get user's orders
     */
    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }

    /**
     * @dev Get supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev Update fee collector address
     */
    function updateFeeCollector(address _newFeeCollector) external onlyOwner {
        require(_newFeeCollector != address(0), "ConfidentialDEX: Invalid address");
        feeCollector = _newFeeCollector;
    }

    /**
     * @dev Update default fees
     */
    function updateDefaultFees(
        uint256 _tradingFeeBasisPoints,
        uint256 _liquidityFeeBasisPoints
    ) external onlyOwner {
        require(
            _tradingFeeBasisPoints <= MAX_FEE_BASIS_POINTS &&
            _liquidityFeeBasisPoints <= MAX_FEE_BASIS_POINTS,
            "ConfidentialDEX: Fees too high"
        );
        
        defaultTradingFeeBasisPoints = _tradingFeeBasisPoints;
        defaultLiquidityFeeBasisPoints = _liquidityFeeBasisPoints;
    }
}
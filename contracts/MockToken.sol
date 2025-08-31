// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockToken
 * @dev ERC20 token for testing SecretLaunch platform
 */
contract MockToken is ERC20, ERC20Burnable, Ownable {
    uint8 private _decimals;
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _tokenDecimals,
        uint256 _initialSupply,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        require(_tokenDecimals <= 18, "MockToken: Decimals too high");
        require(_initialSupply <= MAX_SUPPLY, "MockToken: Initial supply too high");
        require(_owner != address(0), "MockToken: Invalid owner address");
        
        _decimals = _tokenDecimals;
        
        if (_initialSupply > 0) {
            _mint(_owner, _initialSupply);
            emit TokensMinted(_owner, _initialSupply);
        }
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockToken: Mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "MockToken: Would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Batch mint tokens to multiple addresses
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "MockToken: Array length mismatch");
        require(recipients.length > 0, "MockToken: Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "MockToken: Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockToken: Mint to zero address");
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Burn tokens from caller's account
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specified account (requires allowance)
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Airdrop tokens to multiple addresses
     */
    function airdrop(
        address[] calldata recipients,
        uint256 amountPerRecipient
    ) external onlyOwner {
        require(recipients.length > 0, "MockToken: No recipients");
        require(amountPerRecipient > 0, "MockToken: Invalid amount");
        
        uint256 totalAmount = recipients.length * amountPerRecipient;
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "MockToken: Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockToken: Airdrop to zero address");
            _mint(recipients[i], amountPerRecipient);
            emit TokensMinted(recipients[i], amountPerRecipient);
        }
    }

    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 maxSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY
        );
    }
}
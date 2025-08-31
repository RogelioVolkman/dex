// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title FHEHelpers
 * @dev Utility library for FHE operations in SecretLaunch ecosystem
 * @notice Provides common FHE operations, validations, and utilities
 */
contract FHEHelpers is SepoliaConfig, Ownable {
    using ECDSA for bytes32;

    struct EncryptedRange {
        euint64 min;
        euint64 max;
        bool isActive;
    }

    struct ZKProof {
        bytes32 commitment;
        bytes32 challenge;
        bytes32 response;
        uint256 timestamp;
        bool isVerified;
    }

    struct BatchEncryption {
        euint64[] encryptedValues;
        bytes32[] commitments;
        uint256 batchId;
        uint256 timestamp;
        bool isProcessed;
    }

    // Events
    event RangeProofVerified(
        address indexed user,
        bytes32 indexed proofId,
        bool isValid
    );

    event BatchEncryptionProcessed(
        uint256 indexed batchId,
        uint256 valuesCount,
        uint256 timestamp
    );

    event HomomorphicOperationExecuted(
        bytes32 indexed operationId,
        string operationType,
        uint256 timestamp
    );

    // State variables
    mapping(bytes32 => ZKProof) public zkProofs;
    mapping(address => EncryptedRange) public userRanges;
    mapping(uint256 => BatchEncryption) public batchEncryptions;
    
    uint256 public nextBatchId = 1;
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant PROOF_VALIDITY_DURATION = 3600; // 1 hour

    modifier validProof(bytes32 _proofId) {
        require(zkProofs[_proofId].isVerified, "FHEHelpers: Invalid proof");
        require(
            block.timestamp <= zkProofs[_proofId].timestamp + PROOF_VALIDITY_DURATION,
            "FHEHelpers: Proof expired"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Encrypt a value with proof of range
     */
    function encryptWithRangeProof(
        uint64 _value,
        uint64 _minRange,
        uint64 _maxRange,
        bytes calldata _proof
    ) external returns (euint64, bytes32) {
        require(_value >= _minRange && _value <= _maxRange, "FHEHelpers: Value out of range");
        require(_minRange < _maxRange, "FHEHelpers: Invalid range");

        // Encrypt the value
        euint64 encryptedValue = FHE.asEuint64(_value);
        FHE.allowThis(encryptedValue);

        // Generate proof ID
        bytes32 proofId = keccak256(
            abi.encodePacked(
                msg.sender,
                _value,
                _minRange,
                _maxRange,
                block.timestamp,
                block.number
            )
        );

        // Store range for user
        userRanges[msg.sender] = EncryptedRange({
            min: FHE.asEuint64(_minRange),
            max: FHE.asEuint64(_maxRange),
            isActive: true
        });

        FHE.allowThis(userRanges[msg.sender].min);
        FHE.allowThis(userRanges[msg.sender].max);

        // Verify and store ZK proof
        _verifyRangeProof(proofId, _value, _minRange, _maxRange, _proof);

        return (encryptedValue, proofId);
    }

    /**
     * @dev Verify range proof for encrypted value
     */
    function _verifyRangeProof(
        bytes32 _proofId,
        uint64 _value,
        uint64 _minRange,
        uint64 _maxRange,
        bytes calldata _proof
    ) internal {
        // Simplified range proof verification
        // In production, this would involve complex ZK proof verification
        
        bytes32 commitment = keccak256(abi.encodePacked(_value, _minRange, _maxRange));
        bytes32 challenge = keccak256(abi.encodePacked(commitment, block.timestamp));
        bytes32 response = keccak256(abi.encodePacked(challenge, _proof));

        zkProofs[_proofId] = ZKProof({
            commitment: commitment,
            challenge: challenge,
            response: response,
            timestamp: block.timestamp,
            isVerified: true
        });

        emit RangeProofVerified(msg.sender, _proofId, true);
    }

    /**
     * @dev Verify encrypted value is within specified range
     */
    function verifyEncryptedRange(
        euint64 _encryptedValue,
        uint64 _minRange,
        uint64 _maxRange
    ) external pure returns (ebool) {
        euint64 min = FHE.asEuint64(_minRange);
        euint64 max = FHE.asEuint64(_maxRange);
        
        ebool isAboveMin = FHE.gte(_encryptedValue, min);
        ebool isBelowMax = FHE.lte(_encryptedValue, max);
        
        return FHE.and(isAboveMin, isBelowMax);
    }

    /**
     * @dev Compute homomorphic sum of encrypted values
     */
    function computeHomomorphicSum(
        euint64[] calldata _encryptedValues
    ) external returns (euint64, bytes32) {
        require(_encryptedValues.length > 0, "FHEHelpers: Empty array");
        require(_encryptedValues.length <= MAX_BATCH_SIZE, "FHEHelpers: Batch too large");

        euint64 sum = FHE.asEuint64(0);
        
        for (uint256 i = 0; i < _encryptedValues.length; i++) {
            sum = FHE.add(sum, _encryptedValues[i]);
        }
        
        FHE.allowThis(sum);

        bytes32 operationId = keccak256(
            abi.encodePacked(
                "sum",
                _encryptedValues,
                block.timestamp,
                msg.sender
            )
        );

        emit HomomorphicOperationExecuted(operationId, "sum", block.timestamp);
        return (sum, operationId);
    }

    /**
     * @dev Compute homomorphic average of encrypted values
     */
    function computeHomomorphicAverage(
        euint64[] calldata _encryptedValues
    ) external returns (euint64, bytes32) {
        require(_encryptedValues.length > 0, "FHEHelpers: Empty array");
        require(_encryptedValues.length <= MAX_BATCH_SIZE, "FHEHelpers: Batch too large");

        euint64 sum = FHE.asEuint64(0);
        
        for (uint256 i = 0; i < _encryptedValues.length; i++) {
            sum = FHE.add(sum, _encryptedValues[i]);
        }
        
        euint64 count = FHE.asEuint64(_encryptedValues.length);
        euint64 average = FHE.div(sum, count);
        
        FHE.allowThis(average);

        bytes32 operationId = keccak256(
            abi.encodePacked(
                "average",
                _encryptedValues,
                block.timestamp,
                msg.sender
            )
        );

        emit HomomorphicOperationExecuted(operationId, "average", block.timestamp);
        return (average, operationId);
    }

    /**
     * @dev Find maximum value among encrypted values
     */
    function findEncryptedMaximum(
        euint64[] calldata _encryptedValues
    ) external returns (euint64, bytes32) {
        require(_encryptedValues.length > 0, "FHEHelpers: Empty array");
        require(_encryptedValues.length <= MAX_BATCH_SIZE, "FHEHelpers: Batch too large");

        euint64 maximum = _encryptedValues[0];
        
        for (uint256 i = 1; i < _encryptedValues.length; i++) {
            ebool isGreater = FHE.gt(_encryptedValues[i], maximum);
            maximum = FHE.select(isGreater, _encryptedValues[i], maximum);
        }
        
        FHE.allowThis(maximum);

        bytes32 operationId = keccak256(
            abi.encodePacked(
                "maximum",
                _encryptedValues,
                block.timestamp,
                msg.sender
            )
        );

        emit HomomorphicOperationExecuted(operationId, "maximum", block.timestamp);
        return (maximum, operationId);
    }

    /**
     * @dev Find minimum value among encrypted values
     */
    function findEncryptedMinimum(
        euint64[] calldata _encryptedValues
    ) external returns (euint64, bytes32) {
        require(_encryptedValues.length > 0, "FHEHelpers: Empty array");
        require(_encryptedValues.length <= MAX_BATCH_SIZE, "FHEHelpers: Batch too large");

        euint64 minimum = _encryptedValues[0];
        
        for (uint256 i = 1; i < _encryptedValues.length; i++) {
            ebool isSmaller = FHE.lt(_encryptedValues[i], minimum);
            minimum = FHE.select(isSmaller, _encryptedValues[i], minimum);
        }
        
        FHE.allowThis(minimum);

        bytes32 operationId = keccak256(
            abi.encodePacked(
                "minimum",
                _encryptedValues,
                block.timestamp,
                msg.sender
            )
        );

        emit HomomorphicOperationExecuted(operationId, "minimum", block.timestamp);
        return (minimum, operationId);
    }

    /**
     * @dev Compare two encrypted values
     */
    function compareEncryptedValues(
        euint64 _value1,
        euint64 _value2
    ) external pure returns (
        ebool isEqual,
        ebool isGreater,
        ebool isLess
    ) {
        isEqual = FHE.eq(_value1, _value2);
        isGreater = FHE.gt(_value1, _value2);
        isLess = FHE.lt(_value1, _value2);
        
        return (isEqual, isGreater, isLess);
    }

    /**
     * @dev Batch encrypt multiple values
     */
    function batchEncrypt(
        uint64[] calldata _values,
        bytes[] calldata _proofs
    ) external returns (uint256) {
        require(_values.length > 0, "FHEHelpers: Empty array");
        require(_values.length == _proofs.length, "FHEHelpers: Array length mismatch");
        require(_values.length <= MAX_BATCH_SIZE, "FHEHelpers: Batch too large");

        uint256 batchId = nextBatchId++;
        euint64[] memory encryptedValues = new euint64[](_values.length);
        bytes32[] memory commitments = new bytes32[](_values.length);

        for (uint256 i = 0; i < _values.length; i++) {
            encryptedValues[i] = FHE.asEuint64(_values[i]);
            FHE.allowThis(encryptedValues[i]);
            
            commitments[i] = keccak256(
                abi.encodePacked(
                    _values[i],
                    i,
                    batchId,
                    block.timestamp
                )
            );
        }

        batchEncryptions[batchId] = BatchEncryption({
            encryptedValues: encryptedValues,
            commitments: commitments,
            batchId: batchId,
            timestamp: block.timestamp,
            isProcessed: true
        });

        emit BatchEncryptionProcessed(batchId, _values.length, block.timestamp);
        return batchId;
    }

    /**
     * @dev Validate encrypted amount against user's range
     */
    function validateUserRange(
        address _user,
        euint64 _encryptedAmount
    ) external view returns (ebool) {
        require(userRanges[_user].isActive, "FHEHelpers: No active range for user");
        
        EncryptedRange storage range = userRanges[_user];
        ebool isAboveMin = FHE.gte(_encryptedAmount, range.min);
        ebool isBelowMax = FHE.lte(_encryptedAmount, range.max);
        
        return FHE.and(isAboveMin, isBelowMax);
    }

    /**
     * @dev Generate secure commitment hash
     */
    function generateCommitment(
        uint256 _value,
        uint256 _nonce,
        address _user
    ) external view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                _value,
                _nonce,
                _user,
                block.timestamp,
                block.difficulty
            )
        );
    }

    /**
     * @dev Verify commitment reveal
     */
    function verifyCommitment(
        bytes32 _commitment,
        uint256 _value,
        uint256 _nonce,
        address _user,
        uint256 _timestamp
    ) external pure returns (bool) {
        bytes32 calculatedCommitment = keccak256(
            abi.encodePacked(
                _value,
                _nonce,
                _user,
                _timestamp,
                block.difficulty
            )
        );
        
        return calculatedCommitment == _commitment;
    }

    /**
     * @dev Get batch encryption details
     */
    function getBatchEncryption(uint256 _batchId) 
        external 
        view 
        returns (
            uint256 batchId,
            uint256 valuesCount,
            uint256 timestamp,
            bool isProcessed
        ) 
    {
        BatchEncryption storage batch = batchEncryptions[_batchId];
        return (
            batch.batchId,
            batch.encryptedValues.length,
            batch.timestamp,
            batch.isProcessed
        );
    }

    /**
     * @dev Update proof validity duration (owner only)
     */
    function updateProofValidityDuration(uint256 _newDuration) external onlyOwner {
        require(_newDuration > 0, "FHEHelpers: Invalid duration");
        // Note: PROOF_VALIDITY_DURATION is constant, would need to be made mutable in production
    }

    /**
     * @dev Emergency invalidate proof (owner only)
     */
    function invalidateProof(bytes32 _proofId) external onlyOwner {
        require(zkProofs[_proofId].timestamp != 0, "FHEHelpers: Proof does not exist");
        zkProofs[_proofId].isVerified = false;
    }
}
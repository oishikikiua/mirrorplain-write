// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title MirrorPlain Write - Writing Analytics with FHE
/// @notice Encrypted writing statistics (word count & time) with milestone tracking
/// @dev Uses FHEVM native operations for privacy-preserving analytics
/// @author oishikikiua
contract MirrorPlainWrite is ZamaEthereumConfig {
    // Core encrypted state
    mapping(address => euint32) private userTotalWords;
    mapping(address => euint32) private userTotalTime;
    mapping(address => euint32) private userWeeklyGoal;
    mapping(address => euint32) private userMonthlyGoal;

    // Entry structure
    struct Entry {
        euint32 words;
        euint32 duration;
        uint256 timestamp;
    }
    mapping(address => Entry[]) private userEntries;

    // Authorization management
    mapping(address => mapping(address => bool)) public mentorAllowances;

    // Events
    event EntrySubmitted(address indexed user, uint256 indexed entryIndex, uint256 timestamp);
    event GoalsUpdated(address indexed user);
    event MilestoneAchieved(address indexed user, uint256 milestoneId, uint256 timestamp);
    event MentorAuthorized(address indexed user, address indexed mentor);
    event AccessRevoked(address indexed user, address indexed mentor);

    /// @notice Submit encrypted writing entry (word count + duration)
    /// @param encryptedWords Encrypted word count (euint32)
    /// @param encryptedDuration Encrypted duration in seconds (euint32)
    /// @param timestamp Entry timestamp
    function submitEntry(
        externalEuint32 encryptedWords,
        bytes calldata wordsProof,
        externalEuint32 encryptedDuration,
        bytes calldata durationProof,
        uint256 timestamp
    ) external {
        euint32 words = FHE.fromExternal(encryptedWords, wordsProof);
        euint32 duration = FHE.fromExternal(encryptedDuration, durationProof);

        // Accumulate to user totals
        userTotalWords[msg.sender] = FHE.add(userTotalWords[msg.sender], words);
        userTotalTime[msg.sender] = FHE.add(userTotalTime[msg.sender], duration);

        // Store individual entry
        userEntries[msg.sender].push(Entry({
            words: words,
            duration: duration,
            timestamp: timestamp
        }));

        // Allow user and contract to access updated totals
        FHE.allowThis(userTotalWords[msg.sender]);
        FHE.allow(userTotalWords[msg.sender], msg.sender);
        FHE.allowThis(userTotalTime[msg.sender]);
        FHE.allow(userTotalTime[msg.sender], msg.sender);

        // Allow access to entry
        FHE.allowThis(words);
        FHE.allow(words, msg.sender);
        FHE.allowThis(duration);
        FHE.allow(duration, msg.sender);

        emit EntrySubmitted(msg.sender, userEntries[msg.sender].length - 1, timestamp);
    }

    /// @notice Set weekly and monthly goals (encrypted)
    /// @param encryptedWeeklyGoal Encrypted weekly word count goal
    /// @param encryptedMonthlyGoal Encrypted monthly word count goal
    function setGoals(
        externalEuint32 encryptedWeeklyGoal,
        bytes calldata weeklyProof,
        externalEuint32 encryptedMonthlyGoal,
        bytes calldata monthlyProof
    ) external {
        userWeeklyGoal[msg.sender] = FHE.fromExternal(encryptedWeeklyGoal, weeklyProof);
        userMonthlyGoal[msg.sender] = FHE.fromExternal(encryptedMonthlyGoal, monthlyProof);

        // Allow user to access goals
        FHE.allowThis(userWeeklyGoal[msg.sender]);
        FHE.allow(userWeeklyGoal[msg.sender], msg.sender);
        FHE.allowThis(userMonthlyGoal[msg.sender]);
        FHE.allow(userMonthlyGoal[msg.sender], msg.sender);

        emit GoalsUpdated(msg.sender);
    }

    /// @notice Check if milestone threshold is reached (encrypted comparison)
    /// @param milestoneId Milestone identifier
    /// @param encryptedThreshold Encrypted threshold to compare against
    /// @return ebool Encrypted boolean result
    function checkMilestone(
        uint256 milestoneId,
        externalEuint32 encryptedThreshold,
        bytes calldata thresholdProof
    ) external returns (ebool) {
        euint32 threshold = FHE.fromExternal(encryptedThreshold, thresholdProof);
        
        // Compare total words with threshold
        ebool achieved = FHE.gt(userTotalWords[msg.sender], threshold);
        
        // Allow user to decrypt result
        FHE.allowThis(achieved);
        FHE.allow(achieved, msg.sender);

        // Note: Actual milestone achievement detection would require decryption off-chain
        // This returns an encrypted boolean that user can decrypt client-side
        
        emit MilestoneAchieved(msg.sender, milestoneId, block.timestamp);
        
        return achieved;
    }

    /// @notice Authorize mentor/editor to view aggregated data
    /// @param mentorAddress Address to grant access
    function allowMentor(address mentorAddress) external {
        require(mentorAddress != address(0), "Invalid mentor address");
        require(mentorAddress != msg.sender, "Cannot authorize self");

        mentorAllowances[msg.sender][mentorAddress] = true;

        // Grant FHE allowance for aggregated data
        FHE.allow(userTotalWords[msg.sender], mentorAddress);
        FHE.allow(userTotalTime[msg.sender], mentorAddress);

        emit MentorAuthorized(msg.sender, mentorAddress);
    }

    /// @notice Revoke mentor access (note: FHE.allow is irreversible, but we track intent)
    /// @param mentorAddress Address to revoke
    function revokeAccess(address mentorAddress) external {
        mentorAllowances[msg.sender][mentorAddress] = false;
        emit AccessRevoked(msg.sender, mentorAddress);
    }

    /// @notice Get user's total encrypted word count
    /// @param user User address
    /// @return euint32 Encrypted total words
    function getUserTotalWords(address user) external view returns (euint32) {
        return userTotalWords[user];
    }

    /// @notice Get user's total encrypted writing time
    /// @param user User address
    /// @return euint32 Encrypted total time (seconds)
    function getUserTotalTime(address user) external view returns (euint32) {
        return userTotalTime[user];
    }

    /// @notice Get user's weekly goal
    /// @param user User address
    /// @return euint32 Encrypted weekly goal
    function getUserWeeklyGoal(address user) external view returns (euint32) {
        return userWeeklyGoal[user];
    }

    /// @notice Get user's monthly goal
    /// @param user User address
    /// @return euint32 Encrypted monthly goal
    function getUserMonthlyGoal(address user) external view returns (euint32) {
        return userMonthlyGoal[user];
    }

    /// @notice Get user's entry count
    /// @param user User address
    /// @return uint256 Number of entries
    function getUserEntryCount(address user) external view returns (uint256) {
        return userEntries[user].length;
    }

    /// @notice Get specific entry data
    /// @param user User address
    /// @param index Entry index
    /// @return words Encrypted word count
    /// @return duration Encrypted duration
    /// @return timestamp Entry timestamp
    function getUserEntry(address user, uint256 index) 
        external 
        view 
        returns (euint32 words, euint32 duration, uint256 timestamp) 
    {
        require(index < userEntries[user].length, "Entry index out of bounds");
        Entry memory entry = userEntries[user][index];
        return (entry.words, entry.duration, entry.timestamp);
    }

    /// @notice Check if mentor is authorized
    /// @param user User address
    /// @param mentor Mentor address
    /// @return bool Authorization status
    function isMentorAuthorized(address user, address mentor) external view returns (bool) {
        return mentorAllowances[user][mentor];
    }
}


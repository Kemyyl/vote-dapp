// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title VotingSimple - Contrat de vote décentralisé
contract VotingSimple {
    address public owner;
    bool public votingOpen;

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;

    event VoterRegistered(address indexed voter);
    event VotingStarted();
    event VotingStopped();
    event VoteCast(address indexed voter, uint256 indexed candidateIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyVoter() {
        require(registeredVoters[msg.sender], "Not a registered voter");
        _;
    }

    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({ name: _candidateNames[i], voteCount: 0 }));
        }
    }

    /// @notice L'admin enregistre un électeur
    function addVoter(address _voter) external onlyOwner {
        require(!registeredVoters[_voter], "Already registered");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    /// @notice L'admin ouvre le vote
    function startVoting() external onlyOwner {
        require(!votingOpen, "Voting already open");
        votingOpen = true;
        emit VotingStarted();
    }

    /// @notice L'admin ferme le vote
    function stopVoting() external onlyOwner {
        require(votingOpen, "Voting is not open");
        votingOpen = false;
        emit VotingStopped();
    }

    /// @notice Un électeur inscrit vote pour un candidat
    function vote(uint256 _candidateIndex) external onlyVoter votingIsOpen {
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateIndex < candidates.length, "Invalid candidate");

        // Checks-Effects-Interactions pattern
        hasVoted[msg.sender] = true;
        candidates[_candidateIndex].voteCount++;

        emit VoteCast(msg.sender, _candidateIndex);
    }

    /// @notice Retourne le nombre de candidats
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /// @notice Retourne le nom et le nombre de votes d'un candidat
    function getCandidate(uint256 _index) external view returns (string memory name, uint256 voteCount) {
        require(_index < candidates.length, "Invalid candidate");
        Candidate storage c = candidates[_index];
        return (c.name, c.voteCount);
    }

    /// @notice Retourne le candidat avec le plus de votes
    function getWinner() external view returns (uint256 winnerIndex, string memory winnerName, uint256 winnerVotes) {
        require(candidates.length > 0, "No candidates");
        uint256 maxVotes = 0;
        winnerIndex = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }
        winnerName = candidates[winnerIndex].name;
        winnerVotes = candidates[winnerIndex].voteCount;
    }
}

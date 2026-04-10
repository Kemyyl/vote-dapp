// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title VotingSimple - Contrat de vote décentralisé avec phases et validation
contract VotingSimple {

    // ─── Phases ───────────────────────────────────────────────────────────────

    enum WorkflowStatus {
        RegisteringVoters,    // 0 — inscriptions ouvertes
        VotingSessionStarted, // 1 — vote en cours
        VotingSessionEnded    // 2 — vote terminé
    }

    // ─── Variables d'état ─────────────────────────────────────────────────────

    address public owner;
    WorkflowStatus public workflowStatus;

    struct Candidate {
        string name;
        string description;
        address candidateAddress;
        uint256 voteCount;
    }

    struct PendingCandidateInfo {
        string name;
        string description;
        bool exists;
    }

    Candidate[] public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public registrationRequested;
    address[] public registrationRequestList;
    mapping(address => PendingCandidateInfo) public pendingCandidateInfo;
    address[] public pendingCandidateList;

    // ─── Events ───────────────────────────────────────────────────────────────

    event VoterRegistered(address indexed voter);
    event VoterRegistrationRequested(address indexed voter);
    event VoterRegistrationRejected(address indexed voter);
    event CandidateApplicationSubmitted(address indexed candidateAddress, string name);
    event CandidateApproved(address indexed candidateAddress, string name);
    event CandidateRejected(address indexed candidateAddress);
    event CandidateRemoved(uint256 indexed candidateIndex, string name);
    event WorkflowStatusChanged(uint8 previousStatus, uint8 newStatus);
    event VotingStarted();
    event VotingStopped();
    event VoteCast(address indexed voter, uint256 indexed candidateIndex);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyVoter() {
        require(registeredVoters[msg.sender], "Not a registered voter");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(string[] memory _candidateNames) {
        owner = msg.sender;
        workflowStatus = WorkflowStatus.RegisteringVoters;
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                description: "",
                candidateAddress: address(0),
                voteCount: 0
            }));
        }
    }

    // ─── Vue de rétrocompatibilité ────────────────────────────────────────────

    function votingOpen() external view returns (bool) {
        return workflowStatus == WorkflowStatus.VotingSessionStarted;
    }

    // ─── Inscriptions électeurs ───────────────────────────────────────────────

    /// @notice N'importe qui peut demander à être électeur
    function requestRegistration() external {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        require(!registeredVoters[msg.sender], "Already registered");
        require(!registrationRequested[msg.sender], "Already requested");
        registrationRequested[msg.sender] = true;
        registrationRequestList.push(msg.sender);
        emit VoterRegistrationRequested(msg.sender);
    }

    /// @notice L'admin valide et inscrit un électeur
    function addVoter(address _voter) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        require(!registeredVoters[_voter], "Already registered");
        registeredVoters[_voter] = true;
        _removeRegistrationRequest(_voter);
        emit VoterRegistered(_voter);
    }

    /// @notice L'admin rejette une demande d'inscription
    function rejectRegistration(address _voter) external onlyOwner {
        require(registrationRequested[_voter], "No request found");
        _removeRegistrationRequest(_voter);
        registrationRequested[_voter] = false;
        emit VoterRegistrationRejected(_voter);
    }

    /// @notice Supprime une entrée de la liste de demandes d'inscription
    function _removeRegistrationRequest(address _voter) internal {
        for (uint256 i = 0; i < registrationRequestList.length; i++) {
            if (registrationRequestList[i] == _voter) {
                registrationRequestList[i] = registrationRequestList[registrationRequestList.length - 1];
                registrationRequestList.pop();
                break;
            }
        }
    }

    /// @notice L'admin approuve toutes les demandes d'inscription en une seule transaction
    function approveAllRegistrations() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        uint256 len = registrationRequestList.length;
        require(len > 0, "No pending registrations");
        for (uint256 i = 0; i < len; i++) {
            address voter = registrationRequestList[i];
            registeredVoters[voter] = true;
            emit VoterRegistered(voter);
        }
        delete registrationRequestList;
    }

    /// @notice Retourne toutes les demandes d'inscription en attente
    function getRegistrationRequests() external view returns (address[] memory) {
        return registrationRequestList;
    }

    // ─── Candidatures ─────────────────────────────────────────────────────────

    /// @notice Un candidat soumet sa candidature (en attente de validation admin)
    function registerAsCandidate(string memory _name, string memory _description) external {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        require(bytes(_name).length > 0, "Name required");
        require(!pendingCandidateInfo[msg.sender].exists, "Application already submitted");
        for (uint256 i = 0; i < candidates.length; i++) {
            require(candidates[i].candidateAddress != msg.sender, "Already a candidate");
        }
        pendingCandidateInfo[msg.sender] = PendingCandidateInfo({
            name: _name,
            description: _description,
            exists: true
        });
        pendingCandidateList.push(msg.sender);
        emit CandidateApplicationSubmitted(msg.sender, _name);
    }

    /// @notice L'admin approuve une candidature
    function approveCandidate(address _candidate) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        require(pendingCandidateInfo[_candidate].exists, "No application found");
        string memory name = pendingCandidateInfo[_candidate].name;
        string memory description = pendingCandidateInfo[_candidate].description;
        candidates.push(Candidate({
            name: name,
            description: description,
            candidateAddress: _candidate,
            voteCount: 0
        }));
        _removePending(_candidate);
        emit CandidateApproved(_candidate, name);
    }

    /// @notice L'admin rejette une candidature
    function rejectCandidate(address _candidate) external onlyOwner {
        require(pendingCandidateInfo[_candidate].exists, "No application found");
        _removePending(_candidate);
        emit CandidateRejected(_candidate);
    }

    /// @notice L'admin supprime un candidat validé (uniquement en phase d'inscription)
    function removeCandidate(uint256 _index) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Registration is closed");
        require(_index < candidates.length, "Invalid candidate");
        string memory removedName = candidates[_index].name;
        candidates[_index] = candidates[candidates.length - 1];
        candidates.pop();
        emit CandidateRemoved(_index, removedName);
    }

    /// @notice Supprime une entrée de la liste d'attente
    function _removePending(address _candidate) internal {
        for (uint256 i = 0; i < pendingCandidateList.length; i++) {
            if (pendingCandidateList[i] == _candidate) {
                pendingCandidateList[i] = pendingCandidateList[pendingCandidateList.length - 1];
                pendingCandidateList.pop();
                break;
            }
        }
        delete pendingCandidateInfo[_candidate];
    }

    // ─── Gestion du vote ──────────────────────────────────────────────────────

    function startVoting() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Wrong phase");
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChanged(0, 1);
        emit VotingStarted();
    }

    function stopVoting() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Voting is not open");
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChanged(1, 2);
        emit VotingStopped();
    }

    function reopenRegistration() external onlyOwner {
        require(workflowStatus != WorkflowStatus.RegisteringVoters, "Already in registration phase");
        uint8 prev = uint8(workflowStatus);
        workflowStatus = WorkflowStatus.RegisteringVoters;
        emit WorkflowStatusChanged(prev, 0);
    }

    // ─── Vote ─────────────────────────────────────────────────────────────────

    function vote(uint256 _candidateIndex) external onlyVoter {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Voting is not open");
        require(!hasVoted[msg.sender], "Already voted");
        require(_candidateIndex < candidates.length, "Invalid candidate");
        hasVoted[msg.sender] = true;
        candidates[_candidateIndex].voteCount++;
        emit VoteCast(msg.sender, _candidateIndex);
    }

    // ─── Lecture ──────────────────────────────────────────────────────────────

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _index) external view returns (
        string memory name,
        string memory description,
        address candidateAddress,
        uint256 voteCount
    ) {
        require(_index < candidates.length, "Invalid candidate");
        Candidate storage c = candidates[_index];
        return (c.name, c.description, c.candidateAddress, c.voteCount);
    }

    /// @notice Retourne toutes les candidatures en attente de validation
    function getPendingCandidates() external view returns (
        address[] memory addrs,
        string[] memory names,
        string[] memory descriptions
    ) {
        uint256 len = pendingCandidateList.length;
        addrs       = new address[](len);
        names       = new string[](len);
        descriptions = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            addrs[i]        = pendingCandidateList[i];
            names[i]        = pendingCandidateInfo[pendingCandidateList[i]].name;
            descriptions[i] = pendingCandidateInfo[pendingCandidateList[i]].description;
        }
    }

    function getWinner() external view returns (
        uint256 winnerIndex,
        string memory winnerName,
        uint256 winnerVotes
    ) {
        require(candidates.length > 0, "No candidates");
        uint256 maxVotes = 0;
        winnerIndex = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }
        winnerName  = candidates[winnerIndex].name;
        winnerVotes = candidates[winnerIndex].voteCount;
    }
}

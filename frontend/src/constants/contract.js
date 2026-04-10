// Mettez à jour cette adresse après avoir déployé le contrat sur Sepolia
export const CONTRACT_ADDRESS = "0x4B89E637713731B1eaC9F6370Ca6E1b31193d8ff";

// ABI en format human-readable (accepté par ethers.js v6)
export const CONTRACT_ABI = [
  // Getters d'état
  "function owner() view returns (address)",
  "function workflowStatus() view returns (uint8)",
  "function registeredVoters(address) view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function registrationRequested(address) view returns (bool)",
  "function pendingCandidateInfo(address) view returns (string name, string description, bool exists)",

  // Vue de rétrocompatibilité
  "function votingOpen() view returns (bool)",

  // Fonctions admin
  "function addVoter(address _voter)",
  "function rejectRegistration(address _voter)",
  "function startVoting()",
  "function stopVoting()",
  "function approveCandidate(address _candidate)",
  "function rejectCandidate(address _candidate)",
  "function removeCandidate(uint256 _index)",

  // Fonctions publiques
  "function requestRegistration()",
  "function registerAsCandidate(string _name, string _description)",
  "function vote(uint256 _candidateIndex)",

  // Fonctions de lecture
  "function getCandidateCount() view returns (uint256)",
  "function getCandidate(uint256 _index) view returns (string name, string description, address candidateAddress, uint256 voteCount)",
  "function getPendingCandidates() view returns (address[] addrs, string[] names, string[] descriptions)",
  "function getRegistrationRequests() view returns (address[] addrs)",
  "function getWinner() view returns (uint256 winnerIndex, string winnerName, uint256 winnerVotes)",

  // Events
  "event VoterRegistered(address indexed voter)",
  "event VoterRegistrationRequested(address indexed voter)",
  "event VoterRegistrationRejected(address indexed voter)",
  "event CandidateApplicationSubmitted(address indexed candidateAddress, string name)",
  "event CandidateApproved(address indexed candidateAddress, string name)",
  "event CandidateRejected(address indexed candidateAddress)",
  "event CandidateRemoved(uint256 indexed candidateIndex, string name)",
  "event WorkflowStatusChanged(uint8 previousStatus, uint8 newStatus)",
  "event VotingStarted()",
  "event VotingStopped()",
  "event VoteCast(address indexed voter, uint256 indexed candidateIndex)",
];

// Mettez à jour cette adresse après avoir déployé le contrat sur Sepolia
export const CONTRACT_ADDRESS = "0x5B4Ecc45c169183786F0d3064FB8F6eb5C2d4A03";

// ABI en format human-readable (accepté par ethers.js v6)
export const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function votingOpen() view returns (bool)",
  "function registeredVoters(address) view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function addVoter(address _voter)",
  "function startVoting()",
  "function vote(uint256 _candidateIndex)",
  "function getCandidateCount() view returns (uint256)",
  "function getCandidate(uint256 _index) view returns (string name, uint256 voteCount)",
  "function getWinner() view returns (uint256 winnerIndex, string winnerName, uint256 winnerVotes)",
  "event VoterRegistered(address indexed voter)",
  "event VotingStarted()",
  "event VoteCast(address indexed voter, uint256 indexed candidateIndex)",
];

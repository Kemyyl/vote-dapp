// Mettez à jour cette adresse après avoir déployé le contrat sur Sepolia
export const CONTRACT_ADDRESS = "0x527404B145aB41d335603BDcA9C38BDA92500195";

// ABI en format human-readable (accepté par ethers.js v6)
export const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function votingOpen() view returns (bool)",
  "function registeredVoters(address) view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function addVoter(address _voter)",
  "function startVoting()",
  "function stopVoting()",
  "function vote(uint256 _candidateIndex)",
  "function getCandidateCount() view returns (uint256)",
  "function getCandidate(uint256 _index) view returns (string name, uint256 voteCount)",
  "function getWinner() view returns (uint256 winnerIndex, string winnerName, uint256 winnerVotes)",
  "event VoterRegistered(address indexed voter)",
  "event VotingStarted()",
  "event VotingStopped()",
  "event VoteCast(address indexed voter, uint256 indexed candidateIndex)",
];

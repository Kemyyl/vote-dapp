import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";

const readContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/rpdhvjqawIxMu0N_DxhtI")
);

function parseError(err) {
  if (err.code === "ACTION_REJECTED") return "Transaction refusée par l'utilisateur.";
  if (err.reason) return err.reason;
  const msg = err.message || "";
  if (msg.includes("Already voted")) return "Vous avez déjà voté.";
  if (msg.includes("Not a registered voter")) return "Vous n'êtes pas inscrit comme électeur.";
  if (msg.includes("Not the owner")) return "Action réservée à l'administrateur.";
  if (msg.includes("Voting is not open")) return "Le vote n'est pas ouvert.";
  if (msg.includes("Already registered")) return "Cet électeur est déjà inscrit.";
  if (msg.includes("Voting already open")) return "Le vote est déjà ouvert.";
  return msg || "Une erreur est survenue.";
}

export function useVoting() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [votingOpen, setVotingOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isVoter, setIsVoter] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const refresh = useCallback(async (addr) => {
    const count = await readContract.getCandidateCount();
    const list = [];
    for (let i = 0; i < Number(count); i++) {
      const [name, voteCount] = await readContract.getCandidate(i);
      list.push({ id: i, name, voteCount: Number(voteCount) });
    }
    const ownerAddr = await readContract.owner();
    const [open, voter, voted] = await Promise.all([
      readContract.votingOpen(),
      readContract.registeredVoters(addr),
      readContract.hasVoted(addr),
    ]);
    setCandidates(list);
    setVotingOpen(open);
    setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
    setIsVoter(voter);
    setHasVoted(voted);
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);
    setTxHash(null);
    if (!window.ethereum) {
      setError("MetaMask n'est pas installé.");
      return;
    }
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setAccount(addr);
      setContract(c);
      await refresh(addr);
      readContract.on("VoterRegistered", () => refresh(addr));
      readContract.on("VotingStarted", () => refresh(addr));
      readContract.on("VoteCast", () => refresh(addr));
      window.ethereum.on("accountsChanged", () => window.location.reload());
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const sendTx = useCallback(async (txPromise) => {
    setError(null);
    setTxHash(null);
    setLoading(true);
    try {
      const tx = await txPromise;
      setTxHash(tx.hash);
      await tx.wait();
      await refresh(account);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, [account, refresh]);

  const addVoter = useCallback(
    (address) => contract && sendTx(contract.addVoter(address)),
    [contract, sendTx]
  );

  const startVoting = useCallback(
    () => contract && sendTx(contract.startVoting()),
    [contract, sendTx]
  );

  const vote = useCallback(
    (candidateId) => contract && sendTx(contract.vote(candidateId)),
    [contract, sendTx]
  );

  return {
    account, candidates, votingOpen, isOwner, isVoter, hasVoted,
    loading, error, txHash,
    connectWallet, addVoter, startVoting, vote,
  };
}

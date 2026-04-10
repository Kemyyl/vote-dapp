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
  if (msg.includes("Registration is closed")) return "Les inscriptions sont fermées.";
  if (msg.includes("Already requested")) return "Vous avez déjà soumis une demande d'inscription.";
  if (msg.includes("Application already submitted")) return "Vous avez déjà soumis une candidature.";
  if (msg.includes("Already a candidate")) return "Vous êtes déjà candidat.";
  if (msg.includes("No application found")) return "Aucune candidature trouvée pour cette adresse.";
  if (msg.includes("Name required")) return "Le nom est requis.";
  return msg || "Une erreur est survenue.";
}

export function useVoting() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [votingOpen, setVotingOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isVoter, setIsVoter] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [registrationRequested, setRegistrationRequested] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const refresh = useCallback(async (addr) => {
    // Candidats validés
    const count = await readContract.getCandidateCount();
    const list = [];
    for (let i = 0; i < Number(count); i++) {
      const [name, description, candidateAddress, voteCount] = await readContract.getCandidate(i);
      list.push({ id: i, name, description, candidateAddress, voteCount: Number(voteCount) });
    }

    // Demandes d'inscription en attente
    const regRequests = await readContract.getRegistrationRequests();
    setPendingRegistrations(Array.from(regRequests));

    // Candidats en attente
    const [pendingAddrs, pendingNames, pendingDescs] = await readContract.getPendingCandidates();
    const pending = Array.from(pendingAddrs).map((address, i) => ({
      address,
      name: pendingNames[i],
      description: pendingDescs[i],
    }));

    // Statuts
    const ownerAddr = await readContract.owner();
    const [status, open, voter, voted, requested, pendingInfo] = await Promise.all([
      readContract.workflowStatus(),
      readContract.votingOpen(),
      readContract.registeredVoters(addr),
      readContract.hasVoted(addr),
      readContract.registrationRequested(addr),
      readContract.pendingCandidateInfo(addr),
    ]);

    setCandidates(list);
    setPendingCandidates(pending);
    setWorkflowStatus(Number(status));
    setVotingOpen(open);
    setIsOwner(ownerAddr.toLowerCase() === addr.toLowerCase());
    setIsVoter(voter);
    setHasVoted(voted);
    setRegistrationRequested(requested);
    setHasPendingApplication(pendingInfo.exists);
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
      readContract.on("VoterRegistered",             () => refresh(addr));
      readContract.on("VoterRegistrationRequested",  () => refresh(addr));
      readContract.on("VoterRegistrationRejected",   () => refresh(addr));
      readContract.on("CandidateApplicationSubmitted", () => refresh(addr));
      readContract.on("CandidateApproved",           () => refresh(addr));
      readContract.on("CandidateRejected",           () => refresh(addr));
      readContract.on("CandidateRemoved",            () => refresh(addr));
      readContract.on("VotingStarted",               () => refresh(addr));
      readContract.on("VotingStopped",               () => refresh(addr));
      readContract.on("WorkflowStatusChanged",       () => refresh(addr));
      readContract.on("VoteCast",                    () => refresh(addr));
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

  const addVoter            = useCallback((address) => contract && sendTx(contract.addVoter(address)), [contract, sendTx]);
  const rejectRegistration  = useCallback((address) => contract && sendTx(contract.rejectRegistration(address)), [contract, sendTx]);
  const startVoting       = useCallback(() => contract && sendTx(contract.startVoting()), [contract, sendTx]);
  const stopVoting        = useCallback(() => contract && sendTx(contract.stopVoting()), [contract, sendTx]);
  const approveCandidate  = useCallback((address) => contract && sendTx(contract.approveCandidate(address)), [contract, sendTx]);
  const rejectCandidate   = useCallback((address) => contract && sendTx(contract.rejectCandidate(address)), [contract, sendTx]);
  const removeCandidate   = useCallback((index) => contract && sendTx(contract.removeCandidate(index)), [contract, sendTx]);
  const requestRegistration = useCallback(() => contract && sendTx(contract.requestRegistration()), [contract, sendTx]);
  const registerAsCandidate = useCallback((name, description) => contract && sendTx(contract.registerAsCandidate(name, description)), [contract, sendTx]);
  const vote              = useCallback((candidateId) => contract && sendTx(contract.vote(candidateId)), [contract, sendTx]);

  return {
    account, candidates, pendingCandidates, pendingRegistrations, votingOpen, workflowStatus,
    isOwner, isVoter, hasVoted, registrationRequested, hasPendingApplication,
    loading, error, txHash,
    connectWallet, addVoter, rejectRegistration, startVoting, stopVoting,
    approveCandidate, rejectCandidate, removeCandidate,
    requestRegistration, registerAsCandidate, vote,
  };
}

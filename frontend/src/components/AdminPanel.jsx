import { useState } from "react";

export default function AdminPanel({ onAddVoter, onStartVoting, onStopVoting, votingOpen, loading }) {
  const [voterAddress, setVoterAddress] = useState("");

  const handleAdd = async () => {
    if (!voterAddress.trim()) return;
    await onAddVoter(voterAddress.trim());
    setVoterAddress("");
  };

  return (
    <div className="panel admin-panel">
      <h2>Panel Administrateur</h2>

      <div className="panel-section">
        <h3>Ajouter un électeur</h3>
        <div className="input-row">
          <input
            type="text"
            placeholder="Adresse Ethereum (0x...)"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            disabled={loading}
            className="address-input"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !voterAddress.trim()}
            className="btn btn-primary"
          >
            {loading ? "..." : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Gestion du vote</h3>
        {!votingOpen ? (
          <button onClick={onStartVoting} disabled={loading} className="btn btn-success">
            {loading ? "..." : "Ouvrir le vote"}
          </button>
        ) : (
          <button onClick={onStopVoting} disabled={loading} className="btn btn-danger">
            {loading ? "..." : "Fermer le vote"}
          </button>
        )}
      </div>
    </div>
  );
}

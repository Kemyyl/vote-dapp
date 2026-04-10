import { useState } from "react";

export default function AdminPanel({
  onAddVoter, onRejectRegistration, onStartVoting, onStopVoting,
  onApproveCandidate, onRejectCandidate, onRemoveCandidate,
  votingOpen, workflowStatus, candidates, pendingCandidates, pendingRegistrations, loading,
}) {
  const [voterAddress, setVoterAddress] = useState("");
  const isRegistrationPhase = workflowStatus === 0;

  const handleAdd = async () => {
    if (!voterAddress.trim()) return;
    await onAddVoter(voterAddress.trim());
    setVoterAddress("");
  };

  return (
    <div className="panel admin-panel">
      <h2>Panel Administrateur</h2>

      {/* ── Ajouter un électeur ── */}
      {isRegistrationPhase && (
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
      )}

      {/* ── Demandes d'inscription ── */}
      {isRegistrationPhase && (
        <div className="panel-section">
          <h3>Demandes d&apos;inscription ({pendingRegistrations.length})</h3>
          {pendingRegistrations.length === 0 ? (
            <p className="muted">Aucune demande en attente.</p>
          ) : (
            <div className="pending-list">
              {pendingRegistrations.map((addr) => (
                <div key={addr} className="pending-card">
                  <code className="candidate-address">{addr.slice(0, 14)}...{addr.slice(-6)}</code>
                  <div className="action-row">
                    <button
                      onClick={() => onAddVoter(addr)}
                      disabled={loading}
                      className="btn btn-success"
                    >
                      {loading ? "..." : "Approuver"}
                    </button>
                    <button
                      onClick={() => onRejectRegistration(addr)}
                      disabled={loading}
                      className="btn btn-danger"
                    >
                      {loading ? "..." : "Rejeter"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Candidatures en attente ── */}
      {isRegistrationPhase && (
        <div className="panel-section">
          <h3>Candidatures en attente ({pendingCandidates.length})</h3>
          {pendingCandidates.length === 0 ? (
            <p className="muted">Aucune candidature en attente.</p>
          ) : (
            <div className="pending-list">
              {pendingCandidates.map((c) => (
                <div key={c.address} className="pending-card">
                  <div className="candidate-info">
                    <span className="candidate-name">{c.name}</span>
                    {c.description && (
                      <p className="candidate-description">{c.description}</p>
                    )}
                    <code className="candidate-address">{c.address.slice(0, 10)}...{c.address.slice(-6)}</code>
                  </div>
                  <div className="action-row">
                    <button
                      onClick={() => onApproveCandidate(c.address)}
                      disabled={loading}
                      className="btn btn-success"
                    >
                      {loading ? "..." : "Valider"}
                    </button>
                    <button
                      onClick={() => onRejectCandidate(c.address)}
                      disabled={loading}
                      className="btn btn-danger"
                    >
                      {loading ? "..." : "Rejeter"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Candidats validés ── */}
      {isRegistrationPhase && candidates.length > 0 && (
        <div className="panel-section">
          <h3>Candidats validés ({candidates.length})</h3>
          <div className="pending-list">
            {candidates.map((c) => (
              <div key={c.id} className="pending-card">
                <div className="candidate-info">
                  <span className="candidate-name">{c.name}</span>
                  {c.description && (
                    <p className="candidate-description">{c.description}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveCandidate(c.id)}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? "..." : "Supprimer"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gestion du vote ── */}
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

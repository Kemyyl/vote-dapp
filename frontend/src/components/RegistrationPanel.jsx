import { useState } from "react";

export default function RegistrationPanel({
  isVoter,
  registrationRequested,
  hasPendingApplication,
  onRequestRegistration,
  onRegisterAsCandidate,
  loading,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCandidate = async () => {
    if (!name.trim()) return;
    await onRegisterAsCandidate(name.trim(), description.trim());
    setName("");
    setDescription("");
  };

  return (
    <div className="panel registration-panel">
      <h2>Phase d&apos;inscription</h2>

      {!isVoter && (
        <div className="panel-section">
          <h3>Devenir électeur</h3>
          {registrationRequested ? (
            <p className="info-text">
              Demande envoyée — en attente de validation par l&apos;administrateur.
            </p>
          ) : (
            <button
              onClick={onRequestRegistration}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "..." : "Demander à voter"}
            </button>
          )}
        </div>
      )}

      <div className="panel-section">
        <h3>Se présenter comme candidat</h3>
        {hasPendingApplication ? (
          <p className="info-text">
            Votre candidature est en attente de validation par l&apos;administrateur.
          </p>
        ) : (
        <div className="candidate-form">
          <input
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="address-input"
          />
          <textarea
            placeholder="Votre programme (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            className="description-input"
            rows={3}
          />
          <button
            onClick={handleCandidate}
            disabled={loading || !name.trim()}
            className="btn btn-primary"
          >
            {loading ? "..." : "Se présenter"}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

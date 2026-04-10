export default function VoterPanel({ candidates, hasVoted, votingOpen, onVote, loading }) {
  if (hasVoted) {
    return (
      <div className="panel voter-panel">
        <h2>Mon vote</h2>
        <p className="voted-message">Vous avez déjà voté. Merci pour votre participation !</p>
      </div>
    );
  }

  if (!votingOpen) {
    return (
      <div className="panel voter-panel">
        <h2>Mon vote</h2>
        <p className="muted">Le vote n&apos;est pas encore ouvert.</p>
      </div>
    );
  }

  return (
    <div className="panel voter-panel">
      <h2>Voter</h2>
      <p className="muted">Choisissez votre candidat :</p>
      <div className="candidates-list">
        {candidates.map((c) => (
          <div key={c.id} className="candidate-vote-card">
            <div className="candidate-info">
              <span className="candidate-name">{c.name}</span>
              {c.description && (
                <p className="candidate-description">{c.description}</p>
              )}
            </div>
            <button
              onClick={() => onVote(c.id)}
              disabled={loading}
              className="btn btn-vote"
            >
              {loading ? "..." : "Voter"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

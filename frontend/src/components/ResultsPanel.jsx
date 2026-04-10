export default function ResultsPanel({ candidates }) {
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
  const maxVotes = candidates.length > 0 ? Math.max(...candidates.map((c) => c.voteCount)) : 0;

  return (
    <div className="panel results-panel">
      <h2>Résultats en temps réel</h2>
      <p className="total-votes">Total des votes : {totalVotes}</p>
      <div className="results-list">
        {candidates.map((c) => {
          const pct = totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * 100) : 0;
          const isWinner = c.voteCount === maxVotes && maxVotes > 0;
          return (
            <div key={c.id} className={`result-item ${isWinner ? "winner" : ""}`}>
              <div className="result-header">
                <span className="candidate-name">
                  {isWinner && <span className="trophy">🏆 </span>}
                  {c.name}
                </span>
                <span className="vote-count">
                  {c.voteCount} vote{c.voteCount !== 1 ? "s" : ""} ({pct}%)
                </span>
              </div>
              {c.description && (
                <p className="candidate-description">{c.description}</p>
              )}
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

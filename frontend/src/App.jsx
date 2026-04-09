import { useVoting } from "./hooks/useVoting";
import ConnectWallet from "./components/ConnectWallet";
import StatusBanner from "./components/StatusBanner";
import AdminPanel from "./components/AdminPanel";
import VoterPanel from "./components/VoterPanel";
import ResultsPanel from "./components/ResultsPanel";

function App() {
  const voting = useVoting();

  return (
    <div className="app">
      <header className="header">
        <h1>DApp de Vote</h1>
        <ConnectWallet
          account={voting.account}
          onConnect={voting.connectWallet}
          loading={voting.loading}
        />
      </header>

      {voting.account ? (
        <>
          <StatusBanner
            votingOpen={voting.votingOpen}
            isOwner={voting.isOwner}
            isVoter={voting.isVoter}
          />

          {voting.error && <div className="error-banner">{voting.error}</div>}

          {voting.txHash && (
            <div className="success-banner">
              Transaction envoyée :{" "}
              <code>
                {voting.txHash.slice(0, 20)}...{voting.txHash.slice(-6)}
              </code>
            </div>
          )}

          {voting.isOwner && (
            <AdminPanel
              onAddVoter={voting.addVoter}
              onStartVoting={voting.startVoting}
              votingOpen={voting.votingOpen}
              loading={voting.loading}
            />
          )}

          {voting.isVoter && (
            <VoterPanel
              candidates={voting.candidates}
              hasVoted={voting.hasVoted}
              votingOpen={voting.votingOpen}
              onVote={voting.vote}
              loading={voting.loading}
            />
          )}

          <ResultsPanel candidates={voting.candidates} />
        </>
      ) : (
        <div className="welcome">
          <p>Connectez votre wallet MetaMask pour participer au vote.</p>
        </div>
      )}
    </div>
  );
}

export default App;

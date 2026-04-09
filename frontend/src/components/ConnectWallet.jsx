export default function ConnectWallet({ account, onConnect, loading }) {
  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="connect-wallet">
      {account ? (
        <span className="address-badge">{truncate(account)}</span>
      ) : (
        <button onClick={onConnect} disabled={loading} className="btn btn-primary">
          {loading ? "Connexion..." : "Connecter MetaMask"}
        </button>
      )}
    </div>
  );
}

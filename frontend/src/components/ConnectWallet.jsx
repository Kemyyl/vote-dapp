import { useState } from "react";

export default function ConnectWallet({ account, onConnect, loading }) {
  const [noMetaMask, setNoMetaMask] = useState(false);
  const truncate = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleClick = () => {
    if (!window.ethereum) {
      setNoMetaMask(true);
      return;
    }
    setNoMetaMask(false);
    onConnect();
  };

  return (
    <div className="connect-wallet">
      {account ? (
        <span className="address-badge">{truncate(account)}</span>
      ) : (
        <>
          <button onClick={handleClick} disabled={loading} className="btn btn-primary">
            {loading ? "Connexion..." : "Connecter MetaMask"}
          </button>
          {noMetaMask && (
            <p style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.4rem" }}>
              MetaMask n&apos;est pas installé. Veuillez l&apos;installer pour continuer.
            </p>
          )}
        </>
      )}
    </div>
  );
}

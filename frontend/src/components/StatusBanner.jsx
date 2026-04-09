export default function StatusBanner({ votingOpen, isOwner, isVoter }) {
  const role = isOwner ? "ADMIN" : isVoter ? "ÉLECTEUR" : "VISITEUR";
  const roleClass = isOwner ? "role-admin" : isVoter ? "role-voter" : "role-visitor";

  return (
    <div className="status-banner">
      <div className={`vote-status ${votingOpen ? "open" : "closed"}`}>
        Vote&nbsp;: {votingOpen ? "OUVERT" : "FERMÉ"}
      </div>
      <div className={`role-badge ${roleClass}`}>{role}</div>
    </div>
  );
}

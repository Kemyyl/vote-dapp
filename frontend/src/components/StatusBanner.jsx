const PHASE_LABELS = ["Inscriptions ouvertes", "Vote en cours", "Vote terminé"];
const PHASE_CLASSES = ["phase-registering", "phase-voting", "phase-ended"];

export default function StatusBanner({ workflowStatus, isOwner, isVoter }) {
  const role = isOwner ? "ADMIN" : isVoter ? "ÉLECTEUR" : "VISITEUR";
  const roleClass = isOwner ? "role-admin" : isVoter ? "role-voter" : "role-visitor";
  const phase = Number(workflowStatus);

  return (
    <div className="status-banner">
      <div className={`vote-status ${PHASE_CLASSES[phase]}`}>
        {PHASE_LABELS[phase]}
      </div>
      <div className={`role-badge ${roleClass}`}>{role}</div>
    </div>
  );
}

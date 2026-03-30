import { AlertTriangle } from "lucide-react";

export const EmergencyFAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="emergency-fab"
      data-testid="emergency-fab"
      aria-label="Emergency Reference"
    >
      <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />
    </button>
  );
};

export default EmergencyFAB;

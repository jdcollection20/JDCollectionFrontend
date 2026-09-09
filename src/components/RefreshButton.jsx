import { RefreshCw } from "lucide-react";

export default function RefreshButton({ onClick, busy = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn-soft shrink-0"
      title="Refresh from server"
    >
      <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
      <span>{busy ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}

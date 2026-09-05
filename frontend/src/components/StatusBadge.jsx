const STATUS_STYLE_MAP = {
  new: "bg-secondary",
  draft: "bg-secondary",
  confirmed: "bg-primary",
  paid: "bg-success",
  posted: "bg-success",
  cancelled: "bg-danger",
  revised: "bg-warning text-dark",
};

const DEFAULT_STYLE = "bg-light text-dark border";

function StatusBadge({ status, className = "" }) {
  const normalizedKey = (status || "").toString().trim().toLowerCase();
  const styleClass = STATUS_STYLE_MAP[normalizedKey] || DEFAULT_STYLE;

  return (
    <span className={`badge ${styleClass} ${className}`.trim()}>
      {status}
    </span>
  );
}

export default StatusBadge;
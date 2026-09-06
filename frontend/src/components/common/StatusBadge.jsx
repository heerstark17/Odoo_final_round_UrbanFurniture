export default function StatusBadge({ status }) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  
  const classMap = {
    draft: "badge-draft",
    confirmed: "badge-confirmed",
    paid: "badge-paid",
    posted: "badge-posted",
    active: "badge-active",
    cancelled: "badge-cancelled",
    inactive: "badge-inactive",
    customer: "badge-customer",
    vendor: "badge-vendor",
    both: "badge-both",
    asset: "badge-customer",
    liability: "badge-cancelled",
    income: "badge-paid",
    expense: "badge-vendor",
    capital: "badge-both",
  };

  const badgeClass = classMap[s] || "badge-draft";

  return <span className={`badge ${badgeClass}`}>{status}</span>;
}

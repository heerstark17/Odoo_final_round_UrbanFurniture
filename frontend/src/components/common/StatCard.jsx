export default function StatCard({ label, value, icon: Icon, color = "primary", subtext, isCurrency = true }) {
  const formatValue = (val) => {
    if (val === undefined || val === null) return "-";
    const num = Number(val);
    if (isNaN(num)) return val;
    if (isCurrency) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(num);
    }
    return num.toLocaleString();
  };

  const bgStyles = {
    primary: { bg: "var(--primary-subtle)", color: "var(--primary)" },
    success: { bg: "var(--success-subtle)", color: "var(--success)" },
    warning: { bg: "var(--warning-subtle)", color: "var(--warning)" },
    danger: { bg: "var(--danger-subtle)", color: "var(--danger)" },
    info: { bg: "var(--info-subtle)", color: "var(--info)" },
  };

  const style = bgStyles[color] || bgStyles.primary;

  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrapper" style={{ backgroundColor: style.bg, color: style.color }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-value">{formatValue(value)}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}

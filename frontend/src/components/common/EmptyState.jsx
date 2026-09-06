import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No records found", description = "There is no data to display at this time.", icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{description}</div>
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
    </div>
  );
}

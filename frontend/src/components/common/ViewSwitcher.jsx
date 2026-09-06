import { List, LayoutGrid } from "lucide-react";

export default function ViewSwitcher({ viewMode, onViewChange }) {
  return (
    <div className="view-switcher" role="group" aria-label="View switcher">
      <button
        type="button"
        className={`view-switcher-btn ${viewMode === "list" ? "active" : ""}`}
        onClick={() => onViewChange("list")}
        title="List View"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        className={`view-switcher-btn ${viewMode === "kanban" ? "active" : ""}`}
        onClick={() => onViewChange("kanban")}
        title="Kanban View"
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  );
}

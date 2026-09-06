export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="page-header">
      <div className="page-title-group">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {(actions || children) && (
        <div className="header-actions">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

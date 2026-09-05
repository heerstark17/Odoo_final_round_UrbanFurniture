import LoadingSpinner from "./LoadingSpinner";

function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  onRowClick,
}) {
  const rows = data || [];
  const isEmpty = rows.length === 0;

  return (
    <div className="table-responsive">
      <table className="table table-hover table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className || ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="p-0 border-0">
                <LoadingSpinner message="Loading data..." />
              </td>
            </tr>
          ) : isEmpty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-muted py-4"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const rowKey = row && row.id !== undefined ? row.id : `row-${index}`;
              const isClickable = typeof onRowClick === "function";

              return (
                <tr
                  key={rowKey}
                  onClick={isClickable ? () => onRowClick(row) : undefined}
                  className={isClickable ? "table-row-clickable" : ""}
                  style={isClickable ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((column) => {
                    const rawValue = row ? row[column.key] : undefined;
                    const displayValue =
                      rawValue === null || rawValue === undefined || rawValue === ""
                        ? "-"
                        : rawValue;

                    return (
                      <td key={column.key} className={column.className || ""}>
                        {column.render
                          ? column.render(rawValue, row)
                          : displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
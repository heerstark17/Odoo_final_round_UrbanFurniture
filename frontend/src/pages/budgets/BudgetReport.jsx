import { useEffect, useState } from "react";
import { accountingService } from "../../services/accountingService";

export default function BudgetReport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    accountingService.getBudgetReport().then(setItems);
  }, []);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Budget Report</h2>
      <div className="card shadow-sm table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Analytic Account</th>
              <th>Planned</th>
              <th>Actual Expense</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan="5" className="text-center py-4">No budget data found.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.analyticAccountName}</td>
                <td>₹{item.plannedAmount.toFixed(2)}</td>
                <td>₹{item.actualAmount.toFixed(2)}</td>
                <td>₹{item.remainingAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { accountingService } from "../../services/accountingService";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    analyticAccountId: "",
    startDate: "",
    endDate: "",
    plannedAmount: "",
    responsiblePerson: "",
  });

  const load = async () => {
    const [budgetData, masterData] = await Promise.all([
      accountingService.getBudgets(),
      accountingService.getMasters(),
    ]);

    setBudgets(budgetData);
    setAnalytics(masterData.analyticAccounts);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.name ||
      !form.analyticAccountId ||
      !form.startDate ||
      !form.endDate ||
      Number(form.plannedAmount) <= 0
    ) {
      return setError("Complete all required budget fields.");
    }

    await accountingService.createBudget(form);
    setForm({
      name: "",
      analyticAccountId: "",
      startDate: "",
      endDate: "",
      plannedAmount: "",
      responsiblePerson: "",
    });
    load();
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Budgets</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="card card-body shadow-sm mb-4" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Budget name</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="col-md-4">
            <label className="form-label">Analytic account</label>
            <select className="form-select" value={form.analyticAccountId} onChange={(e) => setForm({ ...form, analyticAccountId: e.target.value })}>
              <option value="">Select analytic account</option>
              {analytics.map((account) => (
                <option key={account.id || account._id} value={account.id || account._id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Planned amount</label>
            <input className="form-control" type="number" min="1" value={form.plannedAmount} onChange={(e) => setForm({ ...form, plannedAmount: e.target.value })} />
          </div>

          <div className="col-md-4">
            <label className="form-label">Start date</label>
            <input className="form-control" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>

          <div className="col-md-4">
            <label className="form-label">End date</label>
            <input className="form-control" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

          <div className="col-md-4">
            <label className="form-label">Responsible person</label>
            <input className="form-control" value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
          </div>
        </div>

        <button className="btn btn-primary align-self-end mt-3">
          Create Budget
        </button>
      </form>

      <div className="card shadow-sm table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Analytic Account</th>
              <th>Period</th>
              <th>Planned Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 && (
              <tr><td colSpan="5" className="text-center py-4">No budgets found.</td></tr>
            )}
            {budgets.map((budget) => (
              <tr key={budget.id}>
                <td>{budget.name}</td>
                <td>{budget.analyticAccountName}</td>
                <td>{budget.startDate} to {budget.endDate}</td>
                <td>₹{budget.plannedAmount.toFixed(2)}</td>
                <td>{budget.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

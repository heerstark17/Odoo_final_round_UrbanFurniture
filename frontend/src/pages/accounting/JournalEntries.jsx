import { useEffect, useMemo, useState } from "react";
import { accountingService } from "../../services/accountingService";

const today = new Date().toISOString().slice(0, 10);

const blankLine = () => ({
  accountId: "",
  debit: "",
  credit: "",
});

export default function JournalEntries() 
{
  const [formValues, setFormValues] = useState({
  journal: "",
  date: "",
  reference: "",
  description: "",
});
function handleFieldChange(field, value) {
  setFormValues((prev) => ({
    ...prev,
    [field]: value,
  }));
}
  const [entries, setEntries] = useState([]);
  const [masters, setMasters] = useState({
    accounts: [],
    journals: [],
    analyticAccounts: [],
  });

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    journalId: "",
    date: today,
    reference: "",
    analyticAccountId: "",
    lines: [blankLine(), blankLine()],
  });

  const load = async () => {
    const [journalEntries, masterData] = await Promise.all([
      accountingService.getJournalEntries(),
      accountingService.getMasters(),
    ]);

    setEntries(journalEntries);
    setMasters(masterData);
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    return form.lines.reduce(
      (result, line) => ({
        debit: result.debit + Number(line.debit || 0),
        credit: result.credit + Number(line.credit || 0),
      }),
      { debit: 0, credit: 0 },
    );
  }, [form.lines]);

  const updateLine = (index, field, value) => {
    const lines = [...form.lines];
    lines[index] = { ...lines[index], [field]: value };
    setForm({ ...form, lines });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.journalId || !form.reference) {
      return setError("Journal and reference are required.");
    }

    if (form.lines.some((line) => !line.accountId)) {
      return setError("Select an account for every journal line.");
    }

    try {
      await accountingService.createJournalEntry(form);
      setMessage("Journal entry created successfully.");
      setShowForm(false);
      setForm({
        journalId: "",
        date: today,
        reference: "",
        analyticAccountId: "",
        lines: [blankLine(), blankLine()],
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Journal Entries</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Close" : "Create Journal Entry"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {showForm && (
        <form className="card card-body shadow-sm mb-4" onSubmit={submit}>
          <div className="row g-3">
      <div className="mb-3">
  <label className="form-label">Journal</label>

  <select
    className="form-select"
    style={{ width: "100%" }}
    value={formValues.journal}
    onChange={(e) => handleFieldChange("journal", e.target.value)}
  >
    <option value="">Select journal</option>
    <option value="Sales Journal">Sales Journal</option>
    <option value="Purchase Journal">Purchase Journal</option>
    <option value="Cash Journal">Cash Journal</option>
    <option value="Bank Journal">Bank Journal</option>
    <option value="General Journal">General Journal</option>
  </select>
</div>

            <div className="col-md-3">
              <label className="form-label">Date</label>
              <input
                className="form-control"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Reference</label>
              <input
                className="form-control"
                value={form.reference}
                placeholder="Example: Office Chair sale"
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Analytic Account</label>
              <select
                className="form-select"
                value={form.analyticAccountId}
                onChange={(e) =>
                  setForm({ ...form, analyticAccountId: e.target.value })
                }
              >
                <option value="">Not assigned</option>
                {masters.analyticAccounts.map((account) => (
                  <option key={account.id || account._id} value={account.id || account._id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr />
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Journal Items</h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() =>
                setForm({ ...form, lines: [...form.lines, blankLine()] })
              }
            >
              Add line
            </button>
          </div>

          {form.lines.map((line, index) => (
            <div className="row g-2 mb-2" key={index}>
              <div className="col-md-5">
                <select
                  className="form-select"
                  value={line.accountId}
                  onChange={(e) => updateLine(index, "accountId", e.target.value)}
                >
                  <option value="">Select account</option>
                  {masters.accounts.map((account) => (
                    <option key={account.id || account._id} value={account.id || account._id}>
                      {account.name || account.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  placeholder="Debit"
                  value={line.debit}
                  onChange={(e) => updateLine(index, "debit", e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  placeholder="Credit"
                  value={line.credit}
                  onChange={(e) => updateLine(index, "credit", e.target.value)}
                />
              </div>

              <div className="col-md-1">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  disabled={form.lines.length <= 2}
                  onClick={() =>
                    setForm({
                      ...form,
                      lines: form.lines.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="text-end mt-3">
            <div>Debit total: <strong>{totals.debit.toFixed(2)}</strong></div>
            <div>Credit total: <strong>{totals.credit.toFixed(2)}</strong></div>
          </div>

          <button className="btn btn-success align-self-end mt-3">
            Save Journal Entry
          </button>
        </form>
      )}

      <div className="card shadow-sm table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Number</th>
              <th>Date</th>
              <th>Reference</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  No journal entries found.
                </td>
              </tr>
            )}

            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.number}</td>
                <td>{entry.date}</td>
                <td>{entry.reference}</td>
                <td>{entry.debitTotal.toFixed(2)}</td>
                <td>{entry.creditTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

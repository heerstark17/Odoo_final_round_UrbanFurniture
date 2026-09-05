import { useEffect, useState } from "react";
import { accountingService } from "../services/accountingService";

const Card = ({ title, value, color }) => (
  <div className="col-md-4 col-xl">
    <div className={`card border-start border-4 border-${color} shadow-sm`}>
      <div className="card-body">
        <div className="text-muted small">{title}</div>
        <div className="fs-4 fw-bold">{value}</div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState({
    journalEntryCount: 0,
    budgetCount: 0,
    netProfit: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    accountingService.getDashboard().then(setData);
  }, []);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Dashboard</h2>

      <div className="row g-3">
        <Card title="Journal Entries" value={data.journalEntryCount} color="primary" />
        <Card title="Active Budgets" value={data.budgetCount} color="warning" />
        <Card title="Net Profit" value={`₹${data.netProfit.toFixed(2)}`} color="success" />
        <Card title="Income" value={`₹${data.totalIncome.toFixed(2)}`} color="info" />
        <Card title="Expenses" value={`₹${data.totalExpenses.toFixed(2)}`} color="danger" />
      </div>
    </div>
  );
}

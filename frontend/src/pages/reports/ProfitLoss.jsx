import { useEffect, useState } from "react";
import { accountingService } from "../../services/accountingService";

export default function ProfitLoss() {
  const [report, setReport] = useState({ income: 0, expenses: 0, netProfit: 0 });

  useEffect(() => {
    accountingService.getProfitLoss().then(setReport);
  }, []);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Profit & Loss</h2>
      <div className="card shadow-sm col-lg-6">
        <div className="card-body">
          <p>Total Income <strong className="float-end">₹{report.income.toFixed(2)}</strong></p>
          <p>Total Expenses <strong className="float-end">₹{report.expenses.toFixed(2)}</strong></p>
          <hr />
          <h5>Net Profit <strong className="float-end">₹{report.netProfit.toFixed(2)}</strong></h5>
        </div>
      </div>
    </div>
  );
}

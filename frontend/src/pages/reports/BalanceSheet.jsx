import { useEffect, useState } from "react";
import { accountingService } from "../../services/accountingService";

export default function BalanceSheet() {
  const [report, setReport] = useState({
    assets: 0,
    liabilities: 0,
    capital: 0,
    liabilitiesAndCapital: 0,
  });

  useEffect(() => {
    accountingService.getBalanceSheet().then(setReport);
  }, []);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Balance Sheet</h2>
      <div className="card shadow-sm col-lg-6">
        <div className="card-body">
          <p>Assets <strong className="float-end">₹{report.assets.toFixed(2)}</strong></p>
          <p>Liabilities <strong className="float-end">₹{report.liabilities.toFixed(2)}</strong></p>
          <p>Capital <strong className="float-end">₹{report.capital.toFixed(2)}</strong></p>
          <hr />
          <h5>Liabilities + Capital <strong className="float-end">₹{report.liabilitiesAndCapital.toFixed(2)}</strong></h5>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { transactionService } from "../../services/transactionService";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

const today = new Date().toISOString().slice(0, 10);

const blankLine = () => ({
  productId: "",
  quantity: 1,
  unitPrice: "",
  taxRate: 0,
});

function Alert({ message, type = "danger" }) {
  return message ? <div className={`alert alert-${type}`}>{message}</div> : null;
}

export function OrderScreen({ type }) {
  const sales = type === "sales";
  const title = sales ? "Sales Orders" : "Purchase Orders";
  const partyLabel = sales ? "Customer" : "Vendor";

  const [orders, setOrders] = useState([]);
  const [masters, setMasters] = useState({ parties: [], products: [], analytics: [] });
  const [form, setForm] = useState({
    partyId: "",
    orderDate: today,
    analyticAccountId: "",
    lines: [blankLine()],
  });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [records, masterData] = await Promise.all([
        transactionService.list(sales ? "salesOrders" : "purchaseOrders"),
        transactionService.getMasters(sales ? "customer" : "vendor"),
      ]);
      setOrders(records);
      setMasters(masterData);
    } catch {
      setError("Could not load transaction data.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    return form.lines.reduce(
      (result, line) => {
        const subtotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
        const tax = sales ? subtotal * (Number(line.taxRate || 0) / 100) : 0;
        result.subtotal += subtotal;
        result.tax += tax;
        result.total += subtotal + tax;
        return result;
      },
      { subtotal: 0, tax: 0, total: 0 },
    );
  }, [form.lines, sales]);

  const updateLine = (index, field, value) => {
    const lines = [...form.lines];
    lines[index] = { ...lines[index], [field]: value };
    setForm({ ...form, lines });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.partyId) return setError(`${partyLabel} is required.`);
    if (form.lines.some((line) => !line.productId || Number(line.quantity) <= 0 || Number(line.unitPrice) < 0)) {
      return setError("Every order line needs a product, valid quantity, and unit price.");
    }

    try {
      await transactionService.createOrder({ type, ...form });
      setMessage(`${title.slice(0, -1)} created successfully.`);
      setShowForm(false);
      setForm({ partyId: "", orderDate: today, analyticAccountId: "", lines: [blankLine()] });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const confirm = async (id) => {
    if (!window.confirm("Confirm this order?")) return;
    await transactionService.confirmOrder(type, id);
    setMessage("Order confirmed.");
    load();
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{title}</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : `Create ${title.slice(0, -1)}`}
        </button>
      </div>

      <Alert message={error} />
      <Alert message={message} type="success" />

      {showForm && (
        <form className="card card-body shadow-sm mb-4" onSubmit={submit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">{partyLabel}</label>
              <select className="form-select" value={form.partyId} onChange={(e) => setForm({ ...form, partyId: e.target.value })}>
                <option value="">Select {partyLabel}</option>
                {masters.parties.map((party) => (
                  <option key={party.id || party._id} value={party.id || party._id}>
                    {party.name || party.fullName || party.contactName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Order date</label>
              <input className="form-control" type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            </div>

            <div className="col-md-4">
              <label className="form-label">Analytic account</label>
              <select className="form-select" value={form.analyticAccountId} onChange={(e) => setForm({ ...form, analyticAccountId: e.target.value })}>
                <option value="">Not assigned</option>
                {masters.analytics.map((account) => (
                  <option key={account.id || account._id} value={account.id || account._id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr />
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Order lines</h5>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setForm({ ...form, lines: [...form.lines, blankLine()] })}>
              Add line
            </button>
          </div>

          {form.lines.map((line, index) => (
            <div className="row g-2 mb-2" key={index}>
              <div className="col-md-4">
                <select className="form-select" value={line.productId} onChange={(e) => updateLine(index, "productId", e.target.value)}>
                  <option value="">Select product</option>
                  {masters.products.map((product) => (
                    <option key={product.id || product._id} value={product.id || product._id}>
                      {product.name || product.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input className="form-control" type="number" min="1" placeholder="Quantity" value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} />
              </div>
              <div className="col-md-2">
                <input className="form-control" type="number" min="0" placeholder="Unit price" value={line.unitPrice} onChange={(e) => updateLine(index, "unitPrice", e.target.value)} />
              </div>
              {sales && (
                <div className="col-md-2">
                  <input className="form-control" type="number" min="0" placeholder="Tax %" value={line.taxRate} onChange={(e) => updateLine(index, "taxRate", e.target.value)} />
                </div>
              )}
              <div className="col-md-1 pt-2 text-end fw-semibold">
                {money(Number(line.quantity || 0) * Number(line.unitPrice || 0))}
              </div>
              <div className="col-md-1">
                <button type="button" className="btn btn-outline-danger w-100" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })}>
                  ×
                </button>
              </div>
            </div>
          ))}

          <div className="text-end mt-3">
            <div>Subtotal: <strong>{money(totals.subtotal)}</strong></div>
            {sales && <div>Tax: <strong>{money(totals.tax)}</strong></div>}
            <h5>Total: {money(totals.total)}</h5>
          </div>

          <button className="btn btn-success align-self-end">Save order</button>
        </form>
      )}

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr><th>Number</th><th>{partyLabel}</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan="6" className="text-center py-4">No orders found.</td></tr>}
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.number}</td><td>{order.partyName}</td><td>{order.orderDate}</td>
                  <td>{money(order.total)}</td><td>{order.status}</td>
                  <td>{order.status === "Draft" && <button className="btn btn-sm btn-outline-success" onClick={() => confirm(order.id)}>Confirm</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DocumentScreen({ type }) {
  const invoice = type === "invoice";
  const title = invoice ? "Customer Invoices" : "Vendor Bills";
  const orderType = invoice ? "salesOrders" : "purchaseOrders";
  const [documents, setDocuments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [docs, sourceOrders] = await Promise.all([
      transactionService.list(invoice ? "invoices" : "bills"),
      transactionService.list(orderType),
    ]);
    setDocuments(docs);
    setOrders(sourceOrders.filter((order) => order.status === "Confirmed"));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    try {
      if (!orderId) return setError("Select a confirmed source order.");
      await transactionService.createDocument(type, orderId);
      setOrderId("");
      setError("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">{title}</h2>
      <Alert message={error} />

      <div className="card card-body shadow-sm mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-8">
            <label className="form-label">{invoice ? "Confirmed Sales Order" : "Confirmed Purchase Order"}</label>
            <select className="form-select" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">Select source order</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.number} — {order.partyName}</option>)}
            </select>
          </div>
          <div className="col-md-4"><button className="btn btn-primary w-100" onClick={generate}>Generate {invoice ? "Invoice" : "Bill"}</button></div>
        </div>
      </div>

      <div className="card shadow-sm table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr><th>Number</th><th>Party</th><th>Source order</th><th>Date</th><th>Due</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr>
          </thead>
          <tbody>
            {documents.length === 0 && <tr><td colSpan="9" className="text-center py-4">No documents found.</td></tr>}
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.number}</td><td>{doc.partyName}</td><td>{doc.orderNumber}</td>
                <td>{doc.documentDate}</td><td>{doc.dueDate}</td><td>{money(doc.total)}</td>
                <td>{money(doc.paidAmount)}</td><td>{money(doc.amountDue)}</td><td>{doc.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PaymentScreen({ type }) {
  const invoice = type === "invoice";
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const records = await transactionService.list(invoice ? "invoices" : "bills");
    setDocuments(records.filter((item) => item.amountDue > 0));
  };

  useEffect(() => { load(); }, []);

  const selected = documents.find((item) => item.id === documentId);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!documentId || !paymentMethod || !paymentDate) return setError("Complete all payment fields.");
    if (Number(amount) <= 0 || Number(amount) > selected.amountDue) return setError("Enter a valid amount up to the remaining balance.");

    try {
      await transactionService.registerPayment({ type, documentId, amount, paymentDate, paymentMethod });
      setMessage("Payment registered successfully.");
      setDocumentId(""); setAmount(""); setPaymentMethod("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Register {invoice ? "Invoice" : "Bill"} Payment</h2>
      <Alert message={error} />
      <Alert message={message} type="success" />

      <form className="card card-body shadow-sm col-lg-7" onSubmit={submit}>
        <label className="form-label">Document</label>
        <select className="form-select mb-3" value={documentId} onChange={(e) => { setDocumentId(e.target.value); setAmount(""); }}>
          <option value="">Select document</option>
          {documents.map((doc) => <option key={doc.id} value={doc.id}>{doc.number} — {doc.partyName}</option>)}
        </select>

        {selected && (
          <div className="alert alert-light border">
            <div>Total: <strong>{money(selected.total)}</strong></div>
            <div>Paid: <strong>{money(selected.paidAmount)}</strong></div>
            <div>Amount due: <strong>{money(selected.amountDue)}</strong></div>
          </div>
        )}

        <label className="form-label">Payment amount</label>
        <input className="form-control mb-3" type="number" min="0.01" max={selected?.amountDue} value={amount} onChange={(e) => setAmount(e.target.value)} />

        <label className="form-label">Payment date</label>
        <input className="form-control mb-3" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />

        <label className="form-label">Payment method</label>
        <select className="form-select mb-3" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="">Select method</option><option value="Cash">Cash</option><option value="Bank">Bank</option>
        </select>

        <button className="btn btn-success">Register payment</button>
      </form>
    </div>
  );
}
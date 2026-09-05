import contactsJson from "../mocks/contacts.json";
import productsJson from "../mocks/products.json";
import analyticsJson from "../mocks/analyticAccounts.json";

const key = "urbanFurnitureTransactions";

const listOf = (value) =>
  Array.isArray(value)
    ? value
    : value?.data || value?.contacts || value?.products || value?.items || [];

const contacts = listOf(contactsJson);
const products = listOf(productsJson);
const analytics = listOf(analyticsJson);

const nameOf = (item) =>
  item?.name || item?.fullName || item?.contactName || item?.productName || "Unknown";

const idOf = (item) => item?.id || item?._id;

const read = () => {
  const saved = localStorage.getItem(key);
  return saved
    ? JSON.parse(saved)
    : { salesOrders: [], invoices: [], purchaseOrders: [], bills: [] };
};

const write = (data) => localStorage.setItem(key, JSON.stringify(data));

const newNumber = (prefix, records) =>
  `${prefix}-${String(records.length + 1).padStart(4, "0")}`;

export const transactionService = {
  getMasters: async (partyType) => {
    const parties = contacts.filter((item) => {
      const type = String(item.type || item.contactType || "").toLowerCase();
      return type.includes(partyType) || type === "both";
    });

    return { parties, products, analytics };
  },

  list: async (type) => read()[type] || [],

  createOrder: async ({ type, partyId, orderDate, analyticAccountId, lines }) => {
    const data = read();
    const collection = type === "sales" ? "salesOrders" : "purchaseOrders";
    const party = contacts.find((item) => String(idOf(item)) === String(partyId));

    const calculatedLines = lines.map((line) => {
      const product = products.find(
        (item) => String(idOf(item)) === String(line.productId),
      );
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      const taxRate = Number(line.taxRate || 0);
      const subtotal = quantity * unitPrice;
      const taxAmount = type === "sales" ? subtotal * (taxRate / 100) : 0;

      return {
        ...line,
        productId: idOf(product),
        productName: nameOf(product),
        quantity,
        unitPrice,
        taxRate,
        lineTotal: subtotal + taxAmount,
      };
    });

    const subtotal = calculatedLines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    const taxAmount = calculatedLines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice * (line.taxRate / 100),
      0,
    );

    const order = {
      id: crypto.randomUUID(),
      number: newNumber(type === "sales" ? "SO" : "PO", data[collection]),
      partyId,
      partyName: nameOf(party),
      orderDate,
      analyticAccountId,
      lines: calculatedLines,
      subtotal,
      taxAmount: type === "sales" ? taxAmount : 0,
      total: subtotal + (type === "sales" ? taxAmount : 0),
      status: "Draft",
    };

    data[collection].push(order);
    write(data);
    return order;
  },

  confirmOrder: async (type, id) => {
    const data = read();
    const collection = type === "sales" ? "salesOrders" : "purchaseOrders";
    const order = data[collection].find((item) => item.id === id);

    if (!order) throw new Error("Order not found.");
    order.status = "Confirmed";
    write(data);
    return order;
  },

  createDocument: async (type, orderId) => {
    const data = read();
    const orderCollection = type === "invoice" ? "salesOrders" : "purchaseOrders";
    const documentCollection = type === "invoice" ? "invoices" : "bills";
    const order = data[orderCollection].find((item) => item.id === orderId);

    if (!order) throw new Error("Source order not found.");

    const document = {
      id: crypto.randomUUID(),
      number: newNumber(type === "invoice" ? "INV" : "BILL", data[documentCollection]),
      orderId: order.id,
      orderNumber: order.number,
      partyId: order.partyId,
      partyName: order.partyName,
      documentDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      lines: order.lines,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      total: order.total,
      paidAmount: 0,
      amountDue: order.total,
      status: "Unpaid",
    };

    data[documentCollection].push(document);
    order.status = type === "invoice" ? "Invoiced" : "Billed";
    write(data);
    return document;
  },

  registerPayment: async ({ type, documentId, amount, paymentDate, paymentMethod }) => {
    const data = read();
    const collection = type === "invoice" ? "invoices" : "bills";
    const document = data[collection].find((item) => item.id === documentId);

    if (!document) throw new Error("Document not found.");

    const payment = Number(amount);
    if (payment <= 0 || payment > document.amountDue) {
      throw new Error("Payment must be greater than zero and cannot exceed amount due.");
    }

    document.paidAmount += payment;
    document.amountDue -= payment;
    document.paymentDate = paymentDate;
    document.paymentMethod = paymentMethod;
    document.status = document.amountDue === 0 ? "Paid" : "Partially Paid";

    write(data);
    return document;
  },
};
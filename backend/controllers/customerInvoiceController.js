const service = require("../services/customerInvoiceService");
const { createDocumentPdf } = require("../utils/documentPdf");

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Invalid ${label} ID`);
    error.statusCode = 400;
    throw error;
  }
  return id;
}
function writeError(res, error) {
  res
    .status(error.statusCode || (error.code === "23505" ? 409 : 400))
    .json({
      message:
        error.code === "23505"
          ? "Invoice number or sales order relationship already exists"
          : error.message,
    });
}
async function list(req, res) {
  try {
    res.json(await service.getInvoices(req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}
async function get(req, res) {
  try {
    res.json(await service.getInvoice(parseId(req.params.id, "invoice"), req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}
async function downloadPdf(req, res) {
  try {
    const invoiceId = parseId(req.params.id, "invoice");
    const [invoice, lines] = await Promise.all([
      service.getInvoiceForPdf(invoiceId, req.user.role === "contact" ? req.user.contact_id : null),
      service.getLines(invoiceId, req.user.role === "contact" ? req.user.contact_id : null),
    ]);
    res.type("application/pdf");
    res.attachment(`invoice-${invoice.invoice_number}.pdf`);
    createDocumentPdf(res, {
      title: "Customer Invoice",
      numberLabel: "Invoice Number",
      documentNumber: invoice.invoice_number,
      documentDate: invoice.invoice_date,
      partyLabel: "Customer",
      partyName: invoice.customer_name,
      status: invoice.status,
      lines,
      subtotal: invoice.subtotal,
      taxTotal: invoice.tax_total,
      grandTotal: invoice.grand_total,
    });
  } catch (error) {
    writeError(res, error);
  }
}
async function create(req, res) {
  try {
    res.status(201).json(await service.createInvoice(req.body, req.user.id));
  } catch (error) {
    writeError(res, error);
  }
}
async function update(req, res) {
  try {
    res.json(
      await service.updateInvoice(parseId(req.params.id, "invoice"), req.body, req.user.id),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function remove(req, res) {
  try {
    res.json({
      message: "Customer invoice deleted successfully",
      invoice: await service.deleteInvoice(parseId(req.params.id, "invoice")),
    });
  } catch (error) {
    writeError(res, error);
  }
}
async function listLines(req, res) {
  try {
    res.json(await service.getLines(parseId(req.params.invoiceId, "invoice"), req.user.role === "contact" ? req.user.contact_id : null));
  } catch (error) {
    writeError(res, error);
  }
}
async function getLine(req, res) {
  try {
    res.json(
      await service.getLine(
        parseId(req.params.invoiceId, "invoice"),
        parseId(req.params.id, "invoice line"),
        req.user.role === "contact" ? req.user.contact_id : null,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function createLine(req, res) {
  try {
    res
      .status(201)
      .json(
        await service.createLine(
          parseId(req.params.invoiceId, "invoice"),
          req.body,
        ),
      );
  } catch (error) {
    writeError(res, error);
  }
}
async function updateLine(req, res) {
  try {
    res.json(
      await service.updateLine(
        parseId(req.params.invoiceId, "invoice"),
        parseId(req.params.id, "invoice line"),
        req.body,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function removeLine(req, res) {
  try {
    res.json({
      message: "Invoice line deleted successfully",
      invoiceLine: await service.deleteLine(
        parseId(req.params.invoiceId, "invoice"),
        parseId(req.params.id, "invoice line"),
      ),
    });
  } catch (error) {
    writeError(res, error);
  }
}
module.exports = {
  list,
  get,
  downloadPdf,
  create,
  update,
  remove,
  listLines,
  getLine,
  createLine,
  updateLine,
  removeLine,
};

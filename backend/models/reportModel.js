const { pool } = require("../config/db");

async function getProfitAndLoss(filters = {}) {
  const values = [];
  const conditions = ["je.status = 'posted'", "coa.account_type IN ('income', 'expense')"];

  if (filters.from) {
    values.push(filters.from);
    conditions.push(`je.accounting_date >= $${values.length}`);
  }
  if (filters.to) {
    values.push(filters.to);
    conditions.push(`je.accounting_date <= $${values.length}`);
  }

  const result = await pool.query(
    `SELECT coa.id AS account_id, coa.account_code, coa.account_name,
            coa.account_type,
            COALESCE(SUM(
              CASE
                WHEN coa.account_type = 'income' THEN jel.credit - jel.debit
                ELSE jel.debit - jel.credit
              END
            ), 0)::NUMERIC(14,2) AS amount
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
     JOIN chart_of_accounts coa ON coa.id = jel.account_id
     WHERE ${conditions.join(" AND ")}
     GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
     ORDER BY coa.account_code, coa.id`,
    values,
  );

  return result.rows;
}

async function getBalanceSheet(filters = {}) {
  const values = [];
  const conditions = [
    "je.status = 'posted'",
    "coa.account_type IN ('asset', 'liability', 'capital')",
  ];

  if (filters.from) {
    values.push(filters.from);
    conditions.push(`je.accounting_date >= $${values.length}`);
  }
  if (filters.to) {
    values.push(filters.to);
    conditions.push(`je.accounting_date <= $${values.length}`);
  }

  const result = await pool.query(
    `SELECT coa.id AS account_id, coa.account_code, coa.account_name,
            coa.account_type, coa.account_subtype,
            COALESCE(SUM(
              CASE
                WHEN coa.account_type = 'asset' THEN jel.debit - jel.credit
                ELSE jel.credit - jel.debit
              END
            ), 0)::NUMERIC(14,2) AS amount
     FROM journal_entries je
     JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
     JOIN chart_of_accounts coa ON coa.id = jel.account_id
     WHERE ${conditions.join(" AND ")}
     GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.account_subtype
     ORDER BY coa.account_code, coa.id`,
    values,
  );

  return result.rows;
}

async function getBudgetReport(filters = {}) {
  const values = [];
  const budgetConditions = [];
  const dateConditions = {
    sales: [],
    purchase: [],
    invoice: [],
    bill: [],
  };

  if (filters.budgetId) {
    values.push(filters.budgetId);
    budgetConditions.push(`b.id = $${values.length}`);
  }
  if (filters.analyticAccountId) {
    values.push(filters.analyticAccountId);
    budgetConditions.push(`bl.analytic_account_id = $${values.length}`);
  }
  if (filters.from) {
    values.push(filters.from);
    const placeholder = `$${values.length}`;
    dateConditions.sales.push(`so.order_date >= ${placeholder}`);
    dateConditions.purchase.push(`po.order_date >= ${placeholder}`);
    dateConditions.invoice.push(`ci.invoice_date >= ${placeholder}`);
    dateConditions.bill.push(`vb.bill_date >= ${placeholder}`);
  }
  if (filters.to) {
    values.push(filters.to);
    const placeholder = `$${values.length}`;
    dateConditions.sales.push(`so.order_date <= ${placeholder}`);
    dateConditions.purchase.push(`po.order_date <= ${placeholder}`);
    dateConditions.invoice.push(`ci.invoice_date <= ${placeholder}`);
    dateConditions.bill.push(`vb.bill_date <= ${placeholder}`);
  }

  const budgetWhere = budgetConditions.length ? `WHERE ${budgetConditions.join(" AND ")}` : "";
  const salesWhere = ["so.status = 'confirmed'", "sol.analytic_account_id IS NOT NULL", ...dateConditions.sales].join(" AND ");
  const purchaseWhere = ["po.status = 'confirmed'", "pol.analytic_account_id IS NOT NULL", ...dateConditions.purchase].join(" AND ");
  const invoiceWhere = ["ci.status = 'paid'", "cil.analytic_account_id IS NOT NULL", ...dateConditions.invoice].join(" AND ");
  const billWhere = ["vb.status = 'paid'", "vbl.analytic_account_id IS NOT NULL", ...dateConditions.bill].join(" AND ");

  const result = await pool.query(
    `WITH budget_scope AS (
       SELECT b.id AS budget_id, b.budget_name, bl.analytic_account_id,
              aa.name AS analytic_account_name, bl.planned_amount
       FROM budgets b
       JOIN budget_lines bl ON bl.budget_id = b.id
       JOIN analytic_accounts aa ON aa.id = bl.analytic_account_id
       ${budgetWhere}
     ),
     commitment_totals AS (
       SELECT analytic_account_id, SUM(amount)::NUMERIC(14,2) AS committed_amount
       FROM (
         SELECT sol.analytic_account_id, SUM(sol.line_total) AS amount
         FROM sales_orders so
         JOIN sales_order_lines sol ON sol.sales_order_id = so.id
         WHERE ${salesWhere}
         GROUP BY sol.analytic_account_id
         UNION ALL
         SELECT pol.analytic_account_id, SUM(pol.line_total) AS amount
         FROM purchase_orders po
         JOIN purchase_order_lines pol ON pol.purchase_order_id = po.id
         WHERE ${purchaseWhere}
         GROUP BY pol.analytic_account_id
       ) commitments
       GROUP BY analytic_account_id
     ),
     achievement_totals AS (
       SELECT analytic_account_id, SUM(amount)::NUMERIC(14,2) AS achieved_amount
       FROM (
         SELECT cil.analytic_account_id, SUM(cil.line_total) AS amount
         FROM customer_invoices ci
         JOIN customer_invoice_lines cil ON cil.invoice_id = ci.id
         WHERE ${invoiceWhere}
         GROUP BY cil.analytic_account_id
         UNION ALL
         SELECT vbl.analytic_account_id, SUM(vbl.line_total) AS amount
         FROM vendor_bills vb
         JOIN vendor_bill_lines vbl ON vbl.bill_id = vb.id
         WHERE ${billWhere}
         GROUP BY vbl.analytic_account_id
       ) achievements
       GROUP BY analytic_account_id
     )
     SELECT bs.budget_id, bs.budget_name, bs.analytic_account_id,
            bs.analytic_account_name, bs.planned_amount,
            COALESCE(ct.committed_amount, 0)::NUMERIC(14,2) AS committed_amount,
            COALESCE(at.achieved_amount, 0)::NUMERIC(14,2) AS achieved_amount
     FROM budget_scope bs
     LEFT JOIN commitment_totals ct ON ct.analytic_account_id = bs.analytic_account_id
     LEFT JOIN achievement_totals at ON at.analytic_account_id = bs.analytic_account_id
     ORDER BY bs.budget_id, bs.analytic_account_id`,
    values,
  );

  return result.rows;
}

module.exports = { getProfitAndLoss, getBalanceSheet, getBudgetReport };

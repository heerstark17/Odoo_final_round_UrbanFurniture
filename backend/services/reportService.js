const model = require("../models/reportModel");

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function normalizeDate(value, label) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must use YYYY-MM-DD format`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label} must be a valid date`);
  }
  return value;
}

function normalizeId(value, label) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && !value.trim()) fail(`${label} must be a valid ID`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) fail(`${label} must be a valid ID`);
  return parsed;
}

async function getProfitAndLoss(query = {}) {
  const from = normalizeDate(query.from, "from");
  const to = normalizeDate(query.to, "to");
  if (from && to && from > to) fail("from must be on or before to");

  const accounts = await model.getProfitAndLoss({ from, to });
  const income = accounts
    .filter((account) => account.account_type === "income")
    .map(({ account_type, ...account }) => account);
  const expenses = accounts
    .filter((account) => account.account_type === "expense")
    .map(({ account_type, ...account }) => account);
  const totalIncome = income.reduce((total, account) => total + Number(account.amount), 0);
  const totalExpenses = expenses.reduce((total, account) => total + Number(account.amount), 0);

  return {
    income,
    expenses,
    total_income: totalIncome,
    total_expense: totalExpenses,
    net_profit: totalIncome - totalExpenses,
  };
}

async function getBalanceSheet(query = {}) {
  const from = normalizeDate(query.from, "from");
  const to = normalizeDate(query.to, "to");
  if (from && to && from > to) fail("from must be on or before to");

  const [accounts, profitAndLoss] = await Promise.all([
    model.getBalanceSheet({ from, to }),
    getProfitAndLoss({ from, to }),
  ]);
  const assets = accounts
    .filter((account) => account.account_type === "asset")
    .map(({ account_type, account_subtype, ...account }) => account);
  const liabilities = accounts
    .filter((account) => account.account_type === "liability")
    .map(({ account_type, account_subtype, ...account }) => account);
  const capital = accounts
    .filter((account) => account.account_type === "capital")
    .map(({ account_type, account_subtype, ...account }) => account);
  const totalAssets = assets.reduce((total, account) => total + Number(account.amount), 0);
  const totalLiabilities = liabilities.reduce((total, account) => total + Number(account.amount), 0);
  const totalCapital = capital.reduce((total, account) => total + Number(account.amount), 0);
  const totalLiabilitiesAndCapital = totalLiabilities + totalCapital + profitAndLoss.net_profit;

  return {
    assets,
    liabilities,
    capital,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_capital: totalCapital,
    net_profit: profitAndLoss.net_profit,
    total_liabilities_and_capital: totalLiabilitiesAndCapital,
  };
}

async function getBudgetReport(query = {}) {
  const from = normalizeDate(query.from, "from");
  const to = normalizeDate(query.to, "to");
  if (from && to && from > to) fail("from must be on or before to");

  const rows = await model.getBudgetReport({
    budgetId: normalizeId(query.budget_id, "budget_id"),
    analyticAccountId: normalizeId(query.analytic_account_id, "analytic_account_id"),
    from,
    to,
  });
  const budgetsById = new Map();
  const totals = {
    planned_amount: 0,
    committed_amount: 0,
    achieved_amount: 0,
    remaining_amount: 0,
    variance: 0,
  };

  for (const row of rows) {
    const plannedAmount = Number(row.planned_amount);
    const committedAmount = Number(row.committed_amount);
    const achievedAmount = Number(row.achieved_amount);
    const line = {
      analytic_account_id: row.analytic_account_id,
      analytic_account_name: row.analytic_account_name,
      planned_amount: plannedAmount,
      committed_amount: committedAmount,
      achieved_amount: achievedAmount,
      remaining_amount: plannedAmount - committedAmount,
      variance: plannedAmount - achievedAmount,
    };
    const budgetId = String(row.budget_id);
    if (!budgetsById.has(budgetId)) {
      budgetsById.set(budgetId, {
        budget_id: row.budget_id,
        budget_name: row.budget_name,
        lines: [],
      });
    }
    budgetsById.get(budgetId).lines.push(line);
    for (const key of Object.keys(totals)) totals[key] += line[key];
  }

  return { budgets: [...budgetsById.values()], totals };
}

async function getDashboard(query = {}) {
  const from = normalizeDate(query.from, "from");
  const to = normalizeDate(query.to, "to");
  if (from && to && from > to) fail("from must be on or before to");

  const [profitAndLoss, balanceAccounts, budget] = await Promise.all([
    getProfitAndLoss({ from, to }),
    model.getBalanceSheet({ from, to }),
    getBudgetReport({ from, to }),
  ]);
  const totalForSubtype = (subtypes) => balanceAccounts
    .filter((account) => subtypes.includes(account.account_subtype))
    .reduce((total, account) => total + Number(account.amount), 0);

  return {
    total_sales: profitAndLoss.total_income,
    total_purchases: profitAndLoss.total_expense,
    total_receivables: totalForSubtype(["receivable"]),
    total_payables: totalForSubtype(["payable"]),
    total_cash_bank: totalForSubtype(["cash", "bank"]),
    total_income: profitAndLoss.total_income,
    total_expenses: profitAndLoss.total_expense,
    net_profit: profitAndLoss.net_profit,
    budget_planned: budget.totals.planned_amount,
    budget_committed: budget.totals.committed_amount,
    budget_achieved: budget.totals.achieved_amount,
  };
}

module.exports = { getProfitAndLoss, getBalanceSheet, getBudgetReport, getDashboard };

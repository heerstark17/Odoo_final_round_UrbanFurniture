import accountsJson from "../mocks/chartOfAccounts.json";
import journalsJson from "../mocks/journals.json";
import analyticAccountsJson from "../mocks/analyticAccounts.json";

const STORE_KEY = "urbanFurnitureAccounting";

const listOf = (value) =>
  Array.isArray(value)
    ? value
    : value?.data || value?.items || value?.accounts || value?.journals || [];

const accounts = listOf(accountsJson);
const journals = listOf(journalsJson);
const analyticAccounts = listOf(analyticAccountsJson);

const read = () => {
  const saved = localStorage.getItem(STORE_KEY);
  return saved ? JSON.parse(saved) : { journalEntries: [], budgets: [] };
};

const write = (data) => localStorage.setItem(STORE_KEY, JSON.stringify(data));

const idOf = (item) => item?.id || item?._id;
const nameOf = (item) => item?.name || item?.accountName || item?.journalName || "Unknown";

export const accountingService = {
  getMasters: async () => ({
    accounts,
    journals,
    analyticAccounts,
  }),

  getJournalEntries: async () => read().journalEntries,

  createJournalEntry: async (entry) => {
    const debitTotal = entry.lines.reduce(
      (total, line) => total + Number(line.debit || 0),
      0,
    );

    const creditTotal = entry.lines.reduce(
      (total, line) => total + Number(line.credit || 0),
      0,
    );

    if (debitTotal <= 0 || creditTotal <= 0) {
      throw new Error("Enter at least one debit and one credit amount.");
    }

    if (debitTotal !== creditTotal) {
      throw new Error("Debit and credit totals must be equal.");
    }

    const data = read();

    const journalEntry = {
      id: crypto.randomUUID(),
      number: `JE-${String(data.journalEntries.length + 1).padStart(4, "0")}`,
      ...entry,
      debitTotal,
      creditTotal,
      lines: entry.lines.map((line) => {
        const account = accounts.find(
          (item) => String(idOf(item)) === String(line.accountId),
        );

        return {
          ...line,
          accountName: nameOf(account),
          accountType: String(account?.type || account?.accountType || ""),
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
        };
      }),
    };

    data.journalEntries.unshift(journalEntry);
    write(data);
    return journalEntry;
  },

  getBudgets: async () => read().budgets,

  createBudget: async (budget) => {
    const data = read();
    const analyticAccount = analyticAccounts.find(
      (item) => String(idOf(item)) === String(budget.analyticAccountId),
    );

    const newBudget = {
      id: crypto.randomUUID(),
      ...budget,
      analyticAccountName: nameOf(analyticAccount),
      plannedAmount: Number(budget.plannedAmount),
      status: "Active",
    };

    data.budgets.unshift(newBudget);
    write(data);
    return newBudget;
  },

  getProfitLoss: async () => {
    const entries = read().journalEntries;

    let income = 0;
    let expenses = 0;

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const type = line.accountType.toLowerCase();

        if (type.includes("income") || type.includes("revenue")) {
          income += line.credit - line.debit;
        }

        if (type.includes("expense")) {
          expenses += line.debit - line.credit;
        }
      });
    });

    return { income, expenses, netProfit: income - expenses };
  },

  getBalanceSheet: async () => {
    const entries = read().journalEntries;
    const totals = { assets: 0, liabilities: 0, capital: 0 };

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const type = line.accountType.toLowerCase();
        const balance = line.debit - line.credit;

        if (type.includes("asset")) totals.assets += balance;
        if (type.includes("liabil")) totals.liabilities += -balance;
        if (type.includes("capital") || type.includes("equity")) {
          totals.capital += -balance;
        }
      });
    });

    return {
      ...totals,
      liabilitiesAndCapital: totals.liabilities + totals.capital,
    };
  },

  getBudgetReport: async () => {
    const data = read();

    return data.budgets.map((budget) => {
      let actualAmount = 0;

      data.journalEntries.forEach((entry) => {
        if (entry.analyticAccountId !== budget.analyticAccountId) return;

        entry.lines.forEach((line) => {
          if (line.accountType.toLowerCase().includes("expense")) {
            actualAmount += line.debit - line.credit;
          }
        });
      });

      return {
        ...budget,
        actualAmount,
        remainingAmount: budget.plannedAmount - actualAmount,
      };
    });
  },

  getDashboard: async () => {
    const [entries, budgets, profitLoss] = await Promise.all([
      accountingService.getJournalEntries(),
      accountingService.getBudgets(),
      accountingService.getProfitLoss(),
    ]);

    return {
      journalEntryCount: entries.length,
      budgetCount: budgets.length,
      netProfit: profitLoss.netProfit,
      totalIncome: profitLoss.income,
      totalExpenses: profitLoss.expenses,
    };
  },
};

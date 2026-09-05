const model = require("../models/journalModel");
const TYPES = ["sales", "purchase", "bank", "cash"];
function normalise(data = {}) {
    if (typeof data.journalName !== "string" || !data.journalName.trim()) throw new Error("Journal name is required");
    if (!TYPES.includes(data.journalType)) throw new Error("Journal type must be sales, purchase, bank, or cash");
    const defaultAccountId = Number(data.defaultAccountId);
    if (!Number.isInteger(defaultAccountId) || defaultAccountId <= 0) throw new Error("Default account is required");
    return { journalName: data.journalName.trim(), journalType: data.journalType, defaultAccountId };
}
async function getJournals() { return model.getAllJournals(); }
async function getJournal(id) { const item = await model.getJournalById(id); if (!item) throw new Error("Journal not found"); return item; }
async function validate(data) { if (!await model.getActiveAccountById(data.defaultAccountId)) throw new Error("Default account not found or inactive"); }
async function createJournal(data) { data = normalise(data); await validate(data); return model.createJournal(data); }
async function updateJournal(id, data) { await getJournal(id); data = normalise(data); await validate(data); return model.updateJournal(id, data); }
async function deleteJournal(id) { await getJournal(id); return model.deactivateJournal(id); }
module.exports = { getJournals, getJournal, createJournal, updateJournal, deleteJournal };

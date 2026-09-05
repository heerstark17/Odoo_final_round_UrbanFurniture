const service = require("../services/journalEntryService");

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) { const error = new Error(`Invalid ${label} ID`); error.statusCode = 400; throw error; }
  return id;
}
function writeError(res, error) {
  res.status(error.statusCode || (error.code === "23505" ? 409 : 400)).json({
    message: error.code === "23505" ? "Journal entry number already exists" : error.message,
  });
}
async function list(req, res) { try { res.json(await service.getJournalEntries()); } catch (error) { writeError(res, error); } }
async function get(req, res) { try { res.json(await service.getJournalEntry(parseId(req.params.id, "journal entry"))); } catch (error) { writeError(res, error); } }
async function create(req, res) { try { res.status(201).json(await service.createJournalEntry(req.body)); } catch (error) { writeError(res, error); } }
async function update(req, res) { try { res.json(await service.updateJournalEntry(parseId(req.params.id, "journal entry"), req.body)); } catch (error) { writeError(res, error); } }
async function remove(req, res) { try { res.json({ message: "Journal entry deleted successfully", journalEntry: await service.deleteJournalEntry(parseId(req.params.id, "journal entry")) }); } catch (error) { writeError(res, error); } }
async function listLines(req, res) { try { res.json(await service.getLines(parseId(req.params.journalEntryId, "journal entry"))); } catch (error) { writeError(res, error); } }
async function getLine(req, res) { try { res.json(await service.getLine(parseId(req.params.journalEntryId, "journal entry"), parseId(req.params.id, "journal entry line"))); } catch (error) { writeError(res, error); } }
async function createLine(req, res) { try { res.status(201).json(await service.createLine(parseId(req.params.journalEntryId, "journal entry"), req.body)); } catch (error) { writeError(res, error); } }
async function updateLine(req, res) { try { res.json(await service.updateLine(parseId(req.params.journalEntryId, "journal entry"), parseId(req.params.id, "journal entry line"), req.body)); } catch (error) { writeError(res, error); } }
async function removeLine(req, res) { try { res.json({ message: "Journal entry line deleted successfully", journalEntryLine: await service.deleteLine(parseId(req.params.journalEntryId, "journal entry"), parseId(req.params.id, "journal entry line")) }); } catch (error) { writeError(res, error); } }
module.exports = { list, get, create, update, remove, listLines, getLine, createLine, updateLine, removeLine };

const service = require("../services/journalService");
function parseId(value) { const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid journal ID"); return id; }
function errorStatus(error) { return error.message === "Journal not found" ? 404 : error.message === "Invalid journal ID" ? 400 : 400; }
async function list(req, res) { try { res.json(await service.getJournals()); } catch (error) { res.status(500).json({ message: "Unable to retrieve journals" }); } }
async function get(req, res) { try { res.json(await service.getJournal(parseId(req.params.id))); } catch (error) { res.status(errorStatus(error)).json({ message: error.message }); } }
async function create(req, res) { try { res.status(201).json(await service.createJournal(req.body)); } catch (error) { res.status(error.code === "23505" ? 409 : 400).json({ message: error.code === "23505" ? "Journal name already exists" : error.message }); } }
async function update(req, res) { try { res.json(await service.updateJournal(parseId(req.params.id), req.body)); } catch (error) { res.status(error.code === "23505" ? 409 : errorStatus(error)).json({ message: error.code === "23505" ? "Journal name already exists" : error.message }); } }
async function remove(req, res) { try { res.json({ message: "Journal deactivated successfully", journal: await service.deleteJournal(parseId(req.params.id)) }); } catch (error) { res.status(errorStatus(error)).json({ message: error.message }); } }
module.exports = { list, get, create, update, remove };

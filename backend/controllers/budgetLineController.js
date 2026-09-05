const service = require("../services/budgetLineService");
function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid ${label} ID`);
  return id;
}
function status(error) {
  return ["Budget not found", "Budget line not found for this budget"].includes(
    error.message,
  )
    ? 404
    : 400;
}
function writeError(res, error) {
  res
    .status(error.code === "23505" ? 409 : status(error))
    .json({
      message:
        error.code === "23505"
          ? "A budget line already exists for this analytic account"
          : error.message,
    });
}
async function list(req, res) {
  try {
    res.json(await service.getLines(parseId(req.params.budgetId, "budget")));
  } catch (error) {
    writeError(res, error);
  }
}
async function get(req, res) {
  try {
    res.json(
      await service.getLine(
        parseId(req.params.budgetId, "budget"),
        parseId(req.params.id, "budget line"),
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function create(req, res) {
  try {
    res
      .status(201)
      .json(
        await service.createLine(
          parseId(req.params.budgetId, "budget"),
          req.body,
        ),
      );
  } catch (error) {
    writeError(res, error);
  }
}
async function update(req, res) {
  try {
    res.json(
      await service.updateLine(
        parseId(req.params.budgetId, "budget"),
        parseId(req.params.id, "budget line"),
        req.body,
      ),
    );
  } catch (error) {
    writeError(res, error);
  }
}
async function remove(req, res) {
  try {
    res.json({
      message: "Budget line deleted successfully",
      budgetLine: await service.deleteLine(
        parseId(req.params.budgetId, "budget"),
        parseId(req.params.id, "budget line"),
      ),
    });
  } catch (error) {
    writeError(res, error);
  }
}
module.exports = { list, get, create, update, remove };

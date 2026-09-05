const service = require("../services/analyticAccountService");
function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0)
    throw new Error("Invalid analytic account ID");
  return id;
}
function status(error) {
  return error.message === "Analytic account not found" ? 404 : 400;
}
async function list(req, res) {
  try {
    res.json(await service.getAnalyticAccounts());
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve analytic accounts" });
  }
}
async function get(req, res) {
  try {
    res.json(await service.getAnalyticAccount(parseId(req.params.id)));
  } catch (error) {
    res.status(status(error)).json({ message: error.message });
  }
}
async function create(req, res) {
  try {
    res.status(201).json(await service.createAnalyticAccount(req.body));
  } catch (error) {
    res
      .status(error.code === "23505" ? 409 : 400)
      .json({
        message:
          error.code === "23505"
            ? "Analytic account name already exists"
            : error.message,
      });
  }
}
async function update(req, res) {
  try {
    res.json(
      await service.updateAnalyticAccount(parseId(req.params.id), req.body),
    );
  } catch (error) {
    res
      .status(error.code === "23505" ? 409 : status(error))
      .json({
        message:
          error.code === "23505"
            ? "Analytic account name already exists"
            : error.message,
      });
  }
}
async function remove(req, res) {
  try {
    res.json({
      message: "Analytic account deactivated successfully",
      analyticAccount: await service.deleteAnalyticAccount(
        parseId(req.params.id),
      ),
    });
  } catch (error) {
    res.status(status(error)).json({ message: error.message });
  }
}
module.exports = { list, get, create, update, remove };

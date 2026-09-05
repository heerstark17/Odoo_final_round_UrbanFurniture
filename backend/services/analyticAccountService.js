const model = require("../models/analyticAccountModel");
function normalise(data = {}) {
  if (typeof data.name !== "string" || !data.name.trim())
    throw new Error("Analytic account name is required");
  if (!["income", "expense"].includes(data.analyticType))
    throw new Error("Analytic type must be income or expense");
  return { name: data.name.trim(), analyticType: data.analyticType };
}
async function getAnalyticAccounts() {
  return model.getAll();
}
async function getAnalyticAccount(id) {
  const item = await model.getById(id);
  if (!item) throw new Error("Analytic account not found");
  return item;
}
async function createAnalyticAccount(data) {
  return model.create(normalise(data));
}
async function updateAnalyticAccount(id, data) {
  await getAnalyticAccount(id);
  return model.update(id, normalise(data));
}
async function deleteAnalyticAccount(id) {
  await getAnalyticAccount(id);
  return model.deactivate(id);
}
module.exports = {
  getAnalyticAccounts,
  getAnalyticAccount,
  createAnalyticAccount,
  updateAnalyticAccount,
  deleteAnalyticAccount,
};

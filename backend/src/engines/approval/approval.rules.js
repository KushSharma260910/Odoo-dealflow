function validateDecision(status) {
  if (!["APPROVED", "REJECTED", "RETURNED"].includes(status))
    throw new Error("Invalid approval status");
  return status;
}
module.exports = { validateDecision };

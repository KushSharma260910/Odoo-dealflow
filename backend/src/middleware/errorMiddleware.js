function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode;
  let message = err.message || "Internal server error";

  if (!status) {
    if (err.code === "ER_DUP_ENTRY") {
      status = 409;
      message = "Duplicate entry already exists";
    } else if (
      err.code === "ER_NO_REFERENCED_ROW_2" ||
      err.code === "ER_NO_REFERENCED_ROW" ||
      err.code === "ER_NO_REFERENCED_ROW_1"
    ) {
      status = 400;
      message = "Invalid reference ID: related record does not exist";
    } else if (
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.code === "ER_ROW_IS_REFERENCED"
    ) {
      status = 400;
      message = "Cannot delete: record is referenced by other items";
    } else if (
      message.includes("not found") ||
      message.includes("Not Found") ||
      message.includes("not Found")
    ) {
      status = 404;
    } else if (
      message.includes("required") ||
      message.includes("invalid") ||
      message.includes("Invalid") ||
      message.includes("must be")
    ) {
      status = 400;
    } else {
      status = 500;
    }
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = errorMiddleware;

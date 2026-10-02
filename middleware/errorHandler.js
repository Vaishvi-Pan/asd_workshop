/**
 * middleware/errorHandler.js
 * Centralized error handling middleware.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}

module.exports = errorHandler;

/**
 * Global error handler.
 * NFR-REL-02: Handle expected errors without exposing stack traces to users.
 * NFR-SEC-10: Error responses must not expose passwords, secrets, or stack traces.
 */
const errorHandler = (err, req, res, _next) => {
  // Log internally (not to client) — use JEST_WORKER_ID to detect real test runs
  if (!process.env.JEST_WORKER_ID) {
    console.error('[Error]', err.message, err.stack);
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ error: 'Validation failed.', fields: errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field: ${err.path}` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  // Application errors with explicit status
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default 500 — do not expose internal details
  res.status(500).json({ error: 'An internal server error occurred.' });
};

module.exports = errorHandler;

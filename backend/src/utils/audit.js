const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 * Safe to call anywhere — swallows errors to avoid disrupting main flow,
 * but logs them internally.
 */
const audit = async (action, { actor, actorRole, resourceType, resourceId, details, req } = {}) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      actorRole: actorRole || null,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      details: details || {},
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[Audit] Failed to write audit log:', err.message);
  }
};

module.exports = { audit };

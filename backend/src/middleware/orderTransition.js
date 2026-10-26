/**
 * Step 2 — Order Lifecycle State Machine Enforcement
 *
 * Middleware that validates an order state transition before the controller
 * writes to the database.
 *
 * Expects:
 *   req.order  — the Order document (fetched by a prior middleware or controller)
 *   req.body.status  — the target state
 *   req.user   — the authenticated user
 */
const { validateTransition } = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const enforceOrderTransition = (req, res, next) => {
  const order = req.order;
  const targetStatus = req.body.status;
  const user = req.user;

  if (!order) {
    return res.status(500).json({ error: 'Order not attached to request.' });
  }
  if (!targetStatus) {
    return next(); // Not a status-change request — pass through
  }

  const { valid, reason } = validateTransition(order.status, targetStatus, user.role);
  if (!valid) {
    return res.status(422).json({
      error: 'Invalid order state transition.',
      detail: reason,
      currentStatus: order.status,
      requestedStatus: targetStatus,
    });
  }

  // Attach validated transition info for the controller to use
  req.transition = {
    from: order.status,
    to: targetStatus,
    actor: user._id,
    actorRole: user.role,
    reason: req.body.transitionReason || null,
  };

  next();
};

/**
 * After a successful transition, appends to the order's stateHistory
 * and writes an audit log entry.
 *
 * Call this AFTER the order is saved.
 */
const recordTransition = async (order, transition, req) => {
  order.stateHistory.push({
    fromState: transition.from,
    toState: transition.to,
    performedBy: transition.actor,
    performedByRole: transition.actorRole,
    reason: transition.reason,
  });

  await AuditLog.create({
    actor: transition.actor,
    actorRole: transition.actorRole,
    action: 'order.transition',
    resourceType: 'Order',
    resourceId: order._id,
    details: {
      orderNumber: order.orderNumber,
      from: transition.from,
      to: transition.to,
      reason: transition.reason,
    },
    ipAddress: req?.ip,
    userAgent: req?.headers?.['user-agent'],
  });
};

module.exports = { enforceOrderTransition, recordTransition };

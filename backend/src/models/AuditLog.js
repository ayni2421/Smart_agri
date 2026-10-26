const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for system events
    actorRole: { type: String, trim: true },
    action: { type: String, required: true, trim: true },         // e.g. "order.transition", "user.approve"
    resourceType: { type: String, trim: true },                   // e.g. "Order", "User"
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },               // additional context
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    // FR-REP-06: audit logs must not be modifiable through ordinary workflows
    // Enforce at the application layer — no update/delete routes exposed to ordinary users
    timestamps: false,   // use our own timestamp field for clarity
  }
);

// Prevent accidental modification
auditLogSchema.set('strict', true);

module.exports = mongoose.model('AuditLog', auditLogSchema);

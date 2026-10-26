const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// Step 2: Order Lifecycle State Machine
// ─────────────────────────────────────────────

const ORDER_STATES = [
  'draft',
  'pending',
  'accepted',
  'rejected',
  'confirmed',
  'in_fulfillment',
  'delivered',
  'completed',
  'cancelled',
  'disputed',
];

/**
 * Valid transitions map.
 * Key: current state. Value: array of { to, allowedRoles, condition (optional description) }
 */
const VALID_TRANSITIONS = {
  draft: [
    { to: 'pending', allowedRoles: ['buyer', 'admin'] },
    { to: 'cancelled', allowedRoles: ['buyer', 'admin'] },
  ],
  pending: [
    { to: 'accepted', allowedRoles: ['supplier', 'admin'] },
    { to: 'rejected', allowedRoles: ['supplier', 'admin'] },
    { to: 'cancelled', allowedRoles: ['buyer', 'admin'] },
  ],
  accepted: [
    { to: 'confirmed', allowedRoles: ['buyer', 'admin'] },
    { to: 'cancelled', allowedRoles: ['buyer', 'admin'] },
    { to: 'disputed', allowedRoles: ['buyer', 'supplier', 'admin'] },
  ],
  confirmed: [
    { to: 'in_fulfillment', allowedRoles: ['supplier', 'admin'] },
    { to: 'disputed', allowedRoles: ['buyer', 'supplier', 'admin'] },
  ],
  in_fulfillment: [
    { to: 'delivered', allowedRoles: ['transporter', 'admin'] },
    { to: 'disputed', allowedRoles: ['buyer', 'supplier', 'admin'] },
  ],
  delivered: [
    { to: 'completed', allowedRoles: ['buyer', 'admin'] },
    { to: 'disputed', allowedRoles: ['buyer', 'admin'] },
  ],
  disputed: [
    { to: 'completed', allowedRoles: ['admin'] },
    { to: 'cancelled', allowedRoles: ['admin'] },
  ],
  // Terminal states — no outgoing transitions
  rejected: [],
  completed: [],
  cancelled: [],
};

/**
 * Returns whether a transition is valid for a given actor role.
 * @param {string} from  - current state
 * @param {string} to    - target state
 * @param {string} role  - actor's role
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateTransition(from, to, role) {
  const options = VALID_TRANSITIONS[from];
  if (!options) {
    return { valid: false, reason: `Unknown current state: "${from}"` };
  }
  const match = options.find((t) => t.to === to);
  if (!match) {
    const allowed = options.map((t) => t.to);
    return {
      valid: false,
      reason: `Cannot transition from "${from}" to "${to}". Allowed targets: [${allowed.join(', ')}]`,
    };
  }
  if (!match.allowedRoles.includes(role)) {
    return {
      valid: false,
      reason: `Role "${role}" is not permitted to perform the transition from "${from}" to "${to}"`,
    };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

// State transition history entry (FR-ORD-11)
const transitionHistorySchema = new mongoose.Schema(
  {
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    reason: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // human-readable, auto-generated
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned after acceptance
    commodity: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },

    // Quantity stored in kg (FR-COM-04)
    quantityKg: { type: Number, required: true, min: 0.001 },
    submittedQuantity: { type: Number, required: true, min: 0.001 },
    submittedUnit: { type: String, required: true, enum: ['kg', 'quintal', 'tonne'] },

    // Agreed price (ETB per kg)
    agreedPricePerKg: { type: Number, min: 0 },
    currency: { type: String, default: 'ETB' },

    deliveryLocation: { type: String, trim: true },
    deliveryDeadline: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000 },

    // State machine (FR-ORD-04, FR-ORD-07)
    status: {
      type: String,
      enum: ORDER_STATES,
      default: 'draft',
      index: true,
    },
    stateHistory: [transitionHistorySchema], // FR-ORD-11

    // Linked records (FR-ORD-09)
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProduceBatch' }],
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },

    // Supplier ranking snapshot at time of order (for audit)
    rankingSnapshot: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Auto-generate order number — async style for Mongoose 9 (no next param)
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
});

orderSchema.statics.ORDER_STATES = ORDER_STATES;
orderSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;
orderSchema.statics.validateTransition = validateTransition;

module.exports = mongoose.model('Order', orderSchema);
module.exports.validateTransition = validateTransition;

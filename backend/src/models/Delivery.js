const mongoose = require('mongoose');

const DELIVERY_STATES = ['assigned', 'in_transit', 'delivered', 'failed', 'cancelled'];

const deliveryStateHistorySchema = new mongoose.Schema(
  {
    fromState: String,
    toState: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProduceBatch' }],
    transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: DELIVERY_STATES, default: 'assigned' },
    stateHistory: [deliveryStateHistorySchema],

    pickupLocation: { type: String, trim: true },
    deliveryLocation: { type: String, required: true, trim: true },
    scheduledDate: { type: Date },
    actualDeliveryDate: { type: Date },

    vehicleInfo: { type: String, trim: true },
    notes: { type: String, trim: true },

    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
  },
  { timestamps: true }
);

deliverySchema.statics.DELIVERY_STATES = DELIVERY_STATES;

module.exports = mongoose.model('Delivery', deliverySchema);

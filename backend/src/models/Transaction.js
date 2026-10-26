const mongoose = require('mongoose');

const TRANSACTION_STATUSES = ['pending', 'recorded', 'confirmed', 'failed', 'cancelled'];

const transactionSchema = new mongoose.Schema(
  {
    transactionNumber: { type: String, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    amountETB: { type: Number, min: 0 },
    currency: { type: String, default: 'ETB' },

    status: { type: String, enum: TRANSACTION_STATUSES, default: 'pending' },

    // Gateway fields (FR-PAY-05 — conditional)
    gatewayProvider: { type: String, trim: true },
    gatewayReference: { type: String, trim: true },  // provider's transaction ID
    gatewayStatus: { type: String, trim: true },
    // NOTE: No payment credentials or card data stored here (FR-PAY-08, NFR-SEC-05)

    // Manual record-keeping fallback (FR-PAY-09)
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedAt: { type: Date },
    notes: { type: String, trim: true },

    statusHistory: [
      {
        fromStatus: String,
        toStatus: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate transaction number — async style for Mongoose 9 (no next param)
transactionSchema.pre('save', async function () {
  if (!this.transactionNumber) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.transactionNumber = `TXN-${String(count + 1).padStart(7, '0')}`;
  }
});

transactionSchema.statics.TRANSACTION_STATUSES = TRANSACTION_STATUSES;

module.exports = mongoose.model('Transaction', transactionSchema);

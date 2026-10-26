const mongoose = require('mongoose');

const supplierProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, trim: true, maxlength: 200 },
    region: { type: String, trim: true },
    woreda: { type: String, trim: true },
    primaryMarket: { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },

    // Metrics for ranking formula (FR-SUP)
    completedOrders: { type: Number, default: 0, min: 0 },
    failedOrders: { type: Number, default: 0, min: 0 },

    isAdminExcluded: { type: Boolean, default: false },     // manual exclusion gate
    exclusionReason: { type: String, trim: true },

    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupplierProfile', supplierProfileSchema);

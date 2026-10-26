const mongoose = require('mongoose');

const SOURCE_TYPES = ['verified', 'submitted', 'synthetic', 'imported', 'unverified'];
const REVIEW_STATUSES = ['pending_review', 'approved', 'rejected', 'correction_requested', 'flagged'];

const priceObservationSchema = new mongoose.Schema(
  {
    commodity: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', required: true },

    // Price stored in ETB per kg (canonical unit — FR-COM-04)
    pricePerKg: { type: Number, required: true, min: 0 },

    // Original submitted values preserved for display (FR-DATA-02)
    submittedPrice: { type: Number, required: true, min: 0 },
    submittedUnit: {
      type: String,
      required: true,
      enum: ['kg', 'quintal', 'tonne'],
    },
    currency: { type: String, default: 'ETB', trim: true },

    observationDate: { type: Date, required: true },
    sourceType: { type: String, required: true, enum: SOURCE_TYPES },
    sourceDescription: { type: String, trim: true },   // e.g. "ECX report", "field survey"

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedOnBehalfOf: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // agent-mediated

    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: 'pending_review' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    reviewRuleTriggered: { type: String, trim: true }, // which anomaly rule flagged it

    // Anomaly detection
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, trim: true },
    flaggedAt: { type: Date },

    // Version history — stores previous values when a correction is submitted (FR-DATA-06)
    history: [
      {
        pricePerKg: Number,
        submittedPrice: Number,
        submittedUnit: String,
        changedAt: Date,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for efficient price queries
priceObservationSchema.index({ commodity: 1, market: 1, observationDate: -1 });
priceObservationSchema.index({ reviewStatus: 1, isFlagged: 1 });

priceObservationSchema.statics.SOURCE_TYPES = SOURCE_TYPES;
priceObservationSchema.statics.REVIEW_STATUSES = REVIEW_STATUSES;

module.exports = mongoose.model('PriceObservation', priceObservationSchema);

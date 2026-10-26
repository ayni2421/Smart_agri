const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    commodity: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },

    // Stored in kg (FR-COM-04)
    availableQuantityKg: { type: Number, required: true, min: 0 },
    submittedQuantity: { type: Number, required: true },
    submittedUnit: { type: String, required: true, enum: ['kg', 'quintal', 'tonne'] },

    // Price ask (ETB per kg)
    askPricePerKg: { type: Number, min: 0 },
    submittedAskPrice: { type: Number, min: 0 },
    submittedAskUnit: { type: String, enum: ['kg', 'quintal', 'tonne'] },

    harvestDate: { type: Date },
    storageLocation: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },

    // Change log for FR-INV-06
    changeLog: [
      {
        previousKg: Number,
        newKg: Number,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

inventorySchema.index({ supplier: 1, commodity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);

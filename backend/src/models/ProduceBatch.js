const mongoose = require('mongoose');

const produceBatchSchema = new mongoose.Schema(
  {
    batchNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    commodity: { type: mongoose.Schema.Types.ObjectId, ref: 'Commodity', required: true },
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },

    // Quantity in kg
    quantityKg: { type: Number, required: true, min: 0.001 },

    harvestDate: { type: Date },
    packagingDate: { type: Date },
    storageLocation: { type: String, trim: true },
    qualityGrade: { type: String, trim: true },
    notes: { type: String, trim: true },

    sourceType: { type: String, enum: ['verified', 'synthetic', 'unverified'], default: 'unverified' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate batch number — async style for Mongoose 9 (no next param)
produceBatchSchema.pre('save', async function () {
  if (!this.batchNumber) {
    const count = await mongoose.model('ProduceBatch').countDocuments();
    this.batchNumber = `BATCH-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('ProduceBatch', produceBatchSchema);

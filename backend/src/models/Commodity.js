const mongoose = require('mongoose');

// Supported units for all mass-based commodities (FR-COM-04 revised)
const SUPPORTED_UNITS = ['kg', 'quintal', 'tonne'];
const UNIT_TO_KG = { kg: 1, quintal: 100, tonne: 1000 };

const commoditySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    nameAmharic: { type: String, trim: true },          // Amharic display name
    description: { type: String, trim: true },
    defaultDisplayUnit: {
      type: String,
      enum: SUPPORTED_UNITS,
      default: 'quintal',
    },
    category: { type: String, trim: true },             // e.g. "cereal", "pulse"
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// FR-COM-05: deactivation does not delete historical records —
// handled by isActive flag; historical data retains commodity reference

commoditySchema.statics.SUPPORTED_UNITS = SUPPORTED_UNITS;
commoditySchema.statics.UNIT_TO_KG = UNIT_TO_KG;

/**
 * Convert a value in sourceUnit to kg
 */
commoditySchema.statics.toKg = (value, unit) => {
  const factor = UNIT_TO_KG[unit];
  if (!factor) throw new Error(`Unsupported unit: ${unit}. Supported: ${SUPPORTED_UNITS.join(', ')}`);
  return value * factor;
};

/**
 * Convert kg to a display unit
 */
commoditySchema.statics.fromKg = (valueKg, unit) => {
  const factor = UNIT_TO_KG[unit];
  if (!factor) throw new Error(`Unsupported unit: ${unit}.`);
  return valueKg / factor;
};

module.exports = mongoose.model('Commodity', commoditySchema);

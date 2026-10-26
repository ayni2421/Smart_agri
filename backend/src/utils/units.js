/**
 * Unit conversion utilities (FR-COM-04 revised).
 * Canonical storage unit: kilograms (kg).
 */

const UNIT_TO_KG = { kg: 1, quintal: 100, tonne: 1000 };
const SUPPORTED_UNITS = Object.keys(UNIT_TO_KG);

/**
 * Convert a value from the given unit to kg.
 * @throws if unit is not supported
 */
const toKg = (value, unit) => {
  const factor = UNIT_TO_KG[unit];
  if (!factor) {
    throw Object.assign(new Error(`Unsupported unit "${unit}". Supported: ${SUPPORTED_UNITS.join(', ')}`), { status: 400 });
  }
  return value * factor;
};

/**
 * Convert kg to the given unit.
 */
const fromKg = (valueKg, unit) => {
  const factor = UNIT_TO_KG[unit];
  if (!factor) {
    throw Object.assign(new Error(`Unsupported unit "${unit}".`), { status: 400 });
  }
  return valueKg / factor;
};

module.exports = { toKg, fromKg, UNIT_TO_KG, SUPPORTED_UNITS };

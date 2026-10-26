/**
 * Anomaly Detection Service (FR-ANOM-01 through FR-ANOM-08)
 *
 * Rule-based detection of potentially invalid or unusual price observations.
 * Rules are documented here and referenced in flag records (FR-ANOM-07).
 *
 * Rules:
 *   RULE-01: Price must be positive (> 0)
 *   RULE-02: Price must not exceed the configured absolute ceiling per commodity (ETB/kg)
 *   RULE-03: Price must not be below the configured absolute floor per commodity (ETB/kg)
 *   RULE-04: Price must not deviate more than N% from the rolling average for the same
 *             commodity-market pair over the last 30 days (IQR-based threshold)
 *   RULE-05: Observation date must not be in the future
 *   RULE-06: Quantity (where provided) must be positive
 */

// Default thresholds — should be configurable by Admin in production
const DEFAULT_THRESHOLDS = {
  maxDeviationPercent: 50, // flag if price deviates > 50% from 30-day average
  minPricePerKg: 0.01,     // ETB per kg absolute floor
  maxPricePerKg: 500,      // ETB per kg absolute ceiling (~50,000 ETB/quintal)
};

/**
 * Check a single price observation against all rules.
 *
 * @param {object} observation  — { pricePerKg, observationDate, quantityKg? }
 * @param {object} context      — { recentObservations: [{pricePerKg}], thresholds? }
 * @returns {{ flags: string[], rules: string[], isFlagged: boolean }}
 */
const checkObservation = (observation, context = {}) => {
  const { pricePerKg, observationDate, quantityKg } = observation;
  const { recentObservations = [], thresholds = DEFAULT_THRESHOLDS } = context;
  const flags = [];
  const rulesTriggered = [];

  // RULE-01: Positive price
  if (!pricePerKg || pricePerKg <= 0) {
    flags.push('Price must be greater than zero.');
    rulesTriggered.push('RULE-01');
  }

  // RULE-02: Absolute ceiling
  if (pricePerKg > thresholds.maxPricePerKg) {
    flags.push(`Price ${pricePerKg} ETB/kg exceeds configured ceiling ${thresholds.maxPricePerKg} ETB/kg.`);
    rulesTriggered.push('RULE-02');
  }

  // RULE-03: Absolute floor
  if (pricePerKg < thresholds.minPricePerKg) {
    flags.push(`Price ${pricePerKg} ETB/kg is below configured floor ${thresholds.minPricePerKg} ETB/kg.`);
    rulesTriggered.push('RULE-03');
  }

  // RULE-04: Rolling average deviation
  if (recentObservations.length >= 3) {
    const prices = recentObservations.map((o) => o.pricePerKg).filter((p) => p > 0);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const deviationPct = Math.abs((pricePerKg - avg) / avg) * 100;
    if (deviationPct > thresholds.maxDeviationPercent) {
      flags.push(
        `Price deviates ${deviationPct.toFixed(1)}% from the 30-day average (${avg.toFixed(2)} ETB/kg). Threshold: ${thresholds.maxDeviationPercent}%.`
      );
      rulesTriggered.push('RULE-04');
    }
  }

  // RULE-05: Future date
  if (observationDate && new Date(observationDate) > new Date()) {
    flags.push('Observation date is in the future.');
    rulesTriggered.push('RULE-05');
  }

  // RULE-06: Positive quantity
  if (quantityKg !== undefined && quantityKg !== null && quantityKg <= 0) {
    flags.push('Quantity must be greater than zero.');
    rulesTriggered.push('RULE-06');
  }

  return {
    isFlagged: flags.length > 0,
    flags,
    rulesTriggered,
    thresholdsApplied: thresholds,
  };
};

module.exports = { checkObservation, DEFAULT_THRESHOLDS };

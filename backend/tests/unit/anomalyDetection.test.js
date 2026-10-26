const { checkObservation, DEFAULT_THRESHOLDS } = require('../../src/services/anomalyDetection');

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

describe('Anomaly detection (FR-ANOM-01 through FR-ANOM-07)', () => {
  test('valid observation is not flagged', () => {
    const result = checkObservation({ pricePerKg: 40, observationDate: yesterday() }, {});
    expect(result.isFlagged).toBe(false);
  });

  test('RULE-01: zero price is flagged', () => {
    const result = checkObservation({ pricePerKg: 0, observationDate: yesterday() }, {});
    expect(result.isFlagged).toBe(true);
    expect(result.rulesTriggered).toContain('RULE-01');
  });

  test('RULE-01: negative price is flagged', () => {
    const result = checkObservation({ pricePerKg: -5, observationDate: yesterday() }, {});
    expect(result.rulesTriggered).toContain('RULE-01');
  });

  test('RULE-02: price above ceiling is flagged', () => {
    const result = checkObservation({ pricePerKg: 600, observationDate: yesterday() }, {});
    expect(result.rulesTriggered).toContain('RULE-02');
  });

  test('RULE-03: price below floor is flagged', () => {
    const result = checkObservation({ pricePerKg: 0.001, observationDate: yesterday() }, {});
    expect(result.rulesTriggered).toContain('RULE-03');
  });

  test('RULE-04: price deviating > 50% from 30-day avg is flagged', () => {
    const recent = [{ pricePerKg: 40 }, { pricePerKg: 40 }, { pricePerKg: 40 }];
    const result = checkObservation({ pricePerKg: 80, observationDate: yesterday() }, { recentObservations: recent });
    expect(result.rulesTriggered).toContain('RULE-04');
  });

  test('RULE-04: price within 50% of avg is not flagged for that rule', () => {
    const recent = [{ pricePerKg: 40 }, { pricePerKg: 40 }, { pricePerKg: 40 }];
    const result = checkObservation({ pricePerKg: 55, observationDate: yesterday() }, { recentObservations: recent });
    expect(result.rulesTriggered).not.toContain('RULE-04');
  });

  test('RULE-04: not triggered if fewer than 3 recent observations', () => {
    const recent = [{ pricePerKg: 40 }, { pricePerKg: 40 }];
    const result = checkObservation({ pricePerKg: 999, observationDate: yesterday() }, { recentObservations: recent });
    expect(result.rulesTriggered).not.toContain('RULE-04');
  });

  test('RULE-05: future observation date is flagged', () => {
    const result = checkObservation({ pricePerKg: 40, observationDate: tomorrow() }, {});
    expect(result.rulesTriggered).toContain('RULE-05');
  });

  test('RULE-06: zero quantity is flagged', () => {
    const result = checkObservation({ pricePerKg: 40, observationDate: yesterday(), quantityKg: 0 }, {});
    expect(result.rulesTriggered).toContain('RULE-06');
  });

  test('multiple rules can trigger in one observation', () => {
    const result = checkObservation({ pricePerKg: -5, observationDate: tomorrow(), quantityKg: -1 }, {});
    expect(result.rulesTriggered.length).toBeGreaterThan(1);
  });

  test('flagged: false when result is clean', () => {
    const result = checkObservation({ pricePerKg: 40, observationDate: yesterday() }, {});
    expect(result.flags).toHaveLength(0);
    expect(result.isFlagged).toBe(false);
  });
});

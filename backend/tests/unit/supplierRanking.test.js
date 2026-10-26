const { rankSuppliers, WEIGHTS } = require('../../src/services/supplierRanking');

const makeCandidates = () => [
  {
    supplierId: 'sup1', supplierUserId: 'user1',
    askPricePerKg: 40, availableKg: 1000,
    primaryMarketId: 'market1', region: 'Amhara',
    completedOrders: 10, failedOrders: 0, isAdminExcluded: false,
    registeredAt: new Date('2023-01-01'),
  },
  {
    supplierId: 'sup2', supplierUserId: 'user2',
    askPricePerKg: 38, availableKg: 500,
    primaryMarketId: 'market2', region: 'Sidama',
    completedOrders: 3, failedOrders: 1, isAdminExcluded: false,
    registeredAt: new Date('2023-06-01'),
  },
  {
    supplierId: 'sup3', supplierUserId: 'user3',
    askPricePerKg: 42, availableKg: 2000,
    primaryMarketId: 'market1', region: 'Amhara',
    completedOrders: 20, failedOrders: 2, isAdminExcluded: false,
    registeredAt: new Date('2022-01-01'),
  },
];

const request = { quantityKg: 300, marketId: 'market1', region: 'Amhara' };

describe('Supplier ranking service (FR-SUP-01 through FR-SUP-08)', () => {
  test('returns ranked array and baseline', () => {
    const { ranked, baseline } = rankSuppliers(makeCandidates(), request);
    expect(ranked).toHaveLength(3);
    expect(baseline).toBeDefined();
    expect(baseline.askPricePerKg).toBe(38); // lowest price
  });

  test('all eligible candidates pass quantity gate', () => {
    const { ranked } = rankSuppliers(makeCandidates(), request);
    ranked.forEach((r) => expect(r.availableKg).toBeGreaterThanOrEqual(300));
  });

  test('scores sum is within 0–100', () => {
    const { ranked } = rankSuppliers(makeCandidates(), request);
    ranked.forEach((r) => {
      expect(r.scores.total).toBeGreaterThanOrEqual(0);
      expect(r.scores.total).toBeLessThanOrEqual(100);
    });
  });

  test('excludes admin-excluded suppliers', () => {
    const candidates = makeCandidates();
    candidates[0].isAdminExcluded = true;
    const { ranked } = rankSuppliers(candidates, request);
    expect(ranked.find((r) => r.supplierId === 'sup1')).toBeUndefined();
  });

  test('excludes suppliers with insufficient quantity', () => {
    const { ranked } = rankSuppliers(makeCandidates(), { ...request, quantityKg: 600 });
    expect(ranked.find((r) => r.supplierId === 'sup2')).toBeUndefined();
  });

  test('returns empty result when no eligible suppliers', () => {
    const { ranked, message } = rankSuppliers(makeCandidates(), { ...request, quantityKg: 99999 });
    expect(ranked).toHaveLength(0);
    expect(message).toBeDefined();
  });

  test('weights sum to 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  test('disclaimer is present in response (FR-SUP-07)', () => {
    const { disclaimer } = rankSuppliers(makeCandidates(), request);
    expect(disclaimer).toContain('advisory');
  });

  test('same-market supplier gets higher location score than same-region', () => {
    const candidates = [
      { supplierId: 'a', askPricePerKg: 40, availableKg: 500, primaryMarketId: 'market1', region: 'Amhara', completedOrders: 0, failedOrders: 0, isAdminExcluded: false, registeredAt: new Date() },
      { supplierId: 'b', askPricePerKg: 40, availableKg: 500, primaryMarketId: 'other', region: 'Amhara', completedOrders: 0, failedOrders: 0, isAdminExcluded: false, registeredAt: new Date() },
    ];
    const { ranked } = rankSuppliers(candidates, { quantityKg: 100, marketId: 'market1', region: 'Amhara' });
    expect(ranked[0].supplierId).toBe('a');
    expect(ranked[0].scores.location).toBeGreaterThan(ranked[1].scores.location);
  });
});

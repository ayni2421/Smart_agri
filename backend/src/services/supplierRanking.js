/**
 * Supplier Ranking Service (FR-SUP-01 through FR-SUP-08, Gap 2 decision)
 *
 * Deterministic weighted scoring formula:
 *   S = 0.40 * priceScore + 0.30 * quantityScore + 0.20 * locationScore + 0.10 * historyScore
 *
 * All scores are normalized 0–1, final score is 0–100.
 *
 * Tie-breaking: lowest price, then earliest registration date.
 */

const WEIGHTS = {
  price: 0.40,
  quantity: 0.30,
  location: 0.20,
  history: 0.10,
};

/**
 * Location score based on proximity of supplier's primary market to the buyer's market.
 * @param {string} supplierMarketId
 * @param {string} requestedMarketId
 * @param {string} supplierRegion
 * @param {string} requestedRegion
 */
const locationScore = (supplierMarketId, requestedMarketId, supplierRegion, requestedRegion) => {
  if (supplierMarketId && requestedMarketId && String(supplierMarketId) === String(requestedMarketId)) {
    return 1.0; // Same market
  }
  if (supplierRegion && requestedRegion && supplierRegion === requestedRegion) {
    return 0.5; // Same region
  }
  return 0.0;
};

/**
 * History score: completed / (completed + failed + 1) capped at 1.
 */
const historyScore = (completedOrders, failedOrders) => {
  return completedOrders / (completedOrders + failedOrders + 1);
};

/**
 * Rank a set of eligible supplier candidates.
 *
 * @param {Array} candidates — each candidate: {
 *   supplierId, supplierUserId, askPricePerKg, availableKg, primaryMarketId,
 *   region, completedOrders, failedOrders, registeredAt
 * }
 * @param {object} request — { quantityKg, marketId, region }
 * @returns {Array} sorted candidates with scores and breakdown
 */
const rankSuppliers = (candidates, request) => {
  if (!candidates || candidates.length === 0) {
    return { ranked: [], baseline: null, message: 'No eligible suppliers found.' };
  }

  // ── Eligibility gate ──────────────────────────────────────
  // (Caller is responsible for pre-filtering; this is a safety re-check)
  const eligible = candidates.filter(
    (c) => c.availableKg >= request.quantityKg && !c.isAdminExcluded
  );

  if (eligible.length === 0) {
    return {
      ranked: [],
      baseline: null,
      message: 'No suppliers have sufficient quantity for this request.',
    };
  }

  // ── Normalization bounds ──────────────────────────────────
  const prices = eligible.map((c) => c.askPricePerKg);
  const quantities = eligible.map((c) => c.availableKg);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const maxQty = Math.max(...quantities);
  const priceRange = maxPrice - minPrice;

  // ── Score each candidate ──────────────────────────────────
  const scored = eligible.map((c) => {
    const pScore =
      priceRange === 0
        ? 1.0 // All prices equal — no differentiation
        : (maxPrice - c.askPricePerKg) / priceRange;

    const qScore = maxQty === 0 ? 0 : c.availableKg / maxQty;

    const lScore = locationScore(
      c.primaryMarketId,
      request.marketId,
      c.region,
      request.region
    );

    const hScore = historyScore(c.completedOrders || 0, c.failedOrders || 0);

    const totalScore =
      WEIGHTS.price * pScore +
      WEIGHTS.quantity * qScore +
      WEIGHTS.location * lScore +
      WEIGHTS.history * hScore;

    return {
      ...c,
      scores: {
        price: parseFloat((pScore * 100).toFixed(2)),
        quantity: parseFloat((qScore * 100).toFixed(2)),
        location: parseFloat((lScore * 100).toFixed(2)),
        history: parseFloat((hScore * 100).toFixed(2)),
        total: parseFloat((totalScore * 100).toFixed(2)),
      },
    };
  });

  // ── Sort: highest total score, then lowest price, then earliest registration ──
  scored.sort((a, b) => {
    if (b.scores.total !== a.scores.total) return b.scores.total - a.scores.total;
    if (a.askPricePerKg !== b.askPricePerKg) return a.askPricePerKg - b.askPricePerKg;
    return new Date(a.registeredAt) - new Date(b.registeredAt);
  });

  // ── Baseline: lowest-price eligible supplier (FR-SUP-08) ──
  const baseline = eligible.reduce((best, c) =>
    c.askPricePerKg < best.askPricePerKg ? c : best
  );

  return {
    ranked: scored,
    baseline: {
      supplierId: baseline.supplierId,
      askPricePerKg: baseline.askPricePerKg,
      note: 'Lowest-price eligible supplier (baseline for FR-SUP-08 evaluation)',
    },
    weights: WEIGHTS,
    requestSummary: {
      quantityKg: request.quantityKg,
      marketId: request.marketId,
      region: request.region,
    },
    eligibleCount: eligible.length,
    totalCandidates: candidates.length,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'This ranking is advisory (BR-06). It does not automatically create an order.',
  };
};

module.exports = { rankSuppliers, WEIGHTS };

const PriceObservation = require('../models/PriceObservation');
const Commodity = require('../models/Commodity');
const { toKg } = require('../utils/units');
const { checkObservation } = require('../services/anomalyDetection');
const { audit } = require('../utils/audit');

// POST /api/prices
const submitPrice = async (req, res, next) => {
  try {
    const {
      commodity, market, submittedPrice, submittedUnit,
      observationDate, sourceType, sourceDescription,
      submittedOnBehalfOf,
    } = req.body;

    const pricePerKg = toKg(parseFloat(submittedPrice), submittedUnit);

    // Fetch recent observations for anomaly check
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await PriceObservation.find({
      commodity, market,
      observationDate: { $gte: thirtyDaysAgo },
      reviewStatus: { $in: ['approved', 'pending_review'] },
    }).select('pricePerKg');

    const anomaly = checkObservation(
      { pricePerKg, observationDate: new Date(observationDate) },
      { recentObservations: recent }
    );

    const observation = await PriceObservation.create({
      commodity,
      market,
      pricePerKg,
      submittedPrice: parseFloat(submittedPrice),
      submittedUnit,
      observationDate: new Date(observationDate),
      sourceType,
      sourceDescription,
      submittedBy: req.user._id,
      submittedOnBehalfOf: submittedOnBehalfOf || undefined,
      reviewStatus: anomaly.isFlagged ? 'flagged' : 'pending_review',
      isFlagged: anomaly.isFlagged,
      flagReason: anomaly.flags.join('; ') || null,
      flaggedAt: anomaly.isFlagged ? new Date() : undefined,
      reviewRuleTriggered: anomaly.rulesTriggered.join(', ') || null,
    });

    await audit('price.submit', {
      actor: req.user._id,
      actorRole: req.user.role,
      resourceType: 'PriceObservation',
      resourceId: observation._id,
      details: { commodity, market, pricePerKg, isFlagged: anomaly.isFlagged },
      req,
    });

    res.status(201).json({
      observation,
      anomaly: anomaly.isFlagged
        ? { flagged: true, flags: anomaly.flags, rules: anomaly.rulesTriggered }
        : { flagged: false },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/prices  — filter by commodity, market, date range, sourceType
const getPrices = async (req, res, next) => {
  try {
    const {
      commodity, market, sourceType, reviewStatus,
      startDate, endDate, page = 1, limit = 50,
    } = req.query;

    const filter = {};
    if (commodity) filter.commodity = commodity;
    if (market) filter.market = market;
    if (sourceType) filter.sourceType = sourceType;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (startDate || endDate) {
      filter.observationDate = {};
      if (startDate) filter.observationDate.$gte = new Date(startDate);
      if (endDate) filter.observationDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [observations, total] = await Promise.all([
      PriceObservation.find(filter)
        .populate('commodity', 'name defaultDisplayUnit')
        .populate('market', 'name region')
        .populate('submittedBy', 'firstName lastName role')
        .sort({ observationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PriceObservation.countDocuments(filter),
    ]);

    res.json({ observations, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/prices/compare — descriptive comparison across markets
const comparePrices = async (req, res, next) => {
  try {
    const { commodity, markets, startDate, endDate } = req.query;

    if (!commodity) return res.status(400).json({ error: 'commodity is required.' });

    const marketIds = Array.isArray(markets) ? markets : (markets ? [markets] : []);
    const filter = {
      commodity,
      reviewStatus: 'approved',
      sourceType: { $ne: 'synthetic' }, // exclude synthetic from verified comparisons
    };
    if (marketIds.length > 0) filter.market = { $in: marketIds };
    if (startDate || endDate) {
      filter.observationDate = {};
      if (startDate) filter.observationDate.$gte = new Date(startDate);
      if (endDate) filter.observationDate.$lte = new Date(endDate);
    }

    const observations = await PriceObservation.find(filter)
      .populate('market', 'name region')
      .select('market pricePerKg submittedUnit observationDate sourceType');

    if (observations.length === 0) {
      return res.json({
        message: 'Insufficient data for comparison.',
        observations: [],
        summary: null,
      });
    }

    // Group by market
    const byMarket = {};
    for (const obs of observations) {
      const mId = String(obs.market._id);
      if (!byMarket[mId]) {
        byMarket[mId] = {
          market: { id: mId, name: obs.market.name, region: obs.market.region },
          prices: [],
        };
      }
      byMarket[mId].prices.push(obs.pricePerKg);
    }

    const summary = Object.values(byMarket).map((m) => {
      const sorted = [...m.prices].sort((a, b) => a - b);
      const avg = sorted.reduce((s, p) => s + p, 0) / sorted.length;
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      return {
        market: m.market,
        count: sorted.length,
        minPricePerKg: sorted[0],
        maxPricePerKg: sorted[sorted.length - 1],
        avgPricePerKg: parseFloat(avg.toFixed(4)),
        medianPricePerKg: parseFloat(median.toFixed(4)),
      };
    });

    res.json({
      summary,
      note: 'FR-PRICE-07: These are descriptive statistics, not guaranteed future prices.',
      dataNote: 'Only approved, non-synthetic observations are included in this comparison.',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/prices/:id/review — Data Reviewer action
const reviewPrice = async (req, res, next) => {
  try {
    const { decision, reviewNotes } = req.body;
    const validDecisions = ['approved', 'rejected', 'correction_requested'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({ error: `Invalid decision. Use: ${validDecisions.join(', ')}` });
    }

    const observation = await PriceObservation.findById(req.params.id);
    if (!observation) return res.status(404).json({ error: 'Observation not found.' });

    // FR-DATA-09: prevent silent overwrite of previously reviewed observation
    if (['approved', 'rejected'].includes(observation.reviewStatus)) {
      return res.status(409).json({
        error: 'This observation has already been reviewed. Create a correction record instead.',
        currentStatus: observation.reviewStatus,
      });
    }

    observation.reviewStatus = decision;
    observation.reviewedBy = req.user._id;
    observation.reviewedAt = new Date();
    observation.reviewNotes = reviewNotes;

    await observation.save();

    await audit('price.review', {
      actor: req.user._id,
      actorRole: req.user.role,
      resourceType: 'PriceObservation',
      resourceId: observation._id,
      details: { decision, reviewNotes },
      req,
    });

    res.json({ message: `Observation ${decision}.`, observation });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitPrice, getPrices, comparePrices, reviewPrice };

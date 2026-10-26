const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const SupplierProfile = require('../models/SupplierProfile');
const { rankSuppliers } = require('../services/supplierRanking');
const { toKg } = require('../utils/units');

router.use(authenticate);

// GET /api/suppliers/rank?commodity=&quantityKg=&unit=&marketId=&region=
router.get('/rank', authorize('buyer', 'admin'), async (req, res, next) => {
  try {
    const { commodity, quantity, unit = 'quintal', marketId, region } = req.query;
    if (!commodity || !quantity) {
      return res.status(400).json({ error: 'commodity and quantity are required.' });
    }
    const quantityKg = toKg(parseFloat(quantity), unit);

    // Find active inventory records for this commodity
    const records = await Inventory.find({ commodity, isActive: true, availableQuantityKg: { $gte: quantityKg } })
      .populate('supplier', 'createdAt region')
      .populate({ path: 'supplier', populate: { path: 'supplierProfile' } });

    const candidates = await Promise.all(records.map(async (inv) => {
      const profile = await SupplierProfile.findOne({ user: inv.supplier._id });
      return {
        supplierId: profile?._id || inv.supplier._id,
        supplierUserId: inv.supplier._id,
        askPricePerKg: inv.askPricePerKg || 0,
        availableKg: inv.availableQuantityKg,
        primaryMarketId: inv.market || profile?.primaryMarket,
        region: inv.supplier.region || profile?.region,
        completedOrders: profile?.completedOrders || 0,
        failedOrders: profile?.failedOrders || 0,
        isAdminExcluded: profile?.isAdminExcluded || false,
        registeredAt: inv.supplier.createdAt,
        inventoryId: inv._id,
      };
    }));

    const result = rankSuppliers(candidates, { quantityKg, marketId, region });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;

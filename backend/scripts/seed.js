/**
 * SAMIC Bootstrap Script
 *
 * Creates only the minimum required to start the platform:
 *   - 3 commodities (Teff, Wheat, Maize)
 *   - 3 markets (Addis Ababa, Bahir Dar, Hawassa)
 *   - 1 admin account
 *
 * No synthetic prices, orders, users, or demo data.
 * All real data is entered through the application by users.
 *
 * Usage:
 *   node scripts/seed.js           — bootstrap if not already done
 *   node scripts/seed.js --reset   — wipe everything and re-bootstrap
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User      = require('../src/models/User');
const Commodity = require('../src/models/Commodity');
const Market    = require('../src/models/Market');

const RESET = process.argv.includes('--reset');

const COMMODITIES = [
  { name: 'Teff',  nameAmharic: 'ጤፍ',  category: 'cereal', defaultDisplayUnit: 'quintal' },
  { name: 'Wheat', nameAmharic: 'ስንዴ', category: 'cereal', defaultDisplayUnit: 'quintal' },
  { name: 'Maize', nameAmharic: 'በቆሎ', category: 'cereal', defaultDisplayUnit: 'quintal' },
];

const MARKETS = [
  { name: 'Addis Ababa Central Market', region: 'Addis Ababa', zone: 'Addis Ababa', town: 'Addis Ababa', latitude: 9.0192,  longitude: 38.7525 },
  { name: 'Bahir Dar Market',           region: 'Amhara',      zone: 'South Gondar', town: 'Bahir Dar', latitude: 11.6000, longitude: 37.3833 },
  { name: 'Hawassa Market',             region: 'Sidama',      zone: 'Sidama',       town: 'Hawassa',   latitude: 7.0504,  longitude: 38.4955 },
];

async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', mongoose.connection.host);

  if (RESET) {
    console.log('--reset: clearing all collections…');
    const cols = await mongoose.connection.db.listCollections().toArray();
    for (const col of cols) {
      await mongoose.connection.db.collection(col.name).deleteMany({});
    }
    console.log('Cleared.\n');
  }

  // Skip if already bootstrapped
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin && !RESET) {
    console.log('Platform already bootstrapped. Run with --reset to start over.');
    await mongoose.disconnect();
    return;
  }

  // ── 1. Admin account ──────────────────────────────────────────────────────
  console.log('Creating admin account…');
  const admin = await User.create({
    firstName: 'Addis',
    lastName:  'Admin',
    email:     'addis@gmail.com',
    password:  'Admin123',
    role:      'admin',
    status:    'active',
  });
  console.log(`  Admin: ${admin.email}  (password: Admin123)`);

  // ── 2. Commodities ────────────────────────────────────────────────────────
  console.log('Creating commodities…');
  const commodities = await Commodity.insertMany(
    COMMODITIES.map(c => ({ ...c, createdBy: admin._id }))
  );
  commodities.forEach(c => console.log(`  ${c.name} (${c.nameAmharic})`));

  // ── 3. Markets ────────────────────────────────────────────────────────────
  console.log('Creating markets…');
  const markets = await Market.insertMany(
    MARKETS.map(m => ({ ...m, createdBy: admin._id }))
  );
  markets.forEach(m => console.log(`  ${m.name} — ${m.region}`));

  console.log(`
✓ Bootstrap complete.

  Admin login
  ──────────────────────────
  URL:      http://localhost:3000/login
  Email:    addis@gmail.com
  Password: Admin123

  Change the admin password after first login.

  Next steps
  ──────────────────────────
  1. Log in as admin and create user accounts for each role:
       Agents, Buyers, Suppliers, Transporters, Data Reviewers
  2. Or register directly as a Buyer or Farmer at /register
  3. Add price observations through the Market Prices section
  4. Create inventory records as a Supplier
  5. Place orders as a Buyer
`);

  await mongoose.disconnect();
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

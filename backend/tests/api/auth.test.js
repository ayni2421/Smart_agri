/**
 * API tests for authentication (FR-AUTH-01 through FR-AUTH-09)
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/samic_test');
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
});

describe('POST /api/auth/register', () => {
  test('buyer can self-register and receives token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'Buyer',
      email: 'buyer@test.com', password: 'Test@1234!', role: 'buyer',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.status).toBe('active');
  });

  test('farmer self-registers with pending_approval status', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Test', lastName: 'Farmer',
      email: 'farmer@test.com', password: 'Test@1234!', role: 'farmer',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe('pending_approval');
    expect(res.body.token).toBeUndefined(); // no token for pending accounts
  });

  test('FR-AUTH-08: admin role cannot self-register', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Evil', lastName: 'Admin',
      email: 'evil@test.com', password: 'Test@1234!', role: 'admin',
    });
    expect(res.status).toBe(403);
  });

  test('invalid email is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'X', lastName: 'Y', email: 'not-an-email',
      password: 'Test@1234!', role: 'buyer',
    });
    expect(res.status).toBe(400);
    expect(res.body.fields).toBeDefined();
  });

  test('short password is rejected', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'X', lastName: 'Y', email: 'short@test.com',
      password: '123', role: 'buyer',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('valid credentials return JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'buyer@test.com', password: 'Test@1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('buyer@test.com');
  });

  test('FR-AUTH-02: wrong password returns 401 without revealing account existence', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'buyer@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials.');
  });

  test('non-existent email returns same 401 message (FR-AUTH-02)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'Test@1234!',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials.');
  });

  test('pending_approval account cannot login to active operations', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'farmer@test.com', password: 'Test@1234!',
    });
    expect(res.status).toBe(403);
    expect(res.body.accountStatus).toBe('pending_approval');
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'buyer@test.com', password: 'Test@1234!',
    });
    token = res.body.token;
  });

  test('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('buyer@test.com');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

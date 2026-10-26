const { validateTransition } = require('../../src/models/Order');

describe('Order state machine (FR-ORD-07)', () => {
  // Valid transitions
  test('buyer can submit draft → pending', () => {
    expect(validateTransition('draft', 'pending', 'buyer').valid).toBe(true);
  });
  test('supplier can accept pending → accepted', () => {
    expect(validateTransition('pending', 'accepted', 'supplier').valid).toBe(true);
  });
  test('supplier can reject pending → rejected', () => {
    expect(validateTransition('pending', 'rejected', 'supplier').valid).toBe(true);
  });
  test('buyer can confirm accepted → confirmed', () => {
    expect(validateTransition('accepted', 'confirmed', 'buyer').valid).toBe(true);
  });
  test('supplier can move confirmed → in_fulfillment', () => {
    expect(validateTransition('confirmed', 'in_fulfillment', 'supplier').valid).toBe(true);
  });
  test('transporter can mark in_fulfillment → delivered', () => {
    expect(validateTransition('in_fulfillment', 'delivered', 'transporter').valid).toBe(true);
  });
  test('buyer can complete delivered → completed', () => {
    expect(validateTransition('delivered', 'completed', 'buyer').valid).toBe(true);
  });
  test('admin can resolve dispute → completed', () => {
    expect(validateTransition('disputed', 'completed', 'admin').valid).toBe(true);
  });

  // Invalid transitions
  test('buyer cannot jump from draft → completed', () => {
    expect(validateTransition('draft', 'completed', 'buyer').valid).toBe(false);
  });
  test('transporter cannot accept pending → accepted', () => {
    expect(validateTransition('pending', 'accepted', 'transporter').valid).toBe(false);
  });
  test('buyer cannot dispute from pending state', () => {
    expect(validateTransition('pending', 'disputed', 'buyer').valid).toBe(false);
  });
  test('no transition out of completed', () => {
    expect(validateTransition('completed', 'pending', 'admin').valid).toBe(false);
  });
  test('no transition out of rejected', () => {
    expect(validateTransition('rejected', 'pending', 'admin').valid).toBe(false);
  });
  test('buyer cannot resolve dispute (admin only)', () => {
    expect(validateTransition('disputed', 'completed', 'buyer').valid).toBe(false);
  });

  // Error messages
  test('reason describes the invalid transition', () => {
    const result = validateTransition('completed', 'pending', 'buyer');
    expect(result.reason).toContain('completed');
    expect(result.reason).toContain('pending');
  });
});

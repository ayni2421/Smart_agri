const { toKg, fromKg, SUPPORTED_UNITS } = require('../../src/utils/units');

describe('Unit conversion utilities', () => {
  test('1 quintal = 100 kg', () => {
    expect(toKg(1, 'quintal')).toBe(100);
  });
  test('1 tonne = 1000 kg', () => {
    expect(toKg(1, 'tonne')).toBe(1000);
  });
  test('5 quintal = 500 kg', () => {
    expect(toKg(5, 'quintal')).toBe(500);
  });
  test('fromKg: 500 kg = 5 quintal', () => {
    expect(fromKg(500, 'quintal')).toBe(5);
  });
  test('unsupported unit throws', () => {
    expect(() => toKg(1, 'bushel')).toThrow();
  });
  test('SUPPORTED_UNITS includes kg, quintal, tonne', () => {
    expect(SUPPORTED_UNITS).toEqual(expect.arrayContaining(['kg', 'quintal', 'tonne']));
  });
});

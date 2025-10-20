import { roundPricePerSqm } from '../price-rounding';

describe('Price Per SQM Rounding', () => {
  test('rounds 00-24 down to 00', () => {
    expect(roundPricePerSqm(9020)).toBe(9000);
    expect(roundPricePerSqm(9024)).toBe(9000);
    expect(roundPricePerSqm(9001)).toBe(9000);
    expect(roundPricePerSqm(9000)).toBe(9000);
  });

  test('rounds 25-74 to 50', () => {
    expect(roundPricePerSqm(9025)).toBe(9050);
    expect(roundPricePerSqm(9042)).toBe(9050);
    expect(roundPricePerSqm(9030)).toBe(9050);
    expect(roundPricePerSqm(9074)).toBe(9050);
    expect(roundPricePerSqm(2030)).toBe(2050);
  });

  test('rounds 75-99 up to next 00', () => {
    expect(roundPricePerSqm(9075)).toBe(9100);
    expect(roundPricePerSqm(2075)).toBe(2100);
    expect(roundPricePerSqm(9099)).toBe(9100);
    expect(roundPricePerSqm(9080)).toBe(9100);
  });

  test('handles edge cases', () => {
    expect(roundPricePerSqm(0)).toBe(0);
    expect(roundPricePerSqm(-100)).toBe(0);
    expect(roundPricePerSqm(50)).toBe(50);
    expect(roundPricePerSqm(100)).toBe(100);
    expect(roundPricePerSqm(undefined)).toBe(undefined);
  });

  test('works with decimal values', () => {
    expect(roundPricePerSqm(9042.55)).toBe(9050);
    expect(roundPricePerSqm(9075.99)).toBe(9100);
    expect(roundPricePerSqm(9020.1)).toBe(9000);
  });
});
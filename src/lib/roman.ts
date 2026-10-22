// Romerska siffror i gemener, t.ex. 2026 → "mmxxvi". Gäller heltal 1–3999.
const NUMERALS: [number, string][] = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new RangeError(`toRoman: ${value} går inte att skriva med romerska siffror (1–3999)`);
  }
  let rest = value;
  let out = '';
  for (const [n, symbol] of NUMERALS) {
    while (rest >= n) {
      out += symbol;
      rest -= n;
    }
  }
  return out;
}

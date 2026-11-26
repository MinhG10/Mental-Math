function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export class Fraction {
  constructor(numerator, denominator = 1n) {
    const n = BigInt(numerator);
    const d = BigInt(denominator);
    if (!d) throw new RangeError('Không thể chia cho 0.');
    const divisor = gcd(n, d);
    this.n = (d < 0n ? -n : n) / divisor;
    this.d = (d < 0n ? -d : d) / divisor;
    if (this.n.toString(2).length > 256 || this.d.toString(2).length > 256) {
      throw new RangeError('Biểu thức vượt giới hạn tính toán.');
    }
    Object.freeze(this);
  }

  static parse(value) {
    const text = String(value).trim().replace('−', '-').replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return null;
    const [whole, decimals = ''] = text.replace(/^[+-]/, '').split('.');
    const scale = 10n ** BigInt(decimals.length);
    const magnitude = BigInt(whole || '0') * scale + BigInt(decimals || '0');
    return new Fraction(text.startsWith('-') ? -magnitude : magnitude, scale);
  }

  add(other) { return new Fraction(this.n * other.d + other.n * this.d, this.d * other.d); }
  subtract(other) { return new Fraction(this.n * other.d - other.n * this.d, this.d * other.d); }
  multiply(other) { return new Fraction(this.n * other.n, this.d * other.d); }
  divide(other) { return new Fraction(this.n * other.d, this.d * other.n); }
  equals(other) { return this.n === other.n && this.d === other.d; }

  // Return null when the exact value requires more decimal places.
  decimal(maxPlaces = 24) {
    for (let places = 0, scale = 1n; places <= maxPlaces; places++, scale *= 10n) {
      const scaled = this.n * scale;
      if (scaled % this.d === 0n) return formatScaled(scaled / this.d, places);
    }
    return null;
  }

  round(places) {
    const scale = 10n ** BigInt(places);
    const magnitude = (this.n < 0n ? -this.n : this.n) * scale;
    const rounded = (2n * magnitude + this.d) / (2n * this.d);
    return formatScaled(this.n < 0n ? -rounded : rounded, places, true);
  }
}

export function formatScaled(integer, places, fixed = false) {
  const negative = integer < 0;
  const digits = String(negative ? -integer : integer).padStart(places + 1, '0');
  if (!places) return (negative ? '-' : '') + digits;
  const fractional = fixed ? digits.slice(-places) : digits.slice(-places).replace(/0+$/, '');
  return (negative ? '-' : '') + digits.slice(0, -places) + (fractional ? '.' + fractional : '');
}

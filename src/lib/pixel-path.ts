// Skalar en SVG-path med bara vågräta och lodräta kanter (M, H, V, h, v, Z)
// och avrundar alla koordinater till ett pixelrutnät. Då hamnar varje kant
// exakt på en pixelgräns och webbläsaren behöver inte kantutjämna, så tunna
// linjer blir skarpa i stället för suddiga.
//
// scale: hur många CSS-pixlar en enhet i originalet blir
// grid:  rutnätets storlek i CSS-pixlar (1 = hela pixlar, 1/3 = 3x-skärmar)
export function snapPath(d: string, scale: number, grid = 1): string {
  const snap = (n: number) => {
    const v = Math.round((n * scale) / grid) * grid;
    return Number(v.toFixed(4)).toString();
  };
  const tokens = d.match(/[MHVZhvz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let out = '';
  let i = 0;
  const num = () => {
    const t = tokens[i++];
    if (t === undefined || /[A-Za-z]/.test(t)) throw new Error(`snapPath: väntade ett tal, fick ${t}`);
    return parseFloat(t);
  };
  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case 'M':
        x = startX = num();
        y = startY = num();
        out += `M${snap(x)} ${snap(y)}`;
        break;
      case 'H':
        x = num();
        out += `H${snap(x)}`;
        break;
      case 'h':
        x += num();
        out += `H${snap(x)}`;
        break;
      case 'V':
        y = num();
        out += `V${snap(y)}`;
        break;
      case 'v':
        y += num();
        out += `V${snap(y)}`;
        break;
      case 'Z':
      case 'z':
        x = startX;
        y = startY;
        out += 'Z';
        break;
      default:
        throw new Error(`snapPath: kommandot ${cmd} stöds inte (bara M, H, V, h, v, Z)`);
    }
  }
  return out;
}

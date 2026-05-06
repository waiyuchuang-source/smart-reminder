export interface ZTestResult {
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: "high" | "moderate" | "low";
}

function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export function proportionZTest(
  clicksA: number,
  viewsA: number,
  clicksB: number,
  viewsB: number,
): ZTestResult {
  if (viewsA === 0 || viewsB === 0) {
    return { zScore: 0, pValue: 1, significant: false, confidenceLevel: "low" };
  }

  const pA = clicksA / viewsA;
  const pB = clicksB / viewsB;
  const pPooled = (clicksA + clicksB) / (viewsA + viewsB);

  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / viewsA + 1 / viewsB));
  if (se === 0) {
    return { zScore: 0, pValue: 1, significant: false, confidenceLevel: "low" };
  }

  const zScore = (pA - pB) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  let confidenceLevel: ZTestResult["confidenceLevel"] = "low";
  if (pValue < 0.05) confidenceLevel = "high";
  else if (pValue < 0.1) confidenceLevel = "moderate";

  return { zScore, pValue, significant: pValue < 0.05, confidenceLevel };
}

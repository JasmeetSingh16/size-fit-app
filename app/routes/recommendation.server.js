/**
 * Size recommendation engine — v1 (rules-based).
 *
 * Kept as a pure function with a clean input/output contract so v2 can
 * swap this out for a trained model without touching any calling code.
 */

const FIT_ADJUSTMENT = {
  snug: -1,
  regular: 0,
  loose: 1,
};

function scoreSizeEntry(entry, customer) {
  let score = 0;
  let possible = 0;

  if (customer.heightCm && entry.heightMinCm != null && entry.heightMaxCm != null) {
    possible++;
    if (customer.heightCm >= entry.heightMinCm && customer.heightCm <= entry.heightMaxCm) {
      score += 1;
    } else {
      const dist = Math.min(
        Math.abs(customer.heightCm - entry.heightMinCm),
        Math.abs(customer.heightCm - entry.heightMaxCm)
      );
      if (dist <= 5) score += 0.5;
    }
  }

  if (customer.weightKg && entry.weightMinKg != null && entry.weightMaxKg != null) {
    possible++;
    if (customer.weightKg >= entry.weightMinKg && customer.weightKg <= entry.weightMaxKg) {
      score += 1;
    } else {
      const dist = Math.min(
        Math.abs(customer.weightKg - entry.weightMinKg),
        Math.abs(customer.weightKg - entry.weightMaxKg)
      );
      if (dist <= 3) score += 0.5;
    }
  }

  return { entry, score, possible };
}

export function recommendSize(sizeEntries, customer) {
  if (!sizeEntries || sizeEntries.length === 0) {
    return { recommendedSize: null, confidence: 0, reasoning: "No size chart configured" };
  }

  const scored = sizeEntries
    .map((entry) => scoreSizeEntry(entry, customer))
    .sort((a, b) => b.score - a.score);

  let best = scored[0];

  const shift = FIT_ADJUSTMENT[customer.fitPreference] ?? 0;
  if (shift !== 0) {
    const bestIndex = sizeEntries.findIndex((e) => e.id === best.entry.id);
    const shiftedIndex = Math.min(Math.max(bestIndex + shift, 0), sizeEntries.length - 1);
    best = { ...best, entry: sizeEntries[shiftedIndex] };
  }

  const maxPossibleScore = scored[0].possible || 1;
  const confidence = Math.min(scored[0].score / maxPossibleScore, 1);

  return {
    recommendedSize: best.entry.label,
    confidence: Number(confidence.toFixed(2)),
    reasoning:
      confidence >= 0.7
        ? "Strong match on height/weight"
        : confidence >= 0.4
        ? "Partial match — recommendation may be approximate"
        : "Limited data — low confidence recommendation",
  };
}
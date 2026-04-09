import { NormalizedOpportunity, ScoreResult, ScoringContext } from "./types.js";

const HIGH_THRESHOLD = 8;
const MED_THRESHOLD = 4;

export function scoreOpportunity(
  opp: NormalizedOpportunity,
  ctx: ScoringContext
): ScoreResult {
  let score = 0;
  const matchedTerms: string[] = [];
  const now = new Date();

  // keyword match +3 (weighted by keywordWeight)
  const titleDesc = `${opp.title} ${opp.description ?? ""}`.toLowerCase();
  const kwMatches = ctx.includeKeywords.filter((kw) =>
    titleDesc.includes(kw.toLowerCase())
  );
  const keywordMatch = kwMatches.length > 0;
  if (keywordMatch) {
    matchedTerms.push(...kwMatches);
    score += 3 * ctx.keywordWeight;
  }

  // trade match +2
  let matchedTrade: string | undefined;
  const tradeMatch =
    !!opp.tradeType &&
    ctx.tradeTypes.length > 0 &&
    ctx.tradeTypes.some((t) => {
      const matches = t.toLowerCase() === opp.tradeType!.toLowerCase();
      if (matches) matchedTrade = t;
      return matches;
    });
  if (tradeMatch) score += 2;

  // state/location match +2
  let locationMatch: string | undefined;
  if (opp.state && ctx.states.length > 0) {
    const stateMatch = ctx.states.some(
      (s) => s.toLowerCase() === opp.state!.toLowerCase()
    );
    if (stateMatch) {
      locationMatch = opp.state;
      score += 2;
    }
  }

  // budget above threshold +1 (weighted by budgetWeight)
  const budgetBonus =
    !!ctx.minBudget &&
    !!opp.budgetMin &&
    opp.budgetMin >= ctx.minBudget;
  if (budgetBonus) score += 1 * ctx.budgetWeight;

  // posted within 7 days +1 (weighted by recencyWeight)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recencyBonus = !!opp.postedAt && opp.postedAt >= sevenDaysAgo;
  if (recencyBonus) score += 1 * ctx.recencyWeight;

  // deadline within 14 days +1 (weighted by urgencyWeight)
  const fourteenDaysOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const urgencyBonus =
    !!opp.dueAt && opp.dueAt <= fourteenDaysOut && opp.dueAt >= now;
  if (urgencyBonus) score += 1 * ctx.urgencyWeight;

  const finalScore = Math.round(score * 100) / 100;

  const priorityLevel: "high" | "medium" | "low" =
    finalScore >= HIGH_THRESHOLD
      ? "high"
      : finalScore >= MED_THRESHOLD
      ? "medium"
      : "low";

  return {
    score: finalScore,
    priorityLevel,
    reasons: {
      keywordMatch,
      matchedTerms,
      tradeMatch,
      matchedTrade,
      locationMatch,
      recencyBonus,
      urgencyBonus,
      budgetBonus,
    },
  };
}

export function defaultScoringContext(): ScoringContext {
  return {
    includeKeywords: [
      "roofing",
      "roof",
      "hvac",
      "concrete",
      "painting",
      "paint",
      "construction",
      "maintenance",
      "renovation",
      "repair",
      "contractor",
      "bid",
      "rfp",
      "rfq",
    ],
    excludeKeywords: [],
    states: ["OH", "Ohio", "PA", "Pennsylvania", "IN", "Indiana", "KY", "Kentucky", "MI", "Michigan"],
    tradeTypes: ["roofing", "hvac", "concrete", "painting", "general contracting", "maintenance"],
    minBudget: 5000,
    urgencyWeight: 1,
    recencyWeight: 1,
    budgetWeight: 1,
    keywordWeight: 1,
  };
}

import type { NormalizedOpportunity } from "./types";
import type { OpportunityRule } from "@workspace/db";

export interface ScoringContext {
  rules: OpportunityRule[];
}

export interface ScoreResult {
  score: number;
  priorityLevel: "high" | "medium" | "low";
  scoreReasons: string[];
}

const HIGH_THRESHOLD = 8;
const MEDIUM_THRESHOLD = 4;

export function scoreOpportunity(
  opp: NormalizedOpportunity,
  ctx: ScoringContext
): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const rule = ctx.rules.find((r) => r.isActive === true);

  if (rule) {
    const keywords = (rule.keywords as string[]) ?? [];
    const tradeTypes = (rule.tradeTypes as string[]) ?? [];
    const targetStates = (rule.targetStates as string[]) ?? [];
    const minBudget = rule.minBudget ? Number(rule.minBudget) : undefined;

    const searchText = `${opp.title ?? ""} ${opp.description ?? ""}`.toLowerCase();

    const matchedKeyword = keywords.find((kw) =>
      searchText.includes(kw.toLowerCase())
    );
    if (matchedKeyword) {
      score += 3;
      reasons.push(`keyword_match:${matchedKeyword}`);
    }

    if (opp.tradeType && tradeTypes.includes(opp.tradeType)) {
      score += 2;
      reasons.push(`trade_match:${opp.tradeType}`);
    }

    if (opp.state && targetStates.includes(opp.state)) {
      score += 2;
      reasons.push(`state_match:${opp.state}`);
    }

    const budget = opp.budgetMax ?? opp.budgetMin;
    if (minBudget !== undefined && budget !== undefined && budget >= minBudget) {
      score += 1;
      reasons.push(`budget_above_threshold:${budget}`);
    }
  } else {
    const searchText = `${opp.title ?? ""} ${opp.description ?? ""}`.toLowerCase();
    const defaultKeywords = ["construction", "renovation", "repair", "roofing", "hvac", "concrete", "painting"];
    const matchedKeyword = defaultKeywords.find((kw) => searchText.includes(kw));
    if (matchedKeyword) {
      score += 3;
      reasons.push(`keyword_match:${matchedKeyword}`);
    }
  }

  const now = new Date();

  if (opp.postedAt) {
    const daysSincePosted = (now.getTime() - opp.postedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePosted <= 7) {
      score += 1;
      reasons.push("posted_within_7_days");
    }
  }

  if (opp.deadlineAt) {
    const daysUntilDeadline = (opp.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline >= 0 && daysUntilDeadline <= 14) {
      score += 1;
      reasons.push("deadline_within_14_days");
    }
  }

  let priorityLevel: "high" | "medium" | "low";
  if (score >= HIGH_THRESHOLD) {
    priorityLevel = "high";
  } else if (score >= MEDIUM_THRESHOLD) {
    priorityLevel = "medium";
  } else {
    priorityLevel = "low";
  }

  return { score, priorityLevel, scoreReasons: reasons };
}

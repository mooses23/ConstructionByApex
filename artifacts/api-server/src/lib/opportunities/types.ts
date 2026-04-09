export interface NormalizedOpportunity {
  title: string;
  description?: string;
  tradeType?: string;
  category?: string;
  city?: string;
  state?: string;
  budgetMin?: number;
  budgetMax?: number;
  postedAt?: Date;
  dueAt?: Date;
  sourceUrl?: string;
  externalId?: string;
  sourceName?: string;
  rawPayload?: unknown;
  ingestionType: "api" | "rss" | "email" | "manual" | "search";
}

export interface ScoringContext {
  includeKeywords: string[];
  excludeKeywords: string[];
  states: string[];
  tradeTypes: string[];
  minBudget?: number;
  urgencyWeight: number;
  recencyWeight: number;
  budgetWeight: number;
  keywordWeight: number;
}

export interface ScoreResult {
  score: number;
  priorityLevel: "high" | "medium" | "low";
  reasons: ScoreReasons;
}

export interface ScoreReasons {
  keywordMatch: boolean;
  matchedTerms: string[];
  tradeMatch: boolean;
  matchedTrade?: string;
  locationMatch?: string;
  recencyBonus: boolean;
  urgencyBonus: boolean;
  budgetBonus: boolean;
}

export interface SyncRunResult {
  itemsFetched: number;
  itemsInserted: number;
  itemsUpdated: number;
  error?: string;
}

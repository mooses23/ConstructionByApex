export interface NormalizedOpportunity {
  sourceId?: number;
  externalId?: string;
  title: string;
  description?: string;
  tradeType?: string;
  status?: string;
  budgetMin?: number;
  budgetMax?: number;
  state?: string;
  city?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sourceUrl?: string;
  postedAt?: Date;
  deadlineAt?: Date;
  rawPayloadJson: Record<string, unknown>;
  ingestMethod: string;
  notes?: string;
}

export interface OpportunityConnector {
  fetch(params: Record<string, unknown>): Promise<NormalizedOpportunity[]>;
}

export interface SyncRunResult {
  recordsFetched: number;
  recordsInserted: number;
  recordsSkipped: number;
  errorMessage?: string;
}

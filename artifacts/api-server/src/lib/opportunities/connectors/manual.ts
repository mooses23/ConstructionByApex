import type { NormalizedOpportunity } from "../types";
import { saveOpportunity, recordSyncRun } from "../core";

export interface ManualEntryPayload {
  title: string;
  description?: string;
  tradeType?: string;
  budgetMin?: number;
  budgetMax?: number;
  state?: string;
  city?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sourceUrl?: string;
  postedAt?: string;
  deadlineAt?: string;
  notes?: string;
  sourceId?: number;
}

export async function handleManualEntry(
  payload: ManualEntryPayload
): Promise<{ id: number; inserted: boolean }> {
  const opp: NormalizedOpportunity = {
    sourceId: payload.sourceId,
    title: payload.title,
    description: payload.description,
    tradeType: payload.tradeType,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    state: payload.state,
    city: payload.city,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    sourceUrl: payload.sourceUrl,
    postedAt: payload.postedAt ? new Date(payload.postedAt) : undefined,
    deadlineAt: payload.deadlineAt ? new Date(payload.deadlineAt) : undefined,
    notes: payload.notes,
    rawPayloadJson: payload as unknown as Record<string, unknown>,
    ingestMethod: "manual",
  };

  return saveOpportunity(opp);
}

export interface EmailPayload {
  from?: string;
  subject?: string;
  body?: string;
  attachments?: Array<{ filename: string; size?: number; mimeType?: string }>;
  urls?: string[];
  receivedAt?: string;
}

export function parseEmailPayload(email: EmailPayload): NormalizedOpportunity {
  const text = `${email.subject ?? ""} ${email.body ?? ""}`;

  const dateMatches = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g) ?? [];
  let deadlineAt: Date | undefined;
  if (dateMatches.length > 0) {
    const parsed = new Date(dateMatches[dateMatches.length - 1]);
    if (!isNaN(parsed.getTime())) {
      deadlineAt = parsed;
    }
  }

  const budgetMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) ?? [];
  let budgetMax: number | undefined;
  if (budgetMatches.length > 0) {
    const amounts = budgetMatches.map((m) => parseFloat(m.replace(/[^0-9.]/g, ""))).filter((n) => !isNaN(n));
    if (amounts.length > 0) {
      budgetMax = Math.max(...amounts);
    }
  }

  const stateMatches = text.match(/\b(OH|PA|IN|KY|MI|IL|WI|MN|IA|MO|WV|VA|NC|TN)\b/);
  const state = stateMatches ? stateMatches[1] : undefined;

  const sourceUrl = email.urls?.[0];

  return {
    title: email.subject ?? "Email Opportunity",
    description: email.body?.slice(0, 2000),
    contactName: email.from,
    state,
    sourceUrl,
    deadlineAt,
    budgetMax,
    postedAt: email.receivedAt ? new Date(email.receivedAt) : new Date(),
    rawPayloadJson: {
      from: email.from,
      subject: email.subject,
      bodyPreview: email.body?.slice(0, 500),
      attachments: email.attachments,
      urls: email.urls,
      receivedAt: email.receivedAt,
    },
    ingestMethod: "email",
    status: "new",
  };
}

export async function ingestEmail(
  email: EmailPayload,
  sourceId?: number
): Promise<{ id: number; inserted: boolean }> {
  const normalized = parseEmailPayload(email);
  normalized.sourceId = sourceId;

  const result = await saveOpportunity(normalized);

  await recordSyncRun(sourceId ?? null, {
    recordsFetched: 1,
    recordsInserted: result.inserted ? 1 : 0,
    recordsSkipped: result.inserted ? 0 : 1,
  });

  return result;
}

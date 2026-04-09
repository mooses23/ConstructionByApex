/**
 * Email ingestion interface — stub implementation.
 *
 * This module accepts inbound email payloads from any provider
 * (SendGrid, Postmark, Mailgun, etc.) via the POST /api/opportunities/email-ingest
 * endpoint. The provider-specific webhook handler is NOT wired here — leave
 * that as a clearly labelled integration point for the next iteration.
 *
 * Flow:
 *   provider webhook → parseEmailPayload() → saveOpportunity() → review queue
 *
 * Records are stored with status='new' and ingestionType='email'.
 * They are NEVER auto-converted to leads.
 */

import { NormalizedOpportunity } from "../types.js";
import { saveOpportunity } from "../core.js";

export interface InboundEmailPayload {
  from?: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  /** Extracted URLs from the email body */
  links?: string[];
  /** Attachment filenames (not content) */
  attachmentNames?: string[];
  /** Raw provider-specific payload for archival */
  rawProviderPayload?: unknown;
  receivedAt?: string;
}

export function parseEmailPayload(
  payload: InboundEmailPayload,
  sourceName: string
): NormalizedOpportunity {
  const title =
    payload.subject?.trim() ||
    `Email from ${payload.from ?? "unknown sender"}`;

  // Build description from text body, truncating to a reasonable length
  const body = payload.textBody ?? stripHtml(payload.htmlBody ?? "");
  const description = body.slice(0, 2000) || undefined;

  // Best-effort link extraction: use the first link as a sourceUrl
  const sourceUrl = payload.links?.[0];

  // Best-effort date parsing
  const postedAt = payload.receivedAt ? new Date(payload.receivedAt) : new Date();

  return {
    title,
    description,
    sourceUrl,
    sourceName,
    ingestionType: "email",
    externalId: `email-${payload.from ?? "unknown"}-${Date.now()}`,
    postedAt,
    rawPayload: {
      from: payload.from,
      subject: payload.subject,
      links: payload.links,
      attachmentNames: payload.attachmentNames,
      rawProviderPayload: payload.rawProviderPayload,
    },
  };
}

export async function ingestEmail(
  sourceId: string | undefined,
  payload: InboundEmailPayload,
  sourceName: string
): Promise<{ inserted: boolean; updated: boolean }> {
  const normalized = parseEmailPayload(payload, sourceName);
  return saveOpportunity(sourceId, normalized);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── PROVIDER WEBHOOK STUB ────────────────────────────────────────────────────
// TODO: Wire a specific provider's webhook format here.
// Example (Postmark):
//   router.post('/email-ingest/postmark', async (req, res) => {
//     const payload: InboundEmailPayload = {
//       from: req.body.From,
//       subject: req.body.Subject,
//       textBody: req.body.TextBody,
//       links: (req.body.Attachments ?? []).map((a: any) => a.ContentID),
//       rawProviderPayload: req.body,
//     };
//     await ingestEmail(sourceId, payload, 'Postmark Inbound');
//     res.sendStatus(200);
//   });

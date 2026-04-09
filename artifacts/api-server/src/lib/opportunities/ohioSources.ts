import { db, opportunitySourcesTable } from "@workspace/db";
import { eq, or, sql } from "drizzle-orm";
import { logger } from "../logger";

export interface OhioSourcePreset {
  key: string;
  name: string;
  type: string;
  base_url: string;
  geography: string;
  source_kind: "api" | "portal" | "search";
  recommended_ingestion_method: string;
  default_enabled: boolean;
  search_tags: string[];
}

export const OHIO_SOURCE_PRESETS: OhioSourcePreset[] = [
  {
    key: "ohiobuys",
    name: "OhioBuys (Ohio Procurement)",
    type: "manual",
    base_url: "https://ohiobuys.ohio.gov",
    geography: "Ohio (Statewide)",
    source_kind: "portal",
    recommended_ingestion_method: "Manual review — portal requires login",
    default_enabled: false,
    search_tags: ["ohio", "state", "procurement", "government"],
  },
  {
    key: "bidnet_ohio",
    name: "BidNet Direct — Ohio",
    type: "manual",
    base_url: "https://www.bidnetdirect.com/ohio",
    geography: "Ohio (Statewide)",
    source_kind: "portal",
    recommended_ingestion_method: "Manual review — requires account",
    default_enabled: false,
    search_tags: ["ohio", "bidnet", "municipal", "county"],
  },
  {
    key: "samgov_ohio",
    name: "SAM.gov — Ohio Construction",
    type: "samgov",
    base_url: "https://sam.gov",
    geography: "Ohio (Federal opportunities)",
    source_kind: "api",
    recommended_ingestion_method: "API sync — automated via SAM.gov connector",
    default_enabled: true,
    search_tags: ["ohio", "federal", "sam.gov", "construction"],
  },
  {
    key: "ofcc_ohio",
    name: "OFCC (Ohio Facilities Construction Commission)",
    type: "manual",
    base_url: "https://ofcc.ohio.gov",
    geography: "Ohio (State facilities)",
    source_kind: "portal",
    recommended_ingestion_method: "Manual review — check project listings periodically",
    default_enabled: false,
    search_tags: ["ohio", "ofcc", "state", "facilities", "construction"],
  },
  {
    key: "ohio_local_entities",
    name: "Ohio Local Public Entities",
    type: "google_pse",
    base_url: "https://www.google.com",
    geography: "Ohio (Cities, Counties, Townships)",
    source_kind: "search",
    recommended_ingestion_method: "Google PSE search — automated via discovery runs",
    default_enabled: true,
    search_tags: ["ohio", "local", "municipal", "county", "township"],
  },
];

export async function seedOhioSources(): Promise<void> {
  for (const preset of OHIO_SOURCE_PRESETS) {
    const existing = await db
      .select({ id: opportunitySourcesTable.id })
      .from(opportunitySourcesTable)
      .where(
        or(
          eq(opportunitySourcesTable.name, preset.name),
          sql`${opportunitySourcesTable.config}->>'key' = ${preset.key}`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const configPayload = {
      key: preset.key,
      base_url: preset.base_url,
      geography: preset.geography,
      source_kind: preset.source_kind,
      recommended_ingestion_method: preset.recommended_ingestion_method,
      search_tags: preset.search_tags,
    };

    await db.insert(opportunitySourcesTable).values({
      name: preset.name,
      sourceType: preset.type,
      config: configPayload,
      isActive: preset.default_enabled,
    });

    logger.info({ key: preset.key, name: preset.name }, "Seeded Ohio source preset");
  }
}

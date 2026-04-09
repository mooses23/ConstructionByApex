import { QUERY_LIBRARY, getQueriesByCategory, type QueryCategory, type QueryEntry } from "./queryLibrary";

export const OHIO_CITIES = [
  "Columbus",
  "Cleveland",
  "Cincinnati",
  "Toledo",
  "Akron",
  "Dayton",
  "Canton",
  "Youngstown",
  "Parma",
  "Lorain",
  "Springfield",
  "Mansfield",
  "Newark",
  "Lima",
  "Dublin",
] as const;

export const OHIO_COUNTIES = [
  "Hamilton County",
  "Franklin County",
  "Cuyahoga County",
  "Summit County",
  "Montgomery County",
  "Lucas County",
] as const;

export type OhioCity = typeof OHIO_CITIES[number];
export type OhioCounty = typeof OHIO_COUNTIES[number];

export const QUERY_SUFFIXES = [
  "site:.gov",
  "filetype:pdf",
  "bid OR RFP OR RFQ",
] as const;

export interface PresetGroup {
  key: string;
  label: string;
  description: string;
  categories: QueryCategory[];
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    key: "ohio_public_bids",
    label: "Ohio Public Bids",
    description: "Government and public agency construction bids across Ohio",
    categories: ["government_bids"],
  },
  {
    key: "ohio_school_facility",
    label: "Ohio School & Facility Work",
    description: "School district and educational facility construction projects",
    categories: ["school_facility"],
  },
  {
    key: "ohio_commercial_renovation",
    label: "Ohio Commercial Renovation",
    description: "Commercial building renovations, retail buildouts, and tenant improvements",
    categories: ["commercial_renovation"],
  },
  {
    key: "ohio_subcontractor",
    label: "Ohio Subcontractor Requests",
    description: "General contractors seeking subcontractors for Ohio projects",
    categories: ["subcontractor_work"],
  },
  {
    key: "ohio_maintenance_service",
    label: "Ohio Maintenance & Service Contracts",
    description: "Building maintenance, HVAC service, and facility management contracts",
    categories: ["maintenance_service"],
  },
  {
    key: "ohio_roofing_paving",
    label: "Ohio Roofing, Paving & Trades",
    description: "Roofing, paving, siding, and specialty trade projects",
    categories: ["roofing_paving_trades"],
  },
];

export interface GeneratedQuery {
  text: string;
  baseQuery: string;
  locality?: string;
  suffix?: string;
}

export function generateQueries(
  categories: QueryCategory[],
  options?: {
    cities?: readonly string[];
    counties?: readonly string[];
    suffixes?: readonly string[];
    maxQueries?: number;
  }
): GeneratedQuery[] {
  const {
    cities = [],
    counties = [],
    suffixes = [],
    maxQueries = 30,
  } = options ?? {};

  const baseQueries: QueryEntry[] = categories.flatMap(getQueriesByCategory);
  const results: GeneratedQuery[] = [];

  const localities = [...cities, ...counties];

  for (const entry of baseQueries) {
    if (results.length >= maxQueries) break;

    if (localities.length === 0 && suffixes.length === 0) {
      results.push({ text: entry.query, baseQuery: entry.query });
      continue;
    }

    if (localities.length > 0) {
      const locality = localities[results.length % localities.length];
      const suffix = suffixes.length > 0 ? suffixes[results.length % suffixes.length] : undefined;
      const text = suffix
        ? `${entry.query} ${locality} ${suffix}`
        : `${entry.query} ${locality}`;
      results.push({ text, baseQuery: entry.query, locality, suffix });
    } else if (suffixes.length > 0) {
      const suffix = suffixes[results.length % suffixes.length];
      results.push({ text: `${entry.query} ${suffix}`, baseQuery: entry.query, suffix });
    }
  }

  return results.slice(0, maxQueries);
}

export function generatePresetQueries(presetKey: string): GeneratedQuery[] {
  const preset = PRESET_GROUPS.find((p) => p.key === presetKey);
  if (!preset) return [];

  return generateQueries(preset.categories, {
    cities: OHIO_CITIES.slice(0, 5),
    counties: OHIO_COUNTIES.slice(0, 3),
    suffixes: QUERY_SUFFIXES,
    maxQueries: 20,
  });
}

export function getDiscoveryPresetsResponse() {
  const categories = Object.fromEntries(
    (Object.keys(QUERY_LIBRARY.reduce((acc, q) => ({ ...acc, [q.category]: true }), {} as Record<string, boolean>)) as QueryCategory[]).map(
      (cat) => [cat, getQueriesByCategory(cat).map((q) => q.query)]
    )
  );

  return {
    categories,
    presetGroups: PRESET_GROUPS.map((p) => ({
      key: p.key,
      label: p.label,
      description: p.description,
      categories: p.categories,
    })),
    localities: {
      cities: [...OHIO_CITIES],
      counties: [...OHIO_COUNTIES],
    },
  };
}

import { db, opportunitiesTable, opportunitySourcesTable, opportunityRulesTable } from "@workspace/db";

const now = new Date();

function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

interface ScoringRule {
  keywords: string[];
  tradeTypes: string[];
  targetStates: string[];
  minBudget?: number;
}

function computeScore(opp: {
  title: string;
  description?: string;
  tradeType?: string;
  state?: string;
  budgetMax?: number;
  budgetMin?: number;
  postedAt?: Date;
  deadlineAt?: Date;
}, rule: ScoringRule): { score: number; priorityLevel: "high" | "medium" | "low"; scoreReasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const text = `${opp.title} ${opp.description ?? ""}`.toLowerCase();
  const matchedKeyword = rule.keywords.find((kw) => text.includes(kw.toLowerCase()));
  if (matchedKeyword) { score += 3; reasons.push(`keyword_match:${matchedKeyword}`); }

  if (opp.tradeType && rule.tradeTypes.includes(opp.tradeType)) { score += 2; reasons.push(`trade_match:${opp.tradeType}`); }

  if (opp.state && rule.targetStates.includes(opp.state)) { score += 2; reasons.push(`state_match:${opp.state}`); }

  const budget = opp.budgetMax ?? opp.budgetMin;
  if (rule.minBudget !== undefined && budget !== undefined && budget >= rule.minBudget) { score += 1; reasons.push(`budget_above_threshold:${budget}`); }

  if (opp.postedAt) {
    const daysSince = (now.getTime() - opp.postedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) { score += 1; reasons.push("posted_within_7_days"); }
  }

  if (opp.deadlineAt) {
    const daysUntil = (opp.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 14) { score += 1; reasons.push("deadline_within_14_days"); }
  }

  const priorityLevel: "high" | "medium" | "low" = score >= 8 ? "high" : score >= 4 ? "medium" : "low";
  return { score, priorityLevel, scoreReasons: reasons };
}

async function main() {
  console.log("Seeding opportunity sources...");

  const [samGovSource] = await db
    .insert(opportunitySourcesTable)
    .values({
      name: "SAM.gov Federal Opportunities",
      sourceType: "samgov",
      config: { keyword: "construction roofing HVAC", state: "OH", limit: 50 },
      isActive: true,
    })
    .returning();

  const [rssSource] = await db
    .insert(opportunitySourcesTable)
    .values({
      name: "Ohio State Procurement RSS",
      sourceType: "rss",
      config: { feedUrl: "https://procure.ohio.gov/rss/opportunities.rss", state: "OH" },
      isActive: true,
    })
    .returning();

  console.log("Seeding scoring rule...");

  const [rule] = await db
    .insert(opportunityRulesTable)
    .values({
      name: "Default Midwest Construction Rule",
      isActive: true,
      keywords: ["roofing", "hvac", "concrete", "painting", "construction", "renovation", "repair", "contractor", "bid", "rfp"],
      tradeTypes: ["roofing", "hvac", "concrete", "painting", "general"],
      targetStates: ["OH", "PA", "IN", "KY", "MI"],
      minBudget: "25000",
    })
    .returning();

  const scoringRule: ScoringRule = {
    keywords: (rule.keywords as string[]) ?? [],
    tradeTypes: (rule.tradeTypes as string[]) ?? [],
    targetStates: (rule.targetStates as string[]) ?? [],
    minBudget: rule.minBudget ? Number(rule.minBudget) : undefined,
  };

  console.log("Seeding 20 opportunities...");

  const opportunities = [
    {
      title: "City Hall Roof Replacement – Columbus, OH",
      description: "Complete tear-off and replacement of flat roof on historic city hall building. Approx 8,500 sq ft. Must meet historical preservation guidelines.",
      tradeType: "roofing",
      state: "OH",
      city: "Columbus",
      budgetMin: 120000,
      budgetMax: 180000,
      contactName: "Julie Hartman",
      contactEmail: "jhartman@columbus.gov",
      postedAt: daysAgo(3),
      deadlineAt: daysFromNow(10),
      sourceUrl: "https://bids.columbus.gov/opp/1001",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-ROF-001",
    },
    {
      title: "HVAC System Overhaul – Cincinnati School District",
      description: "Replace aging HVAC systems across 6 elementary schools. Project includes ductwork, chillers, and smart thermostats. Multi-phase, 18-month timeline.",
      tradeType: "hvac",
      state: "OH",
      city: "Cincinnati",
      budgetMin: 380000,
      budgetMax: 500000,
      contactName: "Tom Ridley",
      contactEmail: "tridley@cincy-schools.org",
      postedAt: daysAgo(1),
      deadlineAt: daysFromNow(21),
      sourceUrl: "https://bids.cincinnati.gov/opp/1002",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-HVAC-002",
    },
    {
      title: "Concrete Parking Lot Resurfacing – Dayton Airport",
      description: "Resurfacing of 40,000 sq ft of cracked concrete in employee parking areas. Requires lane-by-lane phasing to maintain 60% operational capacity.",
      tradeType: "concrete",
      state: "OH",
      city: "Dayton",
      budgetMin: 95000,
      budgetMax: 140000,
      contactName: "Sarah Vo",
      contactEmail: "svo@dayton-airport.org",
      postedAt: daysAgo(5),
      deadlineAt: daysFromNow(12),
      sourceUrl: "https://procurement.dayton.gov/opp/1003",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-CON-003",
    },
    {
      title: "Interior Painting – Pittsburgh Federal Building",
      description: "Full interior repaint of 4-story federal office building. Approx 60,000 sq ft. Low-VOC paint required. Work must occur outside business hours.",
      tradeType: "painting",
      state: "PA",
      city: "Pittsburgh",
      budgetMin: 45000,
      budgetMax: 70000,
      contactName: "Mark Hess",
      contactEmail: "mhess@gsa.gov",
      postedAt: daysAgo(2),
      deadlineAt: daysFromNow(7),
      sourceUrl: "https://sam.gov/opp/1004",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-PAI-004",
    },
    {
      title: "General Contractor – Indianapolis Convention Center Expansion",
      description: "Phase 2 expansion of the convention center. GC sought for 220,000 sq ft addition including structural steel, MEP, and finish work.",
      tradeType: "general",
      state: "IN",
      city: "Indianapolis",
      budgetMin: 2500000,
      budgetMax: 3800000,
      contactName: "Diane Carlson",
      contactEmail: "dcarlson@icc.in.gov",
      postedAt: daysAgo(7),
      deadlineAt: daysFromNow(30),
      sourceUrl: "https://procurement.in.gov/opp/1005",
      ingestMethod: "manual",
      externalId: "MAN-2026-GEN-005",
    },
    {
      title: "Metal Roofing – Lexington Agricultural Facility",
      description: "New metal roofing installation on 3 large agricultural storage buildings totaling 18,000 sq ft. Steel panel roofing preferred.",
      tradeType: "roofing",
      state: "KY",
      city: "Lexington",
      budgetMin: 55000,
      budgetMax: 85000,
      contactName: "Bob Fields",
      contactEmail: "bfields@ky-ag.gov",
      postedAt: daysAgo(4),
      deadlineAt: daysFromNow(14),
      sourceUrl: "https://bids.ky.gov/opp/1006",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-ROF-006",
    },
    {
      title: "HVAC Controls Upgrade – Detroit Public Library",
      description: "Replace pneumatic HVAC controls with BAS/BMS digital controls across 12 branches. Must be phased to maintain library operations.",
      tradeType: "hvac",
      state: "MI",
      city: "Detroit",
      budgetMin: 180000,
      budgetMax: 250000,
      contactName: "Angela Reeves",
      contactEmail: "areeves@detroitlibrary.org",
      postedAt: daysAgo(6),
      deadlineAt: daysFromNow(18),
      sourceUrl: "https://bids.detroit.gov/opp/1007",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-HVAC-007",
    },
    {
      title: "Concrete Sidewalk Repair – Cleveland Metro Parks",
      description: "Repair and replacement of damaged concrete sidewalks and pathways across 8 park locations. Approx 12,500 linear feet.",
      tradeType: "concrete",
      state: "OH",
      city: "Cleveland",
      budgetMin: 38000,
      budgetMax: 58000,
      contactName: "Mike Torres",
      contactEmail: "mtorres@clevelandmetroparks.com",
      postedAt: daysAgo(8),
      deadlineAt: daysFromNow(3),
      sourceUrl: "https://bids.clemetroparks.com/opp/1008",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-CON-008",
    },
    {
      title: "Exterior Painting – Akron Municipal Complex",
      description: "Exterior painting of 3 connected municipal buildings including surface prep, priming, and 2-coat finish. Approx 22,000 sq ft exterior surface.",
      tradeType: "painting",
      state: "OH",
      city: "Akron",
      budgetMin: 28000,
      budgetMax: 42000,
      contactName: "Linda Chen",
      contactEmail: "lchen@akron.gov",
      postedAt: daysAgo(9),
      deadlineAt: daysFromNow(5),
      sourceUrl: "https://bids.akron.gov/opp/1009",
      ingestMethod: "manual",
      externalId: "MAN-2026-PAI-009",
    },
    {
      title: "Roofing & Gutter Work – Youngstown Schools",
      description: "Roof repairs and full gutter replacement at 4 Youngstown City Schools. Includes storm damage remediation from last season.",
      tradeType: "roofing",
      state: "OH",
      city: "Youngstown",
      budgetMin: 72000,
      budgetMax: 98000,
      contactName: "Paul Vasquez",
      contactEmail: "pvasquez@youngstown-schools.org",
      postedAt: daysAgo(10),
      deadlineAt: daysFromNow(20),
      sourceUrl: "https://bids.youngstown.gov/opp/1010",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-ROF-010",
    },
    {
      title: "GC Bid – Erie County Jail Renovation",
      description: "Renovation of existing county jail including cell block refurbishment, HVAC replacement, and security system integration. Certified contractors only.",
      tradeType: "general",
      state: "PA",
      city: "Erie",
      budgetMin: 1200000,
      budgetMax: 1800000,
      contactName: "Carol Watkins",
      contactEmail: "cwatkins@erie-county.gov",
      postedAt: daysAgo(3),
      deadlineAt: daysFromNow(45),
      sourceUrl: "https://bids.erie-county.gov/opp/1011",
      ingestMethod: "email",
      externalId: "EML-2026-GEN-011",
    },
    {
      title: "Flat Roof Installation – Fort Wayne Warehouse",
      description: "New TPO flat roof installation on 25,000 sq ft commercial warehouse. Includes insulation upgrade and new drainage layout.",
      tradeType: "roofing",
      state: "IN",
      city: "Fort Wayne",
      budgetMin: 88000,
      budgetMax: 115000,
      contactName: "Steve Hartmann",
      contactEmail: "shartmann@fwwarehousing.com",
      postedAt: daysAgo(1),
      deadlineAt: daysFromNow(9),
      sourceUrl: "https://procurement.in.gov/opp/1012",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-ROF-012",
    },
    {
      title: "HVAC Replacement – Grand Rapids Office Tower",
      description: "Full HVAC replacement in 14-story office tower, approximately 185,000 sq ft. Includes new rooftop units and all distribution.",
      tradeType: "hvac",
      state: "MI",
      city: "Grand Rapids",
      budgetMin: 420000,
      budgetMax: 580000,
      contactName: "Jen Morris",
      contactEmail: "jmorris@groffice.com",
      postedAt: daysAgo(2),
      deadlineAt: daysFromNow(28),
      sourceUrl: "https://bids.michigan.gov/opp/1013",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-HVAC-013",
    },
    {
      title: "Concrete Foundation Repair – Toledo Bridge",
      description: "Structural concrete repair of bridge foundation and abutments. Core drilling, epoxy injection, and carbon fiber reinforcement required.",
      tradeType: "concrete",
      state: "OH",
      city: "Toledo",
      budgetMin: 200000,
      budgetMax: 320000,
      contactName: "Ray Nguyen",
      contactEmail: "rnguyen@toledo-odot.gov",
      postedAt: daysAgo(4),
      deadlineAt: daysFromNow(60),
      sourceUrl: "https://bids.odot.gov/opp/1014",
      ingestMethod: "manual",
      externalId: "MAN-2026-CON-014",
    },
    {
      title: "Line Striping & Lot Painting – Louisville Airport",
      description: "Parking lot line striping, handicap symbol painting, and directional arrows across 6 surface lots. Approx 180,000 sq ft total.",
      tradeType: "painting",
      state: "KY",
      city: "Louisville",
      budgetMin: 12000,
      budgetMax: 22000,
      contactName: "Denise Baker",
      contactEmail: "dbaker@sdfairport.com",
      postedAt: daysAgo(11),
      deadlineAt: daysFromNow(8),
      sourceUrl: "https://bids.louisville.gov/opp/1015",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-PAI-015",
    },
    {
      title: "Medical Center Expansion – Ann Arbor GC",
      description: "Addition of 3-story patient wing to existing hospital campus. GC role includes coordinating MEP subs, structural, and fit-out.",
      tradeType: "general",
      state: "MI",
      city: "Ann Arbor",
      budgetMin: 4500000,
      budgetMax: 6000000,
      contactName: "Dr. Pamela Cross",
      contactEmail: "pcross@umhealth.org",
      postedAt: daysAgo(6),
      deadlineAt: daysFromNow(50),
      sourceUrl: "https://bids.michigan.gov/opp/1016",
      ingestMethod: "manual",
      externalId: "MAN-2026-GEN-016",
    },
    {
      title: "Storm Drain Concrete Work – South Bend Streets",
      description: "Replacement of 3,200 linear feet of deteriorated concrete storm drain channels. Includes excavation, formwork, pour, and backfill.",
      tradeType: "concrete",
      state: "IN",
      city: "South Bend",
      budgetMin: 65000,
      budgetMax: 92000,
      contactName: "Marcus Hill",
      contactEmail: "mhill@southbend.gov",
      postedAt: daysAgo(2),
      deadlineAt: daysFromNow(15),
      sourceUrl: "https://bids.southbend.gov/opp/1017",
      ingestMethod: "samgov",
      sourceId: samGovSource.id,
      externalId: "SAM-2026-CON-017",
    },
    {
      title: "Roof Maintenance Contract – Allentown Portfolio",
      description: "Annual maintenance contract for flat roofs across 14 commercial properties in Allentown PA metro. Includes inspections, minor repairs, and emergency response.",
      tradeType: "roofing",
      state: "PA",
      city: "Allentown",
      budgetMin: 42000,
      budgetMax: 65000,
      contactName: "George Park",
      contactEmail: "gpark@allentownrealty.com",
      postedAt: daysAgo(5),
      deadlineAt: daysFromNow(25),
      sourceUrl: "https://bids.pa.gov/opp/1018",
      ingestMethod: "email",
      externalId: "EML-2026-ROF-018",
    },
    {
      title: "HVAC Duct Cleaning – Columbus School System",
      description: "Professional duct cleaning and sanitizing services for 22 Columbus City School buildings. Air quality testing before and after required.",
      tradeType: "hvac",
      state: "OH",
      city: "Columbus",
      budgetMin: 35000,
      budgetMax: 55000,
      contactName: "Alice Monroe",
      contactEmail: "amonroe@columbus-city-schools.org",
      postedAt: daysAgo(0),
      deadlineAt: daysFromNow(11),
      sourceUrl: "https://bids.columbus.gov/opp/1019",
      ingestMethod: "rss",
      sourceId: rssSource.id,
      externalId: "RSS-2026-HVAC-019",
    },
    {
      title: "General Contracting – Covington Mixed-Use Development",
      description: "New construction of 5-story mixed use building with retail ground floor and 60 residential units above. Steel frame with masonry facade.",
      tradeType: "general",
      state: "KY",
      city: "Covington",
      budgetMin: 8000000,
      budgetMax: 12000000,
      contactName: "Frank Lowery",
      contactEmail: "flowery@covington-dev.com",
      postedAt: daysAgo(7),
      deadlineAt: daysFromNow(35),
      sourceUrl: "https://bids.covington.ky.gov/opp/1020",
      ingestMethod: "manual",
      externalId: "MAN-2026-GEN-020",
    },
  ];

  let insertedCount = 0;
  for (const opp of opportunities) {
    const { score, priorityLevel, scoreReasons } = computeScore(opp, scoringRule);

    await db.insert(opportunitiesTable).values({
      sourceId: opp.sourceId,
      externalId: opp.externalId,
      title: opp.title,
      description: opp.description,
      tradeType: opp.tradeType,
      state: opp.state,
      city: opp.city,
      budgetMin: opp.budgetMin?.toString(),
      budgetMax: opp.budgetMax?.toString(),
      contactName: opp.contactName,
      contactEmail: opp.contactEmail,
      postedAt: opp.postedAt,
      deadlineAt: opp.deadlineAt,
      sourceUrl: opp.sourceUrl,
      rawPayloadJson: { title: opp.title, description: opp.description },
      ingestMethod: opp.ingestMethod,
      score,
      priorityLevel,
      scoreReasonsJson: scoreReasons,
      status: "new",
    });

    insertedCount++;
  }

  console.log(`Seeded ${insertedCount} opportunities, 2 sources, 1 rule`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

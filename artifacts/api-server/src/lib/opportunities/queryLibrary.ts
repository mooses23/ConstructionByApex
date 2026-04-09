export interface QueryEntry {
  query: string;
  category: QueryCategory;
  tags?: string[];
}

export type QueryCategory =
  | "government_bids"
  | "school_facility"
  | "property_management"
  | "subcontractor_work"
  | "commercial_renovation"
  | "emergency_facility"
  | "roofing_paving_trades"
  | "maintenance_service";

export const QUERY_CATEGORY_LABELS: Record<QueryCategory, string> = {
  government_bids: "Government Bids",
  school_facility: "School & Facility Work",
  property_management: "Property Management",
  subcontractor_work: "Subcontractor Work",
  commercial_renovation: "Commercial Renovation",
  emergency_facility: "Emergency & Facility Work",
  roofing_paving_trades: "Roofing, Paving & Trades",
  maintenance_service: "Maintenance & Service Contracts",
};

export const QUERY_LIBRARY: QueryEntry[] = [
  { query: "Ohio public bid construction project", category: "government_bids", tags: ["government", "bid"] },
  { query: "Ohio government RFP construction", category: "government_bids", tags: ["government", "rfp"] },
  { query: "Ohio state building renovation bid", category: "government_bids", tags: ["government", "renovation"] },
  { query: "Ohio county infrastructure bid", category: "government_bids", tags: ["government", "infrastructure"] },
  { query: "Ohio municipality construction contract", category: "government_bids", tags: ["government", "municipal"] },
  { query: "Ohio public works bid invitation", category: "government_bids", tags: ["government", "public-works"] },
  { query: "Ohio state agency facility improvement RFQ", category: "government_bids", tags: ["government", "rfq"] },
  { query: "ODOT construction contract bid Ohio", category: "government_bids", tags: ["government", "odot"] },
  { query: "Ohio government building maintenance contract", category: "government_bids", tags: ["government", "maintenance"] },

  { query: "Ohio school district construction bid", category: "school_facility", tags: ["education", "bid"] },
  { query: "Ohio school renovation project RFP", category: "school_facility", tags: ["education", "renovation"] },
  { query: "Ohio university campus construction", category: "school_facility", tags: ["education", "university"] },
  { query: "Ohio school HVAC upgrade bid", category: "school_facility", tags: ["education", "hvac"] },
  { query: "Ohio school roof replacement project", category: "school_facility", tags: ["education", "roofing"] },
  { query: "Ohio K-12 facility improvement bid", category: "school_facility", tags: ["education", "facility"] },
  { query: "Ohio community college construction bid", category: "school_facility", tags: ["education", "community-college"] },
  { query: "Ohio school athletic facility construction", category: "school_facility", tags: ["education", "athletic"] },
  { query: "Ohio school ADA compliance renovation", category: "school_facility", tags: ["education", "ada"] },

  { query: "Ohio property management renovation bid", category: "property_management", tags: ["property", "renovation"] },
  { query: "Ohio apartment complex repair contractor", category: "property_management", tags: ["property", "apartment"] },
  { query: "Ohio HOA exterior maintenance bid", category: "property_management", tags: ["property", "hoa"] },
  { query: "Ohio commercial property renovation RFP", category: "property_management", tags: ["property", "commercial"] },
  { query: "Ohio multi-family housing rehab project", category: "property_management", tags: ["property", "housing"] },
  { query: "Ohio condominium repair contractor needed", category: "property_management", tags: ["property", "condo"] },
  { query: "Ohio rental property maintenance contract", category: "property_management", tags: ["property", "rental"] },
  { query: "Ohio building exterior restoration bid", category: "property_management", tags: ["property", "exterior"] },

  { query: "Ohio subcontractor needed construction", category: "subcontractor_work", tags: ["subcontractor"] },
  { query: "Ohio general contractor seeking subs", category: "subcontractor_work", tags: ["subcontractor", "general"] },
  { query: "Ohio drywall subcontractor bid", category: "subcontractor_work", tags: ["subcontractor", "drywall"] },
  { query: "Ohio electrical subcontractor needed", category: "subcontractor_work", tags: ["subcontractor", "electrical"] },
  { query: "Ohio plumbing subcontractor bid request", category: "subcontractor_work", tags: ["subcontractor", "plumbing"] },
  { query: "Ohio framing subcontractor commercial", category: "subcontractor_work", tags: ["subcontractor", "framing"] },
  { query: "Ohio painting subcontractor request", category: "subcontractor_work", tags: ["subcontractor", "painting"] },
  { query: "Ohio concrete subcontractor bid invitation", category: "subcontractor_work", tags: ["subcontractor", "concrete"] },
  { query: "Ohio masonry subcontractor needed", category: "subcontractor_work", tags: ["subcontractor", "masonry"] },

  { query: "Ohio commercial building renovation bid", category: "commercial_renovation", tags: ["commercial", "renovation"] },
  { query: "Ohio retail space buildout contractor", category: "commercial_renovation", tags: ["commercial", "retail"] },
  { query: "Ohio office renovation construction RFP", category: "commercial_renovation", tags: ["commercial", "office"] },
  { query: "Ohio restaurant construction bid", category: "commercial_renovation", tags: ["commercial", "restaurant"] },
  { query: "Ohio warehouse renovation project", category: "commercial_renovation", tags: ["commercial", "warehouse"] },
  { query: "Ohio tenant improvement construction", category: "commercial_renovation", tags: ["commercial", "tenant"] },
  { query: "Ohio strip mall renovation contractor", category: "commercial_renovation", tags: ["commercial", "strip-mall"] },
  { query: "Ohio medical office buildout bid", category: "commercial_renovation", tags: ["commercial", "medical"] },
  { query: "Ohio hotel renovation construction project", category: "commercial_renovation", tags: ["commercial", "hotel"] },

  { query: "Ohio emergency building repair contractor", category: "emergency_facility", tags: ["emergency", "repair"] },
  { query: "Ohio storm damage restoration bid", category: "emergency_facility", tags: ["emergency", "storm"] },
  { query: "Ohio fire damage repair construction", category: "emergency_facility", tags: ["emergency", "fire"] },
  { query: "Ohio flood restoration contractor", category: "emergency_facility", tags: ["emergency", "flood"] },
  { query: "Ohio facility emergency repair RFP", category: "emergency_facility", tags: ["emergency", "facility"] },
  { query: "Ohio urgent roof repair contractor", category: "emergency_facility", tags: ["emergency", "roof"] },
  { query: "Ohio disaster recovery construction bid", category: "emergency_facility", tags: ["emergency", "disaster"] },
  { query: "Ohio water damage restoration project", category: "emergency_facility", tags: ["emergency", "water"] },

  { query: "Ohio roofing contractor bid", category: "roofing_paving_trades", tags: ["roofing"] },
  { query: "Ohio commercial roofing project RFP", category: "roofing_paving_trades", tags: ["roofing", "commercial"] },
  { query: "Ohio paving contractor bid invitation", category: "roofing_paving_trades", tags: ["paving"] },
  { query: "Ohio parking lot paving bid", category: "roofing_paving_trades", tags: ["paving", "parking"] },
  { query: "Ohio asphalt repair contractor", category: "roofing_paving_trades", tags: ["paving", "asphalt"] },
  { query: "Ohio flat roof replacement bid", category: "roofing_paving_trades", tags: ["roofing", "flat-roof"] },
  { query: "Ohio metal roofing installation bid", category: "roofing_paving_trades", tags: ["roofing", "metal"] },
  { query: "Ohio siding installation contractor", category: "roofing_paving_trades", tags: ["siding"] },
  { query: "Ohio gutter installation contractor bid", category: "roofing_paving_trades", tags: ["gutter"] },

  { query: "Ohio building maintenance contract bid", category: "maintenance_service", tags: ["maintenance"] },
  { query: "Ohio HVAC maintenance service contract", category: "maintenance_service", tags: ["maintenance", "hvac"] },
  { query: "Ohio janitorial service contract RFP", category: "maintenance_service", tags: ["maintenance", "janitorial"] },
  { query: "Ohio grounds maintenance contract", category: "maintenance_service", tags: ["maintenance", "grounds"] },
  { query: "Ohio facility maintenance agreement bid", category: "maintenance_service", tags: ["maintenance", "facility"] },
  { query: "Ohio preventive maintenance contract RFP", category: "maintenance_service", tags: ["maintenance", "preventive"] },
  { query: "Ohio elevator maintenance service bid", category: "maintenance_service", tags: ["maintenance", "elevator"] },
  { query: "Ohio plumbing maintenance contract", category: "maintenance_service", tags: ["maintenance", "plumbing"] },
  { query: "Ohio electrical maintenance service contract", category: "maintenance_service", tags: ["maintenance", "electrical"] },
];

export function getQueriesByCategory(category: QueryCategory): QueryEntry[] {
  return QUERY_LIBRARY.filter((q) => q.category === category);
}

export function getAllCategories(): QueryCategory[] {
  return Object.keys(QUERY_CATEGORY_LABELS) as QueryCategory[];
}

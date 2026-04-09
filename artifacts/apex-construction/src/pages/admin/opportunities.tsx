import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Filter,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  useListOpportunities,
  useListOpportunitySources,
  useUpdateOpportunity,
  useCreateLead,
  useAddLeadNote,
  getListOpportunitiesQueryKey,
  ListOpportunitiesSort,
  ListOpportunitiesPriority,
  type Opportunity,
  type Lead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  saved: "bg-purple-100 text-purple-700 border-purple-200",
  dismissed: "bg-slate-100 text-slate-400 border-slate-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  reviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 4
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      <TrendingUp className="w-3 h-3" />
      {score}
    </span>
  );
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminOpportunities() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sort, setSort] = useState<string>(ListOpportunitiesSort.score);
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertErrorId, setConvertErrorId] = useState<number | null>(null);

  const { data, isLoading } = useListOpportunities({
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority:
      priorityFilter !== "all"
        ? (priorityFilter as typeof ListOpportunitiesPriority[keyof typeof ListOpportunitiesPriority])
        : undefined,
    trade_type: tradeFilter !== "all" ? tradeFilter : undefined,
    state: stateFilter.trim() || undefined,
    min_score: minScore ? Number(minScore) : undefined,
    sort: sort as typeof ListOpportunitiesSort[keyof typeof ListOpportunitiesSort],
    limit: 50,
  });

  const { data: sourcesData } = useListOpportunitySources();
  const sourceMap = new Map(
    (sourcesData?.sources ?? []).map((s) => [s.id, s.name])
  );

  const { mutate: updateOpportunity } = useUpdateOpportunity();
  const { mutate: createLead } = useCreateLead();
  const { mutateAsync: addLeadNote } = useAddLeadNote();

  const all = data?.opportunities ?? [];
  const opportunities = search
    ? all.filter(
        (o) =>
          o.title.toLowerCase().includes(search.toLowerCase()) ||
          o.city?.toLowerCase().includes(search.toLowerCase()) ||
          o.tradeType?.toLowerCase().includes(search.toLowerCase())
      )
    : all;
  const total = data?.total ?? 0;

  function handleAction(id: number, action: "save" | "dismiss") {
    const status = action === "save" ? "saved" : "dismissed";
    updateOpportunity(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
          toast({ title: action === "save" ? "Opportunity saved" : "Opportunity dismissed" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  }

  function handleConvertToLead(opp: Opportunity) {
    setConvertingId(opp.id);
    const location = [opp.city, opp.state].filter(Boolean).join(", ");
    const preferredMethod = opp.contactEmail ? "email" : "call";
    createLead(
      {
        data: {
          fullName: opp.contactName ?? "Unknown",
          phone: opp.contactPhone ?? "",
          email: opp.contactEmail ?? "",
          city: opp.city ?? "",
          zipCode: "",
          serviceNeeded: opp.tradeType?.replace(/_/g, " ") ?? opp.title,
          projectDescription: [
            opp.title,
            opp.description ?? "",
            location ? `Location: ${location}` : "",
          ].filter(Boolean).join("\n\n"),
          preferredTimeline: opp.deadlineAt
            ? `By ${new Date(opp.deadlineAt).toLocaleDateString()}`
            : "Flexible",
          preferredContactMethod: preferredMethod,
        },
      },
      {
        onSuccess: async (lead: Lead) => {
          if (opp.sourceUrl) {
            try {
              await addLeadNote({ id: lead.id, data: { content: `Source: ${opp.sourceUrl}` } });
            } catch (noteErr) {
              console.warn("Failed to add source URL note to lead:", noteErr);
            }
          }
          updateOpportunity({ id: opp.id, data: { status: "converted" } });
          queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
          toast({
            title: "Lead created",
            description: (
              <span>
                View lead:{" "}
                <a
                  href={`/admin/leads/${lead.id}`}
                  className="underline font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/admin/leads/${lead.id}`);
                  }}
                >
                  #{lead.id}
                </a>
              </span>
            ),
          });
        },
        onError: () => {
          setConvertErrorId(opp.id);
          toast({ title: "Failed to create lead", variant: "destructive" });
          setTimeout(() => setConvertErrorId(null), 6000);
        },
        onSettled: () => setConvertingId(null),
      }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Opportunities</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total · scored & ranked</p>
        </div>
        <Link href="/admin/opportunities/sources">
          <Button size="sm" variant="outline" className="border-slate-200 text-xs gap-1.5">
            <Filter className="w-3 h-3" /> Sources
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search title, city, trade type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ListOpportunitiesSort.score}>By Score</SelectItem>
                <SelectItem value={ListOpportunitiesSort.newest}>Newest First</SelectItem>
                <SelectItem value={ListOpportunitiesSort.deadline}>Deadline Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tradeFilter} onValueChange={setTradeFilter}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Trade Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="general_construction">General Construction</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="renovation">Renovation</SelectItem>
                <SelectItem value="interior_finishing">Interior Finishing</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="State (e.g. OH)"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-8 text-xs w-28"
            />

            <Input
              placeholder="Min score"
              type="number"
              min={0}
              max={10}
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="h-8 text-xs w-24"
            />

            {(statusFilter !== "all" ||
              priorityFilter !== "all" ||
              tradeFilter !== "all" ||
              stateFilter ||
              minScore ||
              search) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setTradeFilter("all");
                  setStateFilter("");
                  setMinScore("");
                  setSearch("");
                }}
                className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span className="col-span-1">Score</span>
          <span className="col-span-3">Title</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-1">Source</span>
          <span className="col-span-1">Trade</span>
          <span className="col-span-1">Location</span>
          <span className="col-span-1">Budget</span>
          <span className="col-span-1">Posted</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No opportunities found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {opportunities.map((opp) => {
              const budget = formatBudget(opp.budgetMin, opp.budgetMax);
              const posted = formatDate(opp.postedAt);
              const locationStr = [opp.city, opp.state].filter(Boolean).join(", ");
              return (
                <li key={opp.id} className="group">
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-3 px-4 py-4 hover:bg-slate-50 transition-colors">
                    <div className="shrink-0 mt-0.5">
                      <ScoreBadge score={opp.score ?? 0} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/opportunities/${opp.id}`}>
                        <span className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition-colors leading-snug">
                          {opp.title}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {opp.priorityLevel && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${PRIORITY_COLORS[opp.priorityLevel] ?? ""}`}>
                            {opp.priorityLevel}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.new}`}>
                          {opp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
                        {locationStr && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{locationStr}
                          </span>
                        )}
                        {budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />{budget}
                          </span>
                        )}
                        {opp.deadlineAt && (
                          <span className="flex items-center gap-1 text-orange-500 font-medium">
                            <Calendar className="w-3 h-3" />Due {formatDate(opp.deadlineAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 mt-1" />
                  </div>

                  {/* Desktop table row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-slate-50 transition-colors">
                    <div className="col-span-1">
                      <ScoreBadge score={opp.score ?? 0} />
                    </div>
                    <div className="col-span-3 min-w-0">
                      <Link href={`/admin/opportunities/${opp.id}`}>
                        <span className="font-semibold text-slate-900 text-sm hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                          {opp.title}
                        </span>
                      </Link>
                    </div>
                    <div className="col-span-1">
                      {opp.priorityLevel ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${PRIORITY_COLORS[opp.priorityLevel] ?? ""}`}>
                          {opp.priorityLevel}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {opp.sourceId ? (
                        <span className="text-xs text-slate-500 truncate">
                          {sourceMap.get(opp.sourceId) ?? `#${opp.sourceId}`}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {opp.tradeType ? (
                        <Badge variant="outline" className="text-xs py-0 truncate max-w-full">
                          {opp.tradeType.replace(/_/g, " ")}
                        </Badge>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {locationStr ? (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{locationStr}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {budget ? (
                        <span className="text-xs text-slate-600">{budget}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {posted ? (
                        <span className="text-xs text-slate-500">{posted}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.new}`}>
                        {opp.status}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="sr-only">Actions</span>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/opportunities/${opp.id}`}>View Detail</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(opp.id, "save")}>
                            Save
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(opp.id, "dismiss")}>
                            Dismiss
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={convertingId === opp.id || opp.status === "converted"}
                            onClick={() => handleConvertToLead(opp)}
                            className="text-amber-700 font-semibold"
                          >
                            {convertingId === opp.id ? "Converting..." : "Convert to Lead"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {convertErrorId === opp.id && (
                    <div className="mx-4 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      Failed to convert opportunity to lead. Please try again.
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 flex gap-2 text-xs text-slate-500">
        <Link href="/admin/opportunities/sync-log" className="hover:text-amber-600 underline underline-offset-2">
          Sync Log
        </Link>
        <span>·</span>
        <Link href="/admin/opportunities/rules" className="hover:text-amber-600 underline underline-offset-2">
          Scoring Rules
        </Link>
        <span>·</span>
        <Link href="/admin/opportunities/sources" className="hover:text-amber-600 underline underline-offset-2">
          Manage Sources
        </Link>
      </div>
    </div>
  );
}

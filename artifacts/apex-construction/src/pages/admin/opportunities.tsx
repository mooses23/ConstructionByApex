import { useState } from "react";
import { Link } from "wouter";
import { Search, TrendingUp, MapPin, Calendar, DollarSign, ChevronRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListOpportunities } from "@workspace/api-client-react";

const STATUSES = ["all", "new", "reviewing", "bookmarked", "dismissed"];
const TRADE_TYPES = ["all", "general_construction", "kitchen", "roofing", "hvac", "renovation", "interior_finishing", "masonry", "structural"];

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  bookmarked: "Bookmarked",
  dismissed: "Dismissed",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  reviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  bookmarked: "bg-purple-100 text-purple-700 border-purple-200",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
};

function ScoreBadge({ score }: { score: number }) {
  if (score >= 8) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200"><TrendingUp className="w-3 h-3" />{score}</span>;
  if (score >= 4) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200"><TrendingUp className="w-3 h-3" />{score}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200"><TrendingUp className="w-3 h-3" />{score}</span>;
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminOpportunities() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListOpportunities({
    status: statusFilter !== "all" ? statusFilter as never : undefined,
    tradeType: tradeFilter !== "all" ? tradeFilter : undefined,
    sort: sort as never,
    limit: 50,
  });

  const all = data?.opportunities ?? [];
  const opportunities = search
    ? all.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.city?.toLowerCase().includes(search.toLowerCase()) ||
        o.category?.toLowerCase().includes(search.toLowerCase())
      )
    : all;
  const total = data?.total ?? 0;

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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search title, city, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">By Score</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="deadline">Deadline Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-amber-500 text-black border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                }`}
              >
                {s === "all" ? "All Statuses" : STATUS_LABELS[s] ?? s}
              </button>
            ))}
            <span className="w-px bg-slate-200 mx-1 self-stretch" />
            {TRADE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTradeFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  tradeFilter === t
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {t === "all" ? "All Trades" : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No opportunities found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {opportunities.map((opp) => {
              const budget = formatBudget(opp.budgetMin, opp.budgetMax);
              const due = formatDate(opp.dueAt);
              return (
                <li key={opp.id}>
                  <Link href={`/admin/opportunities/${opp.id}`}>
                    <div className="flex items-start gap-4 px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="shrink-0 mt-0.5">
                        <ScoreBadge score={opp.score ?? 0} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition-colors leading-snug">
                            {opp.title}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.new}`}>
                            {STATUS_LABELS[opp.status] ?? opp.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500">
                          {opp.city && opp.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{opp.city}, {opp.state}
                            </span>
                          )}
                          {budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />{budget}
                            </span>
                          )}
                          {due && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Due {due}
                            </span>
                          )}
                          {opp.category && (
                            <Badge variant="outline" className="text-xs py-0 capitalize">
                              {opp.category}
                            </Badge>
                          )}
                          {opp.tradeType && (
                            <Badge variant="outline" className="text-xs py-0">
                              {opp.tradeType.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 flex gap-2 text-xs text-slate-500">
        <Link href="/admin/opportunities/sync-log" className="hover:text-amber-600 underline underline-offset-2">Sync Log</Link>
        <span>·</span>
        <Link href="/admin/opportunities/rules" className="hover:text-amber-600 underline underline-offset-2">Scoring Rules</Link>
        <span>·</span>
        <Link href="/admin/opportunities/sources" className="hover:text-amber-600 underline underline-offset-2">Manage Sources</Link>
      </div>
    </div>
  );
}

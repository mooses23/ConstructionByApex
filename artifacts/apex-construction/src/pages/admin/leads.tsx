import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, ChevronRight, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListLeads } from "@workspace/api-client-react";

const STATUSES = ["all", "new", "contacted", "quoted", "won", "lost"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  quoted: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function AdminLeads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useListLeads({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "new" | "contacted" | "quoted" | "won" | "lost") : undefined,
    limit: 50,
    offset: 0,
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                className={
                  statusFilter === s
                    ? "bg-amber-500 text-black hover:bg-amber-600 font-bold capitalize"
                    : "border-slate-200 text-slate-600 hover:border-amber-400 capitalize text-xs"
                }
                onClick={() => setStatusFilter(s)}
                data-testid={`button-filter-${s}`}
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p>No leads found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                data-testid={`row-lead-${lead.id}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-slate-600">{lead.fullName.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{lead.fullName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[lead.status] ?? ""}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs">{lead.serviceNeeded}</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{lead.city}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

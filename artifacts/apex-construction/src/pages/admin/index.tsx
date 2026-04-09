import { Link } from "wouter";
import { Users, TrendingUp, Plus, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetDashboardStats, useGetRecentLeads, useListLeads, useUpdateLead, ListLeadsStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  quoted: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentData, isLoading: recentLoading } = useGetRecentLeads({ limit: 8 });
  const { data: newLeadsData, isLoading: followUpLoading } = useListLeads({ status: ListLeadsStatus.new, limit: 50 });
  const { data: contactedLeadsData } = useListLeads({ status: ListLeadsStatus.contacted, limit: 50 });
  const { mutate: updateLead } = useUpdateLead();

  const recentLeads = recentData?.leads ?? [];

  const followUpLeads = [
    ...(newLeadsData?.leads ?? []),
    ...(contactedLeadsData?.leads ?? []),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const statCards = stats
    ? [
        {
          label: "New Leads",
          value: stats.newLeads,
          icon: Plus,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "In Progress",
          value: stats.contactedLeads + stats.quotedLeads,
          icon: Users,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        },
        {
          label: "Won This Month",
          value: stats.wonThisMonth,
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50",
        },
      ]
    : [];

  function handleStatusChange(id: number, status: string) {
    updateLead(
      { id, data: { status: status as "new" | "contacted" | "quoted" | "won" | "lost" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
        },
      }
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {stats ? `${stats.thisMonthLeads} leads this month` : "Loading stats..."}
        </p>
      </div>

      {/* KPI Cards — 3 only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statsLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{card.label}</p>
              </div>
            ))}
      </div>

      {/* Needs Follow-Up */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-amber-100 bg-amber-50 rounded-t-xl">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h2 className="font-extrabold text-slate-900">Needs Follow-Up</h2>
          <span className="ml-auto text-xs text-slate-500 font-medium">Oldest first</span>
        </div>
        {followUpLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : followUpLeads.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No leads waiting for follow-up.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followUpLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {lead.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{lead.fullName}</p>
                    <p className="text-slate-400 text-xs truncate">{lead.serviceNeeded} · {lead.city}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0 ml-3">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </Link>
                <div className="ml-4 shrink-0">
                  <Select
                    value={lead.status}
                    onValueChange={(val) => handleStatusChange(lead.id, val)}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["new", "contacted", "quoted", "won", "lost"].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Recent Leads</h2>
          <Link href="/admin/leads" className="text-amber-500 hover:text-amber-600 text-sm font-semibold flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>No leads yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                data-testid={`row-lead-${lead.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {lead.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{lead.fullName}</p>
                    <p className="text-slate-400 text-xs">{lead.serviceNeeded} · {lead.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {lead.status}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

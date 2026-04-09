import { Link } from "wouter";
import { Users, UserCheck, FileText, TrendingUp, XCircle, Plus, ArrowRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGetDashboardStats, useGetRecentLeads } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  quoted: "bg-purple-100 text-purple-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentData, isLoading: recentLoading } = useGetRecentLeads({ limit: 8 });

  const recentLeads = recentData?.leads ?? [];

  const statCards = stats
    ? [
        { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "New", value: stats.newLeads, icon: Plus, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Contacted", value: stats.contactedLeads, icon: UserCheck, color: "text-yellow-600", bg: "bg-yellow-50" },
        { label: "Quoted", value: stats.quotedLeads, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Won", value: stats.wonLeads, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Lost", value: stats.lostLeads, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {stats ? `${stats.thisMonthLeads} leads this month · ${stats.conversionRate}% conversion rate` : "Loading stats..."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
              </div>
            ))}
      </div>

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

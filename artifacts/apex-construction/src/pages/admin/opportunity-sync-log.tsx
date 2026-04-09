import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListSyncRuns } from "@workspace/api-client-react";

type SyncRun = {
  id: string;
  sourceId?: string | null;
  sourceName?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  status: string;
  itemsFetched?: number | null;
  itemsInserted?: number | null;
  itemsUpdated?: number | null;
  errorText?: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  success: { icon: CheckCircle2, color: "text-green-500", label: "Success" },
  error: { icon: XCircle, color: "text-red-500", label: "Error" },
  partial: { icon: AlertTriangle, color: "text-yellow-500", label: "Partial" },
  running: { icon: RefreshCw, color: "text-blue-500", label: "Running" },
};

function formatDuration(start: string, end?: string | null) {
  if (!end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminOpportunitySyncLog() {
  const { data, isLoading } = useListSyncRuns({ limit: 100 } as never);

  const runs: SyncRun[] = (data?.runs ?? []) as SyncRun[];
  const total = data?.total ?? 0;

  const successCount = runs.filter((r) => r.status === "success").length;
  const errorCount = runs.filter((r) => r.status === "error").length;
  const totalFetched = runs.reduce((acc, r) => acc + (r.itemsFetched ?? 0), 0);
  const totalInserted = runs.reduce((acc, r) => acc + (r.itemsInserted ?? 0), 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 hover:text-slate-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-amber-500" /> Sync Log
          </h1>
          <p className="text-slate-500 text-sm mt-1">{total} total runs across all sources</p>
        </div>
        <Link href="/admin/opportunities/sources">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Zap className="w-3 h-3" /> Manage Sources
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Runs", value: total, icon: RefreshCw, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Successful", value: successCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Errors", value: errorCount, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Items Fetched", value: totalFetched, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="col-span-1">Status</span>
            <span className="col-span-3">Source</span>
            <span className="col-span-3">Started</span>
            <span className="col-span-2 text-center">Fetched</span>
            <span className="col-span-2 text-center">New / Upd</span>
            <span className="col-span-1 text-right">Time</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No sync runs yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {runs.map((run) => {
              const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.running;
              const StatusIcon = cfg.icon;
              const duration = formatDuration(run.startedAt, run.finishedAt);
              return (
                <li key={run.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-1 flex items-center pt-0.5">
                      <StatusIcon className={`w-4 h-4 ${cfg.color} ${run.status === "running" ? "animate-spin" : ""}`} />
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-medium text-slate-700">{run.sourceName ?? "Unknown"}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                        run.status === "success" ? "bg-green-100 text-green-700" :
                        run.status === "error" ? "bg-red-100 text-red-700" :
                        run.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{cfg.label}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm text-slate-600">{formatTime(run.startedAt)}</span>
                      <span className="text-xs text-slate-400 block">{timeAgo(run.startedAt)}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-semibold text-slate-700">{run.itemsFetched ?? 0}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-green-600 font-semibold">+{run.itemsInserted ?? 0}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-sm text-blue-600 font-semibold">{run.itemsUpdated ?? 0}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <span className="text-xs text-slate-400">{duration ?? "—"}</span>
                    </div>
                  </div>
                  {run.errorText && (
                    <div className="mt-1.5 pl-7">
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                        {run.errorText}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalInserted > 0 && (
        <p className="text-xs text-center text-slate-400 mt-4">
          {totalInserted} opportunities inserted across all runs
        </p>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSyncLog, useListOpportunitySources } from "@workspace/api-client-react";

const PAGE_SIZE = 20;

function formatDuration(startedAt: string, completedAt?: string | null) {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success")
    return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
  if (status === "error" || status === "failed")
    return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  if (status === "running")
    return <RefreshCw className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />;
  return <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />;
}

export default function AdminOpportunitySyncLog() {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data: logData, isLoading, refetch } = useGetSyncLog({ limit: PAGE_SIZE, offset });
  const { data: sourcesData } = useListOpportunitySources();

  const runs = logData?.runs ?? [];
  const total = logData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sourceMap = new Map(
    (sourcesData?.sources ?? []).map((s) => [s.id, s.name])
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sync Log</h1>
          <p className="text-slate-500 text-sm mt-1">{total} sync runs recorded</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="gap-1.5 text-xs border-slate-200"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No sync runs yet</p>
          <p className="text-sm">Trigger a sync from the Sources page to see activity here.</p>
          <Link href="/admin/opportunities/sources">
            <Button size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold">
              Go to Sources
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="col-span-1">Status</span>
            <span className="col-span-2">Source</span>
            <span className="col-span-3">Started</span>
            <span className="col-span-1 text-center">Fetched</span>
            <span className="col-span-1 text-center">Inserted</span>
            <span className="col-span-1 text-center">Skipped</span>
            <span className="col-span-2">Duration</span>
            <span className="col-span-1">Error</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {runs.map((run) => {
              const sourceName = run.sourceId != null
                ? (sourceMap.get(run.sourceId) ?? `Source #${run.sourceId}`)
                : "All Sources";
              const duration = formatDuration(run.startedAt, run.completedAt);
              const hasError = Boolean(run.errorMessage);

              return (
                <li key={run.id}>
                  {/* Mobile */}
                  <div className="md:hidden px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon status={run.status} />
                      <span className="font-semibold text-sm text-slate-900">{sourceName}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(run.startedAt)}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 ml-7">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">{run.recordsFetched}</span> fetched
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-green-600">{run.recordsInserted}</span> new
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-slate-400">{run.recordsSkipped}</span> skipped
                      </span>
                      {duration && <span>{duration}</span>}
                    </div>
                    {hasError && (
                      <div className="mt-2 ml-7 text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
                        {run.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Desktop */}
                  <div className={`hidden md:grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm ${hasError ? "bg-red-50/30" : ""}`}>
                    <div className="col-span-1 flex items-center">
                      <StatusIcon status={run.status} />
                    </div>
                    <div className="col-span-2 text-xs text-slate-700 font-medium truncate">
                      {sourceName}
                    </div>
                    <div className="col-span-3 text-xs text-slate-500">
                      {formatDateTime(run.startedAt)}
                    </div>
                    <div className="col-span-1 text-center text-sm font-semibold text-slate-700">
                      {run.recordsFetched}
                    </div>
                    <div className="col-span-1 text-center text-sm font-semibold text-green-600">
                      {run.recordsInserted}
                    </div>
                    <div className="col-span-1 text-center text-sm font-semibold text-slate-400">
                      {run.recordsSkipped}
                    </div>
                    <div className="col-span-2 text-xs text-slate-500">
                      {duration ?? (
                        <span className="flex items-center gap-1 text-blue-500">
                          <RefreshCw className="w-3 h-3 animate-spin" /> running
                        </span>
                      )}
                    </div>
                    <div className="col-span-1">
                      {hasError ? (
                        <span
                          className="inline-block text-xs text-red-600 underline underline-offset-2 cursor-help truncate max-w-[80px]"
                          title={run.errorMessage ?? ""}
                        >
                          {run.errorMessage?.substring(0, 20)}…
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer: count + pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Showing {runs.length > 0 ? offset + 1 : 0}–{offset + runs.length} of {total} sync runs
        </span>

        {total > PAGE_SIZE && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="h-7 px-2 text-slate-500 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="px-2 text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-slate-500 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

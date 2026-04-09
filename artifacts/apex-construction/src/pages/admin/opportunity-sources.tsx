import { Link } from "wouter";
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useListOpportunitySources,
  useUpdateOpportunitySource,
  useTriggerSourceSync,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const INGESTION_LABELS: Record<string, string> = {
  sam_gov: "SAM.gov",
  rss: "RSS Feed",
  google_pse: "Google PSE",
  email: "Email Digest",
  manual: "Manual",
};

const INGESTION_ICONS: Record<string, string> = {
  sam_gov: "🏛️",
  rss: "📡",
  google_pse: "🔍",
  email: "📧",
  manual: "✏️",
};

function timeAgo(iso?: string | null) {
  if (!iso) return null;
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminOpportunitySources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const { data, isLoading } = useListOpportunitySources();
  const { mutate: updateSource } = useUpdateOpportunitySource();
  const { mutate: triggerSync } = useTriggerSourceSync();

  const sources = data?.sources ?? [];

  function handleToggle(id: string, enabled: boolean) {
    updateSource(
      { id, data: { enabled } as never },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities/sources"] });
          toast({ title: `Source ${enabled ? "enabled" : "disabled"}` });
        },
        onError: () => toast({ title: "Failed to update source", variant: "destructive" }),
      }
    );
  }

  function handleSync(id: string) {
    setSyncingId(id);
    triggerSync(
      { id } as never,
      {
        onSuccess: (result: unknown) => {
          const r = result as { inserted?: number; updated?: number };
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities/sources"] });
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities/sync-log"] });
          toast({ title: `Sync complete — ${r?.inserted ?? 0} new, ${r?.updated ?? 0} updated` });
        },
        onError: () => toast({ title: "Sync failed", variant: "destructive" }),
        onSettled: () => setSyncingId(null),
      }
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 hover:text-slate-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ingestion Sources</h1>
          <p className="text-slate-500 text-sm mt-1">Manage where opportunities are pulled from</p>
        </div>
        <Link href="/admin/opportunities/sync-log">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Clock className="w-3 h-3" /> Sync Log
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No sources configured</div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className={`p-5 flex items-start gap-4 ${!source.enabled ? "opacity-60" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                {INGESTION_ICONS[source.ingestionType] ?? "🔗"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{source.name}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {INGESTION_LABELS[source.ingestionType] ?? source.ingestionType}
                  </span>
                  {source.pollIntervalMinutes && (
                    <span className="text-xs text-slate-400">· every {source.pollIntervalMinutes}m</span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {source.lastSyncAt ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Last synced {timeAgo(source.lastSyncAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />Never synced
                    </span>
                  )}
                  {source.lastError && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="w-3 h-3" />{source.lastError}
                    </span>
                  )}
                </div>
                {source.configJson && typeof source.configJson === "object" && Object.keys(source.configJson as object).length > 0 && (
                  <div className="mt-2">
                    <code className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-500 block truncate">
                      {JSON.stringify(source.configJson)}
                    </code>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Switch
                  checked={source.enabled}
                  onCheckedChange={(checked) => handleToggle(source.id, checked)}
                />
                {source.enabled && source.ingestionType !== "manual" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    disabled={syncingId === source.id}
                    onClick={() => handleSync(source.id)}
                  >
                    {syncingId === source.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    {syncingId === source.id ? "Syncing..." : "Sync Now"}
                  </Button>
                )}
                {!source.enabled && (
                  <XCircle className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Sources poll automatically on their configured interval. Use "Sync Now" to trigger immediately.
      </p>
    </div>
  );
}

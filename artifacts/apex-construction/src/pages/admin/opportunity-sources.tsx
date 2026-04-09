import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle,
  Radio,
  Edit3,
  X,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useListOpportunitySources,
  useCreateOpportunitySource,
  useUpdateOpportunitySource,
  useDeleteOpportunitySource,
  useSyncOpportunitySource,
  getListOpportunitySourcesQueryKey,
  type OpportunitySource,
  type CreateOpportunitySourceBodySourceType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  samgov: "API — SAM.gov",
  rss: "RSS Feed",
  google_pse: "Search — Google PSE",
  manual: "Manual",
  email: "Email Ingest",
};

const SOURCE_TYPE_ICONS: Record<string, string> = {
  samgov: "🏛️",
  rss: "📡",
  google_pse: "🔍",
  manual: "✏️",
  email: "📧",
};

const CONFIG_PLACEHOLDER: Record<string, string> = {
  rss: '{\n  "feedUrl": "https://example.com/feed.rss"\n}',
  google_pse: '{\n  "cx": "your-search-engine-id",\n  "query": "construction contracts"\n}',
  samgov: '{\n  "naics": "236220",\n  "place_of_performance_state": "OH"\n}',
  email: '{\n  "inbox": "opportunities@yourcompany.com"\n}',
  manual: "{}",
};

interface SourceFormData {
  name: string;
  sourceType: CreateOpportunitySourceBodySourceType;
  isActive: boolean;
  pollInterval: string;
  configJson: string;
}

const INITIAL_FORM: SourceFormData = {
  name: "",
  sourceType: "rss" as CreateOpportunitySourceBodySourceType,
  isActive: true,
  pollInterval: "60",
  configJson: CONFIG_PLACEHOLDER.rss,
};

function timeAgo(iso?: string | null) {
  if (!iso) return null;
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseConfig(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function SourceCard({
  source,
  onSync,
  onDelete,
  onEdit,
  onToggleEnabled,
  syncState,
  isToggling,
}: {
  source: OpportunitySource;
  onSync: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (source: OpportunitySource) => void;
  onToggleEnabled: (source: OpportunitySource) => void;
  syncState: "idle" | "syncing" | "success" | "error";
  isToggling: boolean;
}) {
  const lastSync = timeAgo(source.lastSyncAt);
  const config = (source.config ?? {}) as Record<string, unknown>;
  const pollInterval = config.pollInterval as number | undefined;
  const displayConfig = Object.fromEntries(
    Object.entries(config).filter(([k]) => k !== "pollInterval")
  );
  const hasConfig = Object.keys(displayConfig).length > 0;

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${source.isActive ? "border-slate-200" : "border-slate-100 opacity-75"}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl border border-slate-100">
          {SOURCE_TYPE_ICONS[source.sourceType] ?? "🔌"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{source.name}</h3>
            {syncState === "error" && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" /> Sync error
              </span>
            )}
            {syncState === "success" && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Synced
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
            <span>{SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}</span>
            {pollInterval ? (
              <>
                <span>·</span>
                <span>Every {pollInterval}m</span>
              </>
            ) : null}
            {lastSync ? (
              <>
                <span>·</span>
                <span>Last sync: {lastSync}</span>
              </>
            ) : (
              <>
                <span>·</span>
                <span className="text-slate-400 italic">Never synced</span>
              </>
            )}
          </div>

          {hasConfig && (
            <div className="mt-1">
              <pre className="text-xs bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 text-slate-600 font-mono overflow-auto max-h-20 whitespace-pre-wrap break-all">
                {JSON.stringify(displayConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5" title={source.isActive ? "Enabled — click to disable" : "Disabled — click to enable"}>
            <Switch
              checked={source.isActive}
              onCheckedChange={() => onToggleEnabled(source)}
              disabled={isToggling}
              className="scale-75"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(source)}
            className="text-slate-400 hover:text-slate-600 p-1.5"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSync(source.id)}
            disabled={syncState === "syncing" || !source.isActive}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-1.5 disabled:opacity-40"
            title={source.isActive ? "Sync now" : "Enable source to sync"}
          >
            {syncState === "syncing" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(source.id)}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: SourceFormData;
  onSubmit: (data: SourceFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<SourceFormData>(initial);
  const [configError, setConfigError] = useState<string | null>(null);

  function set<K extends keyof SourceFormData>(key: K, val: SourceFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleTypeChange(type: CreateOpportunitySourceBodySourceType) {
    set("sourceType", type);
    if (!form.configJson || form.configJson === "{}" || Object.values(CONFIG_PLACEHOLDER).includes(form.configJson.trim())) {
      set("configJson", CONFIG_PLACEHOLDER[type] ?? "{}");
    }
    setConfigError(null);
  }

  function handleConfigChange(val: string) {
    set("configJson", val);
    try {
      JSON.parse(val);
      setConfigError(null);
    } catch {
      setConfigError("Invalid JSON — check your syntax");
    }
  }

  function handleSubmit() {
    try {
      JSON.parse(form.configJson);
    } catch {
      setConfigError("Invalid JSON — please fix before saving");
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">
          {initial.name ? "Edit Source" : "Add New Source"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Source Name *</Label>
          <Input
            placeholder="e.g. Ohio RSS Feed"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Source Type *</Label>
          <Select
            value={form.sourceType}
            onValueChange={(v) => handleTypeChange(v as CreateOpportunitySourceBodySourceType)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {SOURCE_TYPE_ICONS[k]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-slate-500 mb-1 block">
            Configuration
            <span className="ml-1 font-normal text-slate-400">(JSON)</span>
          </Label>
          <Textarea
            value={form.configJson}
            onChange={(e) => handleConfigChange(e.target.value)}
            className={`text-xs font-mono leading-relaxed resize-y min-h-[80px] ${configError ? "border-red-400 focus:ring-red-400" : ""}`}
            rows={4}
            spellCheck={false}
          />
          {configError ? (
            <p className="text-xs text-red-500 mt-1">{configError}</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Provide connector-specific settings as JSON (e.g. URL, API key, query terms).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <Switch
              id="src-active"
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
            <Label htmlFor="src-active" className="text-sm text-slate-700 cursor-pointer">
              Enabled
            </Label>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Poll Interval (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={1440}
              placeholder="60"
              value={form.pollInterval}
              onChange={(e) => set("pollInterval", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!form.name.trim() || !!configError || loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          {loading ? "Saving..." : "Save Source"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminOpportunitySources() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<OpportunitySource | null>(null);
  const [syncStates, setSyncStates] = useState<Record<number, "idle" | "syncing" | "success" | "error">>({});
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { data, isLoading } = useListOpportunitySources();
  const { mutate: createSource, isPending: creating } = useCreateOpportunitySource();
  const { mutate: updateSource, isPending: updating } = useUpdateOpportunitySource();
  const { mutate: deleteSource } = useDeleteOpportunitySource();
  const { mutate: syncSource } = useSyncOpportunitySource();

  const sources = data?.sources ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListOpportunitySourcesQueryKey() });
  }

  function handleSubmit(formData: SourceFormData) {
    const baseConfig = parseConfig(formData.configJson);
    const pollMinutes = parseInt(formData.pollInterval, 10);
    const config = {
      ...baseConfig,
      ...(pollMinutes > 0 ? { pollInterval: pollMinutes } : {}),
    };
    const body = {
      name: formData.name,
      sourceType: formData.sourceType,
      isActive: formData.isActive,
      config,
    };

    if (editingSource) {
      updateSource(
        { id: editingSource.id, data: body },
        {
          onSuccess: () => {
            invalidate();
            setEditingSource(null);
            toast({ title: "Source updated" });
          },
          onError: () => toast({ title: "Failed to update source", variant: "destructive" }),
        }
      );
    } else {
      createSource(
        { data: body },
        {
          onSuccess: () => {
            invalidate();
            setShowForm(false);
            toast({ title: "Source added" });
          },
          onError: () => toast({ title: "Failed to create source", variant: "destructive" }),
        }
      );
    }
  }

  function handleSync(id: number) {
    setSyncStates((prev) => ({ ...prev, [id]: "syncing" }));
    syncSource(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setSyncStates((prev) => ({ ...prev, [id]: "success" }));
          toast({ title: "Sync completed", description: "Source data refreshed" });
          setTimeout(() => setSyncStates((prev) => ({ ...prev, [id]: "idle" })), 4000);
        },
        onError: () => {
          setSyncStates((prev) => ({ ...prev, [id]: "error" }));
          toast({ title: "Sync failed", variant: "destructive" });
          setTimeout(() => setSyncStates((prev) => ({ ...prev, [id]: "idle" })), 6000);
        },
      }
    );
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this source? This cannot be undone.")) return;
    deleteSource(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Source deleted" });
        },
        onError: () => toast({ title: "Failed to delete source", variant: "destructive" }),
      }
    );
  }

  function handleEdit(source: OpportunitySource) {
    setEditingSource(source);
    setShowForm(false);
  }

  function handleToggleEnabled(source: OpportunitySource) {
    setTogglingId(source.id);
    updateSource(
      {
        id: source.id,
        data: {
          name: source.name,
          sourceType: source.sourceType,
          config: (source.config ?? {}) as Record<string, unknown>,
          isActive: !source.isActive,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          setTogglingId(null);
          toast({ title: source.isActive ? "Source disabled" : "Source enabled" });
        },
        onError: () => {
          setTogglingId(null);
          toast({ title: "Failed to update source", variant: "destructive" });
        },
      }
    );
  }

  const activeCount = sources.filter((s) => s.isActive).length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Opportunity Sources</h1>
          <p className="text-slate-500 text-sm mt-1">
            {sources.length} sources · {activeCount} active
          </p>
        </div>
        {!showForm && !editingSource && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Source
          </Button>
        )}
      </div>

      {(showForm || editingSource) && (
        <div className="mb-4">
          <SourceForm
            initial={
              editingSource
                ? (() => {
                    const cfg = (editingSource.config ?? {}) as Record<string, unknown>;
                    const pi = cfg.pollInterval as number | undefined;
                    const displayCfg = Object.fromEntries(
                      Object.entries(cfg).filter(([k]) => k !== "pollInterval")
                    );
                    return {
                      name: editingSource.name,
                      sourceType: editingSource.sourceType,
                      isActive: editingSource.isActive,
                      pollInterval: pi ? String(pi) : "60",
                      configJson: JSON.stringify(displayCfg, null, 2),
                    };
                  })()
                : INITIAL_FORM
            }
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSource(null);
            }}
            loading={creating || updating}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No sources configured</p>
          <p className="text-sm">Add your first data source above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onSync={handleSync}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
              syncState={syncStates[source.id] ?? "idle"}
              isToggling={togglingId === source.id}
            />
          ))}
        </div>
      )}

      <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" /> Supported Source Types
        </h3>
        <ul className="space-y-1">
          {Object.entries(SOURCE_TYPE_LABELS).map(([k, label]) => (
            <li key={k} className="flex items-center gap-2 text-sm text-slate-600">
              <span>{SOURCE_TYPE_ICONS[k]}</span>
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        Active sources are automatically synced on a schedule. Use the play button to trigger an immediate sync.
      </div>
    </div>
  );
}

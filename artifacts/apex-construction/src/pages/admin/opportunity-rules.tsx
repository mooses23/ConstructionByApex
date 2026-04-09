import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Settings2,
  Edit3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  useListOpportunityRules,
  useCreateOpportunityRule,
  useUpdateOpportunityRule,
  useDeleteOpportunityRule,
  getListOpportunityRulesQueryKey,
  type OpportunityRule,
  type OpportunityRuleMetadata,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface RuleFormData {
  name: string;
  isActive: boolean;
  keywords: string;
  excludeKeywords: string;
  tradeTypes: string;
  targetStates: string;
  minBudget: string;
  maxBudget: string;
  minScore: string;
  weightKeyword: number;
  weightUrgency: number;
  weightRecency: number;
  weightBudget: number;
}

const INITIAL_FORM: RuleFormData = {
  name: "",
  isActive: true,
  keywords: "",
  excludeKeywords: "",
  tradeTypes: "",
  targetStates: "",
  minBudget: "",
  maxBudget: "",
  minScore: "",
  weightKeyword: 3,
  weightUrgency: 2,
  weightRecency: 2,
  weightBudget: 1,
};

function csvToArray(csv: string): string[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

function arrayToCsv(arr: string[]): string {
  return arr.join(", ");
}

function formToApiPayload(form: RuleFormData) {
  const metadata: OpportunityRuleMetadata = {
    excludeKeywords: csvToArray(form.excludeKeywords),
    maxBudget: form.maxBudget ? Number(form.maxBudget) : undefined,
    minScore: form.minScore ? Number(form.minScore) : undefined,
    weightKeyword: form.weightKeyword,
    weightUrgency: form.weightUrgency,
    weightRecency: form.weightRecency,
    weightBudget: form.weightBudget,
  };
  return {
    name: form.name,
    isActive: form.isActive,
    keywords: csvToArray(form.keywords),
    tradeTypes: csvToArray(form.tradeTypes),
    targetStates: csvToArray(form.targetStates),
    minBudget: form.minBudget ? Number(form.minBudget) : undefined,
    metadata,
  };
}

function ruleToFormData(rule: OpportunityRule): RuleFormData {
  const meta = (rule.metadata ?? {}) as OpportunityRuleMetadata;
  return {
    name: rule.name,
    isActive: rule.isActive,
    keywords: arrayToCsv(rule.keywords ?? []),
    excludeKeywords: arrayToCsv(meta.excludeKeywords ?? []),
    tradeTypes: arrayToCsv(rule.tradeTypes ?? []),
    targetStates: arrayToCsv(rule.targetStates ?? []),
    minBudget: rule.minBudget != null ? String(rule.minBudget) : "",
    maxBudget: meta.maxBudget != null ? String(meta.maxBudget) : "",
    minScore: meta.minScore != null ? String(meta.minScore) : "",
    weightKeyword: meta.weightKeyword ?? 3,
    weightUrgency: meta.weightUrgency ?? 2,
    weightRecency: meta.weightRecency ?? 2,
    weightBudget: meta.weightBudget ?? 1,
  };
}

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-slate-600 w-20 shrink-0">{label}</Label>
      <Slider
        min={0}
        max={5}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        className="flex-1"
      />
      <span className="text-xs font-bold text-slate-700 w-4 text-right">{value}</span>
    </div>
  );
}

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: OpportunityRule;
  onEdit: (rule: OpportunityRule) => void;
  onDelete: (id: number) => void;
  onToggle: (rule: OpportunityRule) => void;
}) {
  const meta = (rule.metadata ?? {}) as OpportunityRuleMetadata;
  const excludeKeywords = meta.excludeKeywords ?? [];

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${rule.isActive ? "border-slate-200" : "border-slate-100 opacity-70"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${rule.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
              {rule.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(rule)}
            className="text-xs text-slate-500 hover:text-amber-600 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
          >
            {rule.isActive ? "Disable" : "Enable"}
          </button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(rule)} className="text-slate-400 hover:text-slate-600 p-1.5">
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(rule.keywords ?? []).length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Include Keywords</p>
            <div className="flex flex-wrap gap-1">
              {(rule.keywords ?? []).map((kw) => (
                <Badge key={kw} variant="secondary" className="text-xs py-0">{kw}</Badge>
              ))}
            </div>
          </div>
        )}
        {excludeKeywords.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Exclude Keywords</p>
            <div className="flex flex-wrap gap-1">
              {excludeKeywords.map((kw) => (
                <Badge key={kw} className="text-xs py-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-50">{kw}</Badge>
              ))}
            </div>
          </div>
        )}
        {(rule.tradeTypes ?? []).length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Trade Types</p>
            <div className="flex flex-wrap gap-1">
              {(rule.tradeTypes ?? []).map((t) => (
                <Badge key={t} variant="outline" className="text-xs py-0">{t.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          </div>
        )}
        {(rule.targetStates ?? []).length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">States</p>
            <div className="flex flex-wrap gap-1">
              {(rule.targetStates ?? []).map((s) => (
                <Badge key={s} className="text-xs py-0 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100">{s}</Badge>
              ))}
            </div>
          </div>
        )}
        {(rule.minBudget != null || meta.maxBudget != null) && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Budget Range</p>
            <span className="text-sm font-semibold text-slate-700">
              {rule.minBudget != null ? `$${Number(rule.minBudget).toLocaleString()}` : "Any"}
              {" – "}
              {meta.maxBudget != null ? `$${meta.maxBudget.toLocaleString()}` : "No limit"}
            </span>
          </div>
        )}
        {meta.minScore != null && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Min Score</p>
            <span className="text-sm font-semibold text-slate-700">{meta.minScore}</span>
          </div>
        )}
      </div>

      {/* Weight summary */}
      {(meta.weightKeyword != null || meta.weightUrgency != null) && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2">
          {[
            { label: "Keyword", value: meta.weightKeyword ?? 3 },
            { label: "Urgency", value: meta.weightUrgency ?? 2 },
            { label: "Recency", value: meta.weightRecency ?? 2 },
            { label: "Budget", value: meta.weightBudget ?? 1 },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-slate-400">{label}</p>
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-sm ${i < value ? "bg-amber-400" : "bg-slate-100"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: RuleFormData;
  onSubmit: (data: RuleFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RuleFormData>(initial);

  function set<K extends keyof RuleFormData>(key: K, val: RuleFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">
          {initial.name ? "Edit Rule" : "Add Scoring Rule"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Rule Name *</Label>
          <Input
            placeholder="e.g. Ohio Commercial Projects"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">
              Include Keywords
              <span className="ml-1 font-normal text-slate-400">(comma-separated)</span>
            </Label>
            <Input
              placeholder="renovation, commercial"
              value={form.keywords}
              onChange={(e) => set("keywords", e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-slate-400 mt-0.5">Boost score for matches.</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">
              Exclude Keywords
              <span className="ml-1 font-normal text-slate-400">(comma-separated)</span>
            </Label>
            <Input
              placeholder="residential, single-family"
              value={form.excludeKeywords}
              onChange={(e) => set("excludeKeywords", e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-slate-400 mt-0.5">Penalize score for matches.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">
              Trade Types
              <span className="ml-1 font-normal text-slate-400">(comma-separated)</span>
            </Label>
            <Input
              placeholder="general_construction, roofing"
              value={form.tradeTypes}
              onChange={(e) => set("tradeTypes", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">
              Target States
              <span className="ml-1 font-normal text-slate-400">(e.g. OH, IN)</span>
            </Label>
            <Input
              placeholder="OH, IN, KY"
              value={form.targetStates}
              onChange={(e) => set("targetStates", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Min Budget ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 50000"
              value={form.minBudget}
              onChange={(e) => set("minBudget", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Max Budget ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 5000000"
              value={form.maxBudget}
              onChange={(e) => set("maxBudget", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Min Score (0–10)</Label>
            <Input
              type="number"
              min={0}
              max={10}
              placeholder="e.g. 3"
              value={form.minScore}
              onChange={(e) => set("minScore", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-600 font-semibold block mb-2">
            Signal Weights
            <span className="ml-1 font-normal text-slate-400">(0 = ignore, 5 = strong boost)</span>
          </Label>
          <div className="space-y-2.5 bg-slate-50 rounded-lg p-3">
            <WeightSlider label="Keyword" value={form.weightKeyword} onChange={(v) => set("weightKeyword", v)} />
            <WeightSlider label="Urgency" value={form.weightUrgency} onChange={(v) => set("weightUrgency", v)} />
            <WeightSlider label="Recency" value={form.weightRecency} onChange={(v) => set("weightRecency", v)} />
            <WeightSlider label="Budget" value={form.weightBudget} onChange={(v) => set("weightBudget", v)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="rule-active"
            checked={form.isActive}
            onCheckedChange={(v) => set("isActive", v)}
          />
          <Label htmlFor="rule-active" className="text-sm text-slate-700 cursor-pointer">
            Active (apply to scoring)
          </Label>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <Button
          size="sm"
          onClick={() => onSubmit(form)}
          disabled={!form.name.trim() || loading}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          {loading ? "Saving..." : "Save Rule"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminOpportunityRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<OpportunityRule | null>(null);

  const { data, isLoading } = useListOpportunityRules();
  const { mutate: createRule, isPending: creating } = useCreateOpportunityRule();
  const { mutate: updateRule, isPending: updating } = useUpdateOpportunityRule();
  const { mutate: deleteRule } = useDeleteOpportunityRule();

  const rules = data?.rules ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListOpportunityRulesQueryKey() });
  }

  function handleSubmit(formData: RuleFormData) {
    const body = formToApiPayload(formData);

    if (editingRule) {
      updateRule(
        { id: editingRule.id, data: body },
        {
          onSuccess: () => {
            invalidate();
            setEditingRule(null);
            toast({ title: "Rule updated" });
          },
          onError: () => toast({ title: "Failed to update rule", variant: "destructive" }),
        }
      );
    } else {
      createRule(
        { data: body },
        {
          onSuccess: () => {
            invalidate();
            setShowForm(false);
            toast({ title: "Rule created" });
          },
          onError: () => toast({ title: "Failed to create rule", variant: "destructive" }),
        }
      );
    }
  }

  function handleToggle(rule: OpportunityRule) {
    const meta = (rule.metadata ?? {}) as OpportunityRuleMetadata;
    updateRule(
      {
        id: rule.id,
        data: {
          name: rule.name,
          isActive: !rule.isActive,
          keywords: rule.keywords ?? [],
          tradeTypes: rule.tradeTypes ?? [],
          targetStates: rule.targetStates ?? [],
          minBudget: rule.minBudget != null ? Number(rule.minBudget) : undefined,
          metadata: meta,
        },
      },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: rule.isActive ? "Rule disabled" : "Rule enabled" });
        },
        onError: () => toast({ title: "Failed to update rule", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    deleteRule(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Rule deleted" });
        },
        onError: () => toast({ title: "Failed to delete rule", variant: "destructive" }),
      }
    );
  }

  function handleEdit(rule: OpportunityRule) {
    setEditingRule(rule);
    setShowForm(false);
  }

  const activeCount = rules.filter((r) => r.isActive).length;

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
          <h1 className="text-2xl font-extrabold text-slate-900">Scoring Rules</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rules.length} rules · {activeCount} active
          </p>
        </div>
        {!showForm && !editingRule && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </Button>
        )}
      </div>

      {(showForm || editingRule) && (
        <div className="mb-4">
          <RuleForm
            initial={editingRule ? ruleToFormData(editingRule) : INITIAL_FORM}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingRule(null);
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
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No scoring rules configured</p>
          <p className="text-sm">Add rules to boost relevant opportunities</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" /> How Scoring Works
        </h3>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Each active rule is evaluated against incoming opportunities.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Include keywords boost score; exclude keywords reduce it. Weight sliders (0–5) control each signal's contribution.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Budget range, trade types, and target states further filter and rank matches.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            Scores range 0–10 and determine inbox sort order and priority assignment.
          </li>
        </ul>
      </div>
    </div>
  );
}

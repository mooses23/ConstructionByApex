import { Link } from "wouter";
import { ArrowLeft, Settings2, ToggleLeft, ToggleRight, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useListOpportunityRules, useUpdateOpportunityRule } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  states?: string[];
  tradeTypes?: string[];
  minBudget?: number | null;
  maxBudget?: number | null;
  minScore?: number | null;
  urgencyWeight: number;
  recencyWeight: number;
  budgetWeight: number;
  keywordWeight: number;
  createdAt: string;
};

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
      <span className="text-xs text-slate-500 w-20 shrink-0 capitalize">{label}</span>
      <Slider
        min={0}
        max={3}
        step={0.25}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        className="flex-1"
      />
      <span className="text-xs font-mono font-bold text-slate-700 w-8 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

export default function AdminOpportunityRules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localWeights, setLocalWeights] = useState<Record<string, Record<string, number>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading } = useListOpportunityRules();
  const { mutate: updateRule } = useUpdateOpportunityRule();

  const rules: Rule[] = (data?.rules ?? []) as Rule[];

  function getWeight(rule: Rule, field: "urgencyWeight" | "recencyWeight" | "budgetWeight" | "keywordWeight") {
    return localWeights[rule.id]?.[field] ?? rule[field] ?? 1;
  }

  function setWeight(ruleId: string, field: string, value: number) {
    setLocalWeights((prev) => ({
      ...prev,
      [ruleId]: { ...(prev[ruleId] ?? {}), [field]: value },
    }));
  }

  function handleToggle(rule: Rule, enabled: boolean) {
    updateRule(
      { id: rule.id, data: { enabled } as never },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities/rules"] });
          toast({ title: `Rule ${enabled ? "enabled" : "disabled"}` });
        },
        onError: () => toast({ title: "Failed to update rule", variant: "destructive" }),
      }
    );
  }

  function handleSaveWeights(rule: Rule) {
    const weights = localWeights[rule.id];
    if (!weights) return;
    setSavingId(rule.id);
    updateRule(
      { id: rule.id, data: weights as never },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities/rules"] });
          setLocalWeights((prev) => { const n = { ...prev }; delete n[rule.id]; return n; });
          toast({ title: "Weights saved" });
        },
        onError: () => toast({ title: "Failed to save weights", variant: "destructive" }),
        onSettled: () => setSavingId(null),
      }
    );
  }

  const hasPendingChanges = useCallback(
    (ruleId: string) => Object.keys(localWeights[ruleId] ?? {}).length > 0,
    [localWeights]
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 hover:text-slate-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />Back to Opportunities
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-amber-500" />Scoring Rules
        </h1>
        <p className="text-slate-500 text-sm mt-1">Rules filter and weight how opportunities are scored. Higher weights amplify that dimension of the score.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">No rules configured</div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${rule.enabled ? "border-slate-200" : "border-slate-100 opacity-70"}`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {rule.enabled ? (
                    <ToggleRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-slate-300" />
                  )}
                  <span className="font-bold text-slate-800">{rule.name}</span>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleToggle(rule, checked)}
                />
              </div>

              <div className="px-5 py-4">
                {/* Filters summary */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(rule.includeKeywords ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500 self-center">Include:</span>
                      {rule.includeKeywords!.map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-100">{k}</span>
                      ))}
                    </div>
                  )}
                  {(rule.excludeKeywords ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500 self-center">Exclude:</span>
                      {rule.excludeKeywords!.map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs border border-red-100">{k}</span>
                      ))}
                    </div>
                  )}
                  {(rule.states ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500 self-center">States:</span>
                      {rule.states!.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">{s}</span>
                      ))}
                    </div>
                  )}
                  {(rule.tradeTypes ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500 self-center">Trades:</span>
                      {rule.tradeTypes!.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs border border-amber-100">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  )}
                  {rule.minBudget != null && (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-xs border">Min ${Math.round(rule.minBudget / 1000)}K</span>
                  )}
                  {rule.maxBudget != null && (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-xs border">Max ${Math.round(rule.maxBudget / 1000)}K</span>
                  )}
                </div>

                {/* Weight sliders */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    <Sliders className="w-3 h-3" /> Score Weights
                  </div>
                  <WeightSlider label="Urgency" value={getWeight(rule, "urgencyWeight")} onChange={(v) => setWeight(rule.id, "urgencyWeight", v)} />
                  <WeightSlider label="Recency" value={getWeight(rule, "recencyWeight")} onChange={(v) => setWeight(rule.id, "recencyWeight", v)} />
                  <WeightSlider label="Budget" value={getWeight(rule, "budgetWeight")} onChange={(v) => setWeight(rule.id, "budgetWeight", v)} />
                  <WeightSlider label="Keyword" value={getWeight(rule, "keywordWeight")} onChange={(v) => setWeight(rule.id, "keywordWeight", v)} />
                </div>

                {hasPendingChanges(rule.id) && (
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    disabled={savingId === rule.id}
                    onClick={() => handleSaveWeights(rule)}
                  >
                    {savingId === rule.id ? "Saving..." : "Save Weights"}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

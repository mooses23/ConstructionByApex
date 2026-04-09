import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, TrendingUp, MapPin, Calendar, DollarSign, ExternalLink, Clock, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetOpportunity, useUpdateOpportunity, useCreateOpportunityEvent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "dismissed", label: "Dismissed" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  reviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  bookmarked: "bg-purple-100 text-purple-700 border-purple-200",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
};

function ScoreGauge({ score }: { score: number }) {
  const max = 10;
  const pct = Math.min((score / max) * 100, 100);
  const color = score >= 8 ? "bg-green-500" : score >= 4 ? "bg-yellow-500" : "bg-slate-300";
  const tier = score >= 8 ? "High" : score >= 4 ? "Medium" : "Low";
  const tierColor = score >= 8 ? "text-green-600" : score >= 4 ? "text-yellow-600" : "text-slate-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-2xl font-black text-slate-900">{score}</span>
      <span className={`text-xs font-bold uppercase tracking-wide ${tierColor}`}>{tier}</span>
    </div>
  );
}

function formatBudget(min?: number | null, max?: number | null) {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return null;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminOpportunityDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const { data: opp, isLoading } = useGetOpportunity(id);
  const { mutate: updateOpportunity, isPending: updating } = useUpdateOpportunity();
  const { mutate: createEvent, isPending: addingNote } = useCreateOpportunityEvent();

  function handleStatusChange(status: string) {
    updateOpportunity(
      { id, data: { status } as never },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
          toast({ title: "Status updated" });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleAddNote() {
    if (!note.trim()) return;
    createEvent(
      { id, data: { eventType: "note", eventNote: note.trim() } as never },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${id}`] });
          setNote("");
          toast({ title: "Note added" });
        },
        onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Opportunity not found.</p>
        <Link href="/admin/opportunities"><Button variant="outline" className="mt-4">Back to List</Button></Link>
      </div>
    );
  }

  const budget = formatBudget(opp.budgetMin, opp.budgetMax);
  const events = (opp as unknown as { events?: Array<{ id: string; eventType: string; eventNote?: string; createdAt: string }> }).events ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 hover:text-slate-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500 truncate">{opp.title}</span>
      </div>

      {/* Score & Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-extrabold text-slate-900 leading-snug">{opp.title}</h1>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.new}`}>
            {opp.status}
          </span>
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Relevance Score</p>
          <ScoreGauge score={opp.score ?? 0} />
          {opp.scoreReasonsJson && typeof opp.scoreReasonsJson === "object" && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(opp.scoreReasonsJson as Record<string, number>).map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                  {k}: +{v}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {opp.city && opp.state && (
            <div className="flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>{opp.city}, {opp.state}</span>
            </div>
          )}
          {budget && (
            <div className="flex items-start gap-1.5 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>{budget}</span>
            </div>
          )}
          {opp.dueAt && (
            <div className="flex items-start gap-1.5 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>Due {new Date(opp.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          )}
          {opp.postedAt && (
            <div className="flex items-start gap-1.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>Posted {new Date(opp.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {opp.category && <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium capitalize">{opp.category}</span>}
          {opp.tradeType && <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">{opp.tradeType.replace(/_/g, " ")}</span>}
        </div>

        {opp.description && (
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{opp.description}</p>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1 font-medium">Change Status</p>
            <Select value={opp.status} onValueChange={handleStatusChange} disabled={updating}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {opp.sourceUrl && (
            <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 mt-5">
                <ExternalLink className="w-3.5 h-3.5" /> View Source
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-400" /> Activity Log
        </h2>

        {events.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
        ) : (
          <ol className="space-y-4 mb-6">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <div className="shrink-0 mt-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                  {e.eventType === "note" ? (
                    <FileText className="w-3 h-3 text-slate-500" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 capitalize">{e.eventType.replace(/_/g, " ")}</span>
                    <span className="text-xs text-slate-400">{timeAgo(e.createdAt)}</span>
                  </div>
                  {e.eventNote && <p className="text-sm text-slate-700 mt-0.5">{e.eventNote}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Add Note</p>
          <Textarea
            placeholder="Jot down your thoughts about this opportunity..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-sm mb-2"
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!note.trim() || addingNote}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {addingNote ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

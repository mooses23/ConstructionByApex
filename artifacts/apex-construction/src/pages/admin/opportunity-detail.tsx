import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Bookmark,
  XCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useGetOpportunity,
  useUpdateOpportunity,
  useCreateOpportunityEvent,
  useCreateLead,
  useAddLeadNote,
  getGetOpportunityQueryKey,
  getListOpportunitiesQueryKey,
  type OpportunityDetail,
  type Lead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  saved: "bg-purple-100 text-purple-700 border-purple-200",
  dismissed: "bg-slate-100 text-slate-400 border-slate-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  reviewing: "bg-yellow-100 text-yellow-700 border-yellow-200",
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
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
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
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [note, setNote] = useState("");
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const { data: opp, isLoading } = useGetOpportunity(id);
  const { mutate: updateOpportunity, isPending: updating } = useUpdateOpportunity();
  const { mutate: createEvent, isPending: addingNote } = useCreateOpportunityEvent();
  const { mutate: createLead, isPending: converting } = useCreateLead();
  const { mutateAsync: addLeadNote } = useAddLeadNote();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetOpportunityQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
  }

  function handleStatusChange(status: string) {
    updateOpportunity(
      { id, data: { status } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Status updated" });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleAddNote() {
    if (!note.trim()) return;
    createEvent(
      { id, data: { eventType: "note", note: note.trim() } },
      {
        onSuccess: () => {
          invalidate();
          setNote("");
          toast({ title: "Note added" });
        },
        onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
      }
    );
  }

  function handleConvertToLead() {
    if (!opp) return;
    setConvertError(null);

    const preferredMethod = opp.contactEmail ? "email" : "call";
    const location = [opp.city, opp.state].filter(Boolean).join(", ");

    createLead(
      {
        data: {
          fullName: opp.contactName ?? "Unknown",
          phone: opp.contactPhone ?? "",
          email: opp.contactEmail ?? "",
          city: opp.city ?? "",
          zipCode: "",
          serviceNeeded: opp.tradeType?.replace(/_/g, " ") ?? opp.title,
          projectDescription: [
            opp.title,
            opp.description ?? "",
            location ? `Location: ${location}` : "",
          ].filter(Boolean).join("\n\n"),
          preferredTimeline: opp.deadlineAt
            ? `By ${new Date(opp.deadlineAt).toLocaleDateString()}`
            : "Flexible",
          preferredContactMethod: preferredMethod,
        },
      },
      {
        onSuccess: async (lead: Lead) => {
          if (opp.sourceUrl) {
            try {
              await addLeadNote({ id: lead.id, data: { content: `Source: ${opp.sourceUrl}` } });
            } catch (noteErr) {
              console.warn("Failed to add source URL note to lead:", noteErr);
            }
          }
          updateOpportunity({ id, data: { status: "converted" } });
          invalidate();
          toast({
            title: "Lead created successfully",
            description: (
              <span>
                <a
                  href={`/admin/leads/${lead.id}`}
                  className="underline font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/admin/leads/${lead.id}`);
                  }}
                >
                  View Lead #{lead.id}
                </a>
              </span>
            ),
          });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to create lead";
          setConvertError(msg);
        },
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
        <Link href="/admin/opportunities">
          <Button variant="outline" className="mt-4">
            Back to List
          </Button>
        </Link>
      </div>
    );
  }

  const budget = formatBudget(opp.budgetMin, opp.budgetMax);
  const events = (opp as OpportunityDetail).events ?? [];
  const location = [opp.city, opp.state].filter(Boolean).join(", ");

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/opportunities">
          <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 hover:text-slate-900 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500 truncate">{opp.title}</span>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 leading-snug mb-2">{opp.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_COLORS[opp.status] ?? STATUS_COLORS.new}`}>
                {opp.status}
              </span>
              {opp.priorityLevel && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${PRIORITY_COLORS[opp.priorityLevel] ?? ""}`}>
                  {opp.priorityLevel} priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="mb-5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Relevance Score</p>
          <ScoreGauge score={opp.score ?? 0} />
        </div>

        {/* Score Explanation — each reason as a list item */}
        {opp.scoreReasonsJson && Array.isArray(opp.scoreReasonsJson) && opp.scoreReasonsJson.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Score Reasons</p>
            <ul className="space-y-1">
              {(opp.scoreReasonsJson as string[]).map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          {opp.ingestMethod && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Source</p>
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="capitalize">{opp.ingestMethod}</span>
              </div>
            </div>
          )}
          {opp.tradeType && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Trade</p>
              <span className="text-sm text-slate-700">{opp.tradeType.replace(/_/g, " ")}</span>
            </div>
          )}
          {location && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Location</p>
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{location}</span>
              </div>
            </div>
          )}
          {budget && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Budget</p>
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{budget}</span>
              </div>
            </div>
          )}
          {opp.postedAt && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Posted</p>
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{new Date(opp.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          )}
          {opp.deadlineAt && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Due</p>
              <div className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{new Date(opp.deadlineAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <div className="mb-5">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-slate-600 leading-relaxed">{opp.description}</p>
          </div>
        )}

        {/* External link */}
        {opp.sourceUrl && (
          <div className="mb-5">
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Source
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {opp.status !== "saved" && (
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => handleStatusChange("saved")}
              className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </Button>
          )}
          {opp.status !== "dismissed" && (
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => handleStatusChange("dismissed")}
              className="gap-1.5 border-slate-300 text-slate-500 hover:bg-slate-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Dismiss
            </Button>
          )}
          {opp.status !== "reviewing" && opp.status !== "converted" && (
            <Button
              size="sm"
              variant="outline"
              disabled={updating}
              onClick={() => handleStatusChange("reviewing")}
              className="gap-1.5 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Mark Reviewed
            </Button>
          )}
          <Button
            size="sm"
            disabled={converting || opp.status === "converted"}
            onClick={handleConvertToLead}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {converting ? "Creating lead..." : opp.status === "converted" ? "Already Converted" : "Convert to Lead"}
          </Button>
        </div>

        {convertError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {convertError}
          </div>
        )}
      </div>

      {/* Collapsible Raw JSON */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={() => setJsonExpanded((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Raw JSON
          </span>
          {jsonExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {jsonExpanded && (
          <div className="border-t border-slate-100 p-4">
            <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-80 font-mono leading-relaxed">
              {JSON.stringify(opp, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-400" /> Activity Timeline
        </h2>

        {events.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
        ) : (
          <ol className="space-y-4 mb-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 relative">
                <div className="shrink-0 mt-1 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center z-10">
                  {e.eventType === "note" ? (
                    <FileText className="w-3 h-3 text-slate-500" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      {e.eventType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-400">{timeAgo(e.createdAt)}</span>
                  </div>
                  {e.note && <p className="text-sm text-slate-700 mt-0.5">{e.note}</p>}
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
